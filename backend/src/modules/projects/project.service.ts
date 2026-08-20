import { projectRepository } from './project.repository.js';
import { AppError } from '../../common/errors/AppError.js';
import { prisma } from '../../config/database.js';

export async function listProjects(ownerId: string, page: number, limit: number) { const [items,total] = await Promise.all([projectRepository.list(ownerId,(page-1)*limit,limit), projectRepository.count(ownerId)]); return { items, page, limit, total }; }
export async function getProject(ownerId: string,id: string) { const project=await projectRepository.find(ownerId,id); if(!project) throw new AppError(404,'PROJECT_NOT_FOUND','Project was not found'); return project; }
export async function createProject(ownerId: string,input:{name:string;sourceType:'ZIP'|'GITHUB'|'PASTE';repositoryUrl?:string;defaultBranch?:string}) { const project=await projectRepository.create(ownerId,input); await prisma.projectSetting.create({data:{projectId:project.id}}); await prisma.workspace.create({data:{projectId:project.id,rootPath:''}}); return project; }
export async function deleteProject(ownerId:string,id:string){await getProject(ownerId,id); return projectRepository.delete(id);}
