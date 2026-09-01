import { prisma } from '../../config/database.js';
import { AppError } from '../../common/errors/AppError.js';

// ISO week key like "2026-W35", used to bucket resolved bugs for the MTTR trend.
function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export async function getAnalytics(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, ownerId: userId } });
  if (!project) throw new AppError(404, 'PROJECT_NOT_FOUND', 'Project was not found');

  const [bugs, fixes, tests] = await Promise.all([
    prisma.bug.findMany({
      where: { projectId },
      select: { status: true, severity: true, component: true, loggedDate: true, updatedAt: true },
    }),
    prisma.fixProposal.findMany({
      where: { projectId },
      select: { status: true, confidence: true, createdAt: true, appliedAt: true },
    }),
    prisma.testRun.findMany({
      where: { projectId },
      select: { total: true, passed: true, failed: true, createdAt: true },
    }),
  ]);

  const totalTests = tests.reduce((s, t) => s + t.total, 0);
  const passedTests = tests.reduce((s, t) => s + t.passed, 0);

  // Only count bugs that are actually resolved for MTTR/trend purposes — an
  // Open bug's "updatedAt - loggedDate" isn't a repair time, it's just noise.
  const resolvedBugs = bugs.filter((b) => b.status === 'Fixed' || b.status === 'Closed');
  const repaired = fixes.filter((f) => f.status === 'Applied').length;

  const mean = resolvedBugs.length
    ? resolvedBugs.reduce((s, b) => s + (b.updatedAt.getTime() - b.loggedDate.getTime()), 0) / resolvedBugs.length
    : 0;

  // Real root-cause distribution, grouped by the component the bug was filed against
  // (not severity — severity isn't a "cause"). Uncategorized bugs get grouped together
  // instead of silently dropped.
  const rootCauses = bugs.reduce<Record<string, number>>((acc, b) => {
    const key = b.component?.trim() || 'Uncategorized';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  // Real weekly AI resolution-time trend. There's no "manual repair time" tracked
  // anywhere in this system (no human-triage baseline exists), so we only report
  // the one real series instead of fabricating a comparison line.
  const weekBuckets = new Map<string, { totalHours: number; count: number }>();
  for (const b of resolvedBugs) {
    const week = isoWeekKey(b.updatedAt);
    const hours = (b.updatedAt.getTime() - b.loggedDate.getTime()) / 3_600_000;
    const bucket = weekBuckets.get(week) ?? { totalHours: 0, count: 0 };
    bucket.totalHours += hours;
    bucket.count += 1;
    weekBuckets.set(week, bucket);
  }
  const mttrTrend = Array.from(weekBuckets.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([week, { totalHours, count }]) => ({
      week,
      avgResolutionHours: Math.round((totalHours / count) * 10) / 10,
      resolvedCount: count,
    }));

  return {
    mttrMinutes: Math.round(mean / 60000),
    aiRepairedBugs: repaired,
    testPassRate: totalTests ? Math.round((passedTests / totalTests) * 100) : 0,
    bugsDetected: bugs.length,
    fixesGenerated: fixes.length,
    // Token/cost accounting isn't implemented anywhere in ai.service.ts yet —
    // report this honestly instead of a fabricated number.
    aiComputeCost: null as number | null,
    costTracked: false,
    rootCauses,
    mttrTrend,
    timeline: {
      bugs: bugs.map((b) => ({ date: b.loggedDate.toISOString().slice(0, 10), status: b.status })),
      fixes: fixes.map((f) => ({ date: f.createdAt.toISOString().slice(0, 10), status: f.status, confidence: f.confidence })),
    },
  };
}