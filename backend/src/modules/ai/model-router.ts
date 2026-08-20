import {env} from '../../config/env.js';import {prisma} from '../../config/database.js';
export async function resolveModel(requestedProvider?:string,requestedModel?:string){const provider=(requestedProvider??env.DEFAULT_AI_PROVIDER);const model=requestedModel??env.DEFAULT_AI_MODEL;const config=await prisma.aIModelConfig.findUnique({where:{modelId:model}});return{provider,model,config};}
