import { apiRequest } from './client';
import { AIFixHistoryItem } from '../types';

interface BackendFix {
  id: string;
  model: string;
  confidence: number;
  patchSummary: string;
  unifiedDiff: string;
  linesChanged: number;
  estimatedMinutes: number;
  status: string;
  createdAt: string;
  bug: {
    code: string;
    title: string;
  };
}

function toFrontendFix(f: BackendFix): AIFixHistoryItem {
  return {
    id: f.id,
    bugId: f.bug.code,
    bugTitle: f.bug.title,
    patchSummary: f.patchSummary,
    date: f.createdAt.slice(0, 10),
    model: f.model,
    confidence: f.confidence,
    status: f.status as AIFixHistoryItem['status'],
    lines: f.linesChanged,
    estTime: `${f.estimatedMinutes}m`,
    fullDiff: f.unifiedDiff,
  };
}

export async function fetchFixHistory(): Promise<AIFixHistoryItem[]> {
  const result = await apiRequest<BackendFix[]>('/fixes/history');
  return result.map(toFrontendFix);
}