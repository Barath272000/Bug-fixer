import{prisma}from'../../config/database.js';export const logRepository={create(data:Parameters<typeof prisma.pipelineLog.create>[0]['data']){return prisma.pipelineLog.create({data});}};
