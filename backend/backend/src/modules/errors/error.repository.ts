import {prisma}from'../../config/database.js';export const errorRepository={list(projectId:string){return prisma.errorRecord.findMany({where:{projectId},orderBy:{createdAt:'desc'},take:500});}};
