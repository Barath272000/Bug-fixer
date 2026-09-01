import { z } from 'zod';
import { AppError } from '../../../common/errors/AppError.js';
import { listRepos, connectRepository, saveGithubToken, getGithubToken, hasGithubToken } from './github.service.js';

async function resolveToken(request: import('express').Request): Promise<string> {
  const headerToken = request.header('x-github-token');
  if (headerToken && headerToken.length >= 10) {
    await saveGithubToken(request.user!.id, headerToken);
    return headerToken;
  }
  const saved = await getGithubToken(request.user!.id);
  if (!saved) throw new AppError(400, 'GITHUB_TOKEN_REQUIRED', 'No GitHub token saved for this account yet');
  return saved;
}

export async function repos(request: import('express').Request, response: import('express').Response) {
  try {
    const token = await resolveToken(request);
    response.json(await listRepos(token));
  } catch (error) { throw error; }
}

export async function connect(request: import('express').Request, response: import('express').Response) {
  try {
    const token = await resolveToken(request);
    const input = z.object({ projectId: z.string().uuid(), owner: z.string().min(1), repo: z.string().min(1), branch: z.string().min(1).optional() }).parse(request.body);
    response.json(await connectRepository(request.user!.id, input.projectId, token, input.owner, input.repo, input.branch));
  } catch (error) { throw error; }
}

export async function saveToken(request: import('express').Request, response: import('express').Response) {
  try {
    const input = z.object({ token: z.string().min(10) }).parse(request.body);
    await saveGithubToken(request.user!.id, input.token);
    response.status(204).send();
  } catch (error) { throw error; }
}

export async function tokenStatus(request: import('express').Request, response: import('express').Response) {
  try {
    response.json({ connected: await hasGithubToken(request.user!.id) });
  } catch (error) { throw error; }
}