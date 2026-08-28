import { apiRequest, ApiError } from './client';

export interface WorkspaceTreeNode {
  name: string;
  path: string;
  type: 'folder' | 'file';
  children?: WorkspaceTreeNode[];
}

interface ProjectWithWorkspace {
  id: string;
  workspace?: { id: string; rootPath: string } | null;
}

// Cache the resolved workspace ID per project so we don't refetch the
// project on every single tree/file call within a session.
const workspaceIdCache = new Map<string, string>();

async function resolveWorkspaceId(projectId: string): Promise<string> {
  const cached = workspaceIdCache.get(projectId);
  if (cached) return cached;

  const project = await apiRequest<ProjectWithWorkspace>(`/projects/${projectId}`);
  if (!project.workspace?.id) {
    throw new ApiError(0, 'This project has no workspace yet. Upload or connect a project first.');
  }
  workspaceIdCache.set(projectId, project.workspace.id);
  return project.workspace.id;
}

/** Call this after deleting/recreating a project so a stale workspace ID isn't reused. */
export function clearWorkspaceCache(projectId?: string): void {
  if (projectId) workspaceIdCache.delete(projectId);
  else workspaceIdCache.clear();
}

export async function fetchWorkspaceTree(projectId: string): Promise<WorkspaceTreeNode[]> {
  const workspaceId = await resolveWorkspaceId(projectId);
  return apiRequest<WorkspaceTreeNode[]>(`/workspaces/${workspaceId}/tree`);
}

export async function fetchWorkspaceFile(projectId: string, path: string): Promise<{ path: string; content: string }> {
  const workspaceId = await resolveWorkspaceId(projectId);
  return apiRequest<{ path: string; content: string }>(`/workspaces/${workspaceId}/file?path=${encodeURIComponent(path)}`);
}

export async function saveWorkspaceFile(projectId: string, path: string, content: string): Promise<{ path: string }> {
  const workspaceId = await resolveWorkspaceId(projectId);
  return apiRequest<{ path: string }>(`/workspaces/${workspaceId}/file`, {
    method: 'PUT',
    body: { path, content },
  });
}