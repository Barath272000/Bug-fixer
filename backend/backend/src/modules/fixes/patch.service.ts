import fs from'node:fs/promises';import path from'node:path';import{resolveSafePath}from'../../common/utils/safe-path.js';
export async function readWorkspaceFile(root:string,file:string){return fs.readFile(resolveSafePath(root,file),'utf8');}
export async function writeWorkspaceFile(root:string,file:string,content:string){const target=resolveSafePath(root,file);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,content,'utf8');return target;}
export function applySimpleReplacement(original:string,oldText:string,newText:string){if(!original.includes(oldText))throw new Error('Original code context was not found');return original.replace(oldText,newText);}
