import{executeInDocker}from'./container-manager.js';export const dockerService={execute(workspace:string,command:string){return executeInDocker(workspace,command);}};
