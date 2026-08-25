import crypto from 'node:crypto';import {prisma} from '../../config/database.js';
export function fingerprint(message:string,stackTrace?:string){return crypto.createHash('sha256').update(`${message}
${stackTrace??''}`).digest('hex').slice(0,32);}
export async function recordError(input:{projectId:string;analysisRunId?:string;name?:string;message:string;stackTrace?:string;filePath?:string;lineNumber?:number;source?:string}){return prisma.errorRecord.create({data:{...input,fingerprint:fingerprint(input.message,input.stackTrace)}});}
