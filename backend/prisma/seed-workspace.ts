/**
 * DEV-ONLY. Creates (or reuses) a Project + Workspace for the dev user so
 * the frontend's Workspace IDE has a real folder on disk to read/write.
 *
 * Run with:
 *   cd backend
 *   npx tsx prisma/seed-workspace.ts
 *
 * Requires: the dev user already seeded (npx tsx prisma/seed-dev-user.ts)
 * and migrations applied.
 */
import { PrismaClient, SourceType, ProjectStatus } from '@prisma/client';
import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../src/config/env.js';

const prisma = new PrismaClient();

const DEV_EMAIL = 'dev@bugfixer.local';

// This is the frontend's hardcoded WORKSPACE_ID (frontend/src/api/workspace.ts).
// We reuse it so no frontend change is needed to point at this workspace.
const WORKSPACE_ID = 'd507863e-4c6d-4d26-b15e-ba21cc022f79';

const DEMO_PROJECT_ID = 'demo-project';

// Match the same convention the real analysis pipeline uses
// (backend/src/jobs/analysis.worker.ts): SANDBOX_WORK_ROOT/{projectId}/{analysisId}.
// We use a fixed "seed" analysisId slot since this bypasses the real upload+analysis flow.
const ROOT_PATH = path.resolve(env.SANDBOX_WORK_ROOT, DEMO_PROJECT_ID, 'seed');

const SAMPLE_FILES: Record<string, string> = {
  'src/services/auth_service.py': `import os, jwt

def validate_session(token: str) -> bool:
    if not token:
        return False
    session = db.query("SELECT * FROM sessions WHERE token = %s", token)
    user_id = session[0].get('id')
    return user_id is not None
`,
  'src/services/database_utils.js': `// Simple query helper used by services in this demo project.
export async function query(sql, params) {
  // TODO: replace with a real DB client.
  return [];
}
`,
  'README.md': `# Demo Project

This folder is a real workspace on disk. Files opened in the Workspace IDE
are read from and written to this directory via the backend's
/workspaces/:id/tree and /workspaces/:id/file endpoints.

Edit freely — changes here are saved for real.
`,
};

async function main(): Promise<void> {
  try {
    const user = await prisma.user.findUnique({ where: { email: DEV_EMAIL } });
    if (!user) {
      throw new Error(
        `Dev user not found. Run "npx tsx prisma/seed-dev-user.ts" first.`
      );
    }

    // Create the sample files on disk (idempotent: only writes if missing).
    for (const [relPath, content] of Object.entries(SAMPLE_FILES)) {
      const fullPath = path.join(ROOT_PATH, relPath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      try {
        await fs.access(fullPath);
        // File already exists — leave it alone so we don't clobber edits.
      } catch {
        await fs.writeFile(fullPath, content, 'utf8');
      }
    }

    let project = await prisma.project.findFirst({
      where: { ownerId: user.id, name: 'Demo Project' },
    });

    if (!project) {
      project = await prisma.project.create({
        data: {
          ownerId: user.id,
          name: 'Demo Project',
          sourceType: SourceType.PASTE,
          status: ProjectStatus.READY,
          workspacePath: ROOT_PATH,
          language: 'python',
        },
      });
      console.log(`Created project: ${project.id}`);
    } else {
      console.log(`Reusing existing project: ${project.id}`);
    }

    const existingWorkspace = await prisma.workspace.findUnique({
      where: { projectId: project.id },
    });

    if (!existingWorkspace) {
      // Force the id to match the frontend's hardcoded WORKSPACE_ID.
      await prisma.workspace.create({
        data: { id: WORKSPACE_ID, projectId: project.id, rootPath: ROOT_PATH },
      });
      console.log(`Created workspace: ${WORKSPACE_ID}`);
    } else if (existingWorkspace.id !== WORKSPACE_ID) {
      console.warn(
        `Workspace already exists for this project with id ${existingWorkspace.id}, ` +
        `which does not match the frontend's hardcoded WORKSPACE_ID (${WORKSPACE_ID}). ` +
        `Update WORKSPACE_ID in frontend/src/api/workspace.ts to ${existingWorkspace.id}.`
      );
    } else {
      console.log(`Reusing existing workspace: ${existingWorkspace.id}`);
    }

    console.log(`\nWorkspace root on disk: ${ROOT_PATH}\n`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();