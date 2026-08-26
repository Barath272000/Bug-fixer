import { apiRequest } from './client';

export interface WorkspaceTreeNode {
  name: string;
  path: string;
  type: 'folder' | 'file';
  children?: WorkspaceTreeNode[];
}

const WORKSPACE_ID = 'd507863e-4c6d-4d26-b15e-ba21cc022f79';

export async function fetchWorkspaceTree(): Promise<WorkspaceTreeNode[]> {
  return apiRequest<WorkspaceTreeNode[]>(`/workspaces/${WORKSPACE_ID}/tree`);
}

export async function fetchWorkspaceFile(path: string): Promise<{ path: string; content: string }> {
  return apiRequest<{ path: string; content: string }>(`/workspaces/${WORKSPACE_ID}/file?path=${encodeURIComponent(path)}`);
}

export async function saveWorkspaceFile(path: string, content: string): Promise<{ path: string }> {
  return apiRequest<{ path: string }>(`/workspaces/${WORKSPACE_ID}/file`, {
    method: 'PUT',
    body: { path, content },
  });
}