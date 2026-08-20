import { z } from 'zod';
import { paginationSchema } from '../../common/utils/pagination.js';
import { createProject,getProject,listProjects,deleteProject } from './project.service.js';
const createSchema=z.object({name:z.string().min(1).max(120),sourceType:z.enum(['ZIP','GITHUB','PASTE']),repositoryUrl:z.string().url().optional(),defaultBranch:z.string().min(1).max(200).optional()});
export async function list(request: import('express').Request,response: import('express').Response){try{const p=paginationSchema.parse(request.query);response.json(await listProjects(request.user!.id,p.page,p.limit));}catch(error){throw error;}}
export async function get(request: import('express').Request,response: import('express').Response){try{response.json(await getProject(request.user!.id,request.params.id));}catch(error){throw error;}}
export async function create(request: import('express').Request,response: import('express').Response){try{response.status(201).json(await createProject(request.user!.id,createSchema.parse(request.body)));}catch(error){throw error;}}
export async function remove(request: import('express').Request,response: import('express').Response){try{await deleteProject(request.user!.id,request.params.id);response.status(204).send();}catch(error){throw error;}}
