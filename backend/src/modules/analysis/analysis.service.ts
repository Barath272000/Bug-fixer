import { prisma } from '../../config/database.js';
import { AppError } from '../../common/errors/AppError.js';
import { analysisQueue } from '../../jobs/queue.js';
import { pipelineDefinitions } from './pipeline/phase-manager.js';

export async function createAnalysis(ownerId:string,projectId:string){
 const project=await prisma.project.findFirst({where:{id:projectId,ownerId}}); if(!project) throw new AppError(404,'PROJECT_NOT_FOUND','Project was not found');
 const run=await prisma.analysisRun.create({data:{projectId,requestedBy:ownerId,phases:{create:pipelineDefinitions.map((p)=>({number:p.number,name:p.name,description:p.description}))}}});
 await prisma.project.update({where:{id:projectId},data:{status:'ANALYZING'}}); await analysisQueue.add('analysis',{analysisId:run.id,projectId,ownerId},{jobId:run.id}); return run;
}
export async function getAnalysis(ownerId:string,id:string){const run=await prisma.analysisRun.findFirst({where:{id,project:{ownerId}},include:{phases:{orderBy:{number:'asc'}},logs:{orderBy:{timestamp:'asc'},take:2000},tests:{orderBy:{createdAt:'desc'}},bugs:{orderBy:{updatedAt:'desc'}}}});if(!run)throw new AppError(404,'ANALYSIS_NOT_FOUND','Analysis run was not found');return run;}
export async function listAnalyses(ownerId:string,projectId:string){const project=await prisma.project.findFirst({where:{id:projectId,ownerId}});if(!project)throw new AppError(404,'PROJECT_NOT_FOUND','Project was not found');return prisma.analysisRun.findMany({where:{projectId},orderBy:{createdAt:'desc'},take:100,include:{phases:{orderBy:{number:'asc'}}}});}
export async function cancelAnalysis(ownerId:string,id:string){const run=await getAnalysis(ownerId,id);if(['COMPLETED','FAILED','CANCELLED'].includes(run.status))return run;return prisma.analysisRun.update({where:{id},data:{status:'CANCELLED',completedAt:new Date(),errorMessage:'Cancelled by user'}});}

export async function listRecentAnalyses(ownerId: string, limit = 20) {
  const runs = await prisma.analysisRun.findMany({
    where: { project: { ownerId } },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      project: { select: { id: true, name: true } },
      bugs: { select: { status: true } },
    },
  });

  const items = runs.map((run) => {
    const bugsFound = run.bugs.length;
    const bugsFixed = run.bugs.filter((b) => b.status === 'Fixed' || b.status === 'Closed').length;
    const durationMs = run.startedAt && run.completedAt ? run.completedAt.getTime() - run.startedAt.getTime() : null;
    return {
      id: run.id,
      projectId: run.projectId,
      projectName: run.project.name,
      status: run.status,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      createdAt: run.createdAt,
      durationMs,
      bugsFound,
      bugsFixed,
    };
  });

  const [totalRuns, fixed, failed] = await Promise.all([
    prisma.analysisRun.count({ where: { project: { ownerId } } }),
    prisma.analysisRun.count({ where: { project: { ownerId }, status: 'COMPLETED' } }),
    prisma.analysisRun.count({ where: { project: { ownerId }, status: 'FAILED' } }),
  ]);

  return { items, stats: { totalRuns, fixed, failed } };
}
