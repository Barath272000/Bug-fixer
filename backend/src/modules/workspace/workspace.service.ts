import fs from'node:fs/promises';import path from'node:path';import{execFile}from'node:child_process';import{promisify}from'node:util';import{prisma}from'../../config/database.js';import{AppError}from'../../common/errors/AppError.js';import{resolveSafePath}from'../../common/utils/safe-path.js';import{runSandbox}from'../sandbox/sandbox.service.js';
const execFileAsync=promisify(execFile);
async function workspaceFor(userId:string,id:string){const ws=await prisma.workspace.findFirst({where:{id,project:{ownerId:userId}},include:{project:true}});if(!ws)throw new AppError(404,'WORKSPACE_NOT_FOUND','Workspace was not found');return ws;}
interface WorkspaceTreeNode{name:string;path:string;type:'folder'|'file';children?:WorkspaceTreeNode[]}
async function walk(root:string,current:string,depth:number):Promise<WorkspaceTreeNode[]>{if(depth>20)return[];const entries=await fs.readdir(current,{withFileTypes:true});const result:WorkspaceTreeNode[]=[];for(const entry of entries){if(['.git','node_modules','.venv','dist','build'].includes(entry.name))continue;const full=path.join(current,entry.name);const rel=path.relative(root,full);if(entry.isDirectory())result.push({name:entry.name,path:rel,type:'folder',children:await walk(root,full,depth+1)});else result.push({name:entry.name,path:rel,type:'file'});}return result.sort((a,b)=>a.type===b.type?a.name.localeCompare(b.name):a.type==='folder'?-1:1);}
export async function tree(userId:string,id:string){const ws=await workspaceFor(userId,id);return walk(ws.rootPath,ws.rootPath,0);}
export async function readFile(userId:string,id:string,file:string){const ws=await workspaceFor(userId,id);const target=resolveSafePath(ws.rootPath,file);const stat=await fs.stat(target);if(!stat.isFile())throw new AppError(400,'NOT_A_FILE','The requested path is not a file');if(stat.size>2_000_000)throw new AppError(413,'FILE_TOO_LARGE','Workspace file exceeds the editor limit');return{path:file,content:await fs.readFile(target,'utf8')};}
export async function writeFile(userId:string,id:string,file:string,content:string){const ws=await workspaceFor(userId,id);if(content.length>5_000_000)throw new AppError(413,'CONTENT_TOO_LARGE','File content exceeds the editor limit');const target=resolveSafePath(ws.rootPath,file);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,content,'utf8');return{path:file};}

// --- Terminal: run a real command inside the same Docker sandbox used for fix validation. ---
export interface ExecResult{stdout:string;stderr:string;code:number;durationMs:number}
export async function execCommand(userId:string,id:string,command:string):Promise<ExecResult>{
  const ws=await workspaceFor(userId,id);
  if(!command.trim())throw new AppError(400,'EMPTY_COMMAND','Command is required');
  const result=await runSandbox(ws.rootPath,command);
  return{stdout:result.stdout,stderr:result.stderr,code:result.code,durationMs:result.durationMs};
}

// --- Find in Files: real recursive text search over the workspace. ---
export interface SearchMatch{file:string;line:number;preview:string}
const SEARCH_SKIP_DIRS=new Set(['.git','node_modules','.venv','dist','build','sandbox-work']);
const SEARCH_MAX_MATCHES=200;
const SEARCH_MAX_FILE_BYTES=1_000_000;
async function collectSearchableFiles(root:string,current:string,depth:number,out:string[]):Promise<void>{
  if(depth>20||out.length>=2000)return;
  const entries=await fs.readdir(current,{withFileTypes:true});
  for(const entry of entries){
    if(SEARCH_SKIP_DIRS.has(entry.name))continue;
    const full=path.join(current,entry.name);
    if(entry.isDirectory()){await collectSearchableFiles(root,full,depth+1,out);}
    else{out.push(full);}
    if(out.length>=2000)return;
  }
}
export async function searchWorkspace(userId:string,id:string,query:string):Promise<SearchMatch[]>{
  const ws=await workspaceFor(userId,id);
  const trimmed=query.trim();
  if(!trimmed)throw new AppError(400,'EMPTY_QUERY','Search query is required');
  const needle=trimmed.toLowerCase();
  const files:string[]=[];
  await collectSearchableFiles(ws.rootPath,ws.rootPath,0,files);
  const matches:SearchMatch[]=[];
  for(const file of files){
    if(matches.length>=SEARCH_MAX_MATCHES)break;
    let stat;
    try{stat=await fs.stat(file);}catch{continue;}
    if(!stat.isFile()||stat.size>SEARCH_MAX_FILE_BYTES)continue;
    let content:string;
    try{content=await fs.readFile(file,'utf8');}catch{continue;} // skip binary/unreadable
    const lines=content.split('\n');
    for(let i=0;i<lines.length;i++){
      if(lines[i].toLowerCase().includes(needle)){
        matches.push({file:path.relative(ws.rootPath,file),line:i+1,preview:lines[i].trim().slice(0,200)});
        if(matches.length>=SEARCH_MAX_MATCHES)break;
      }
    }
  }
  return matches;
}

// --- Source Control: real git status/diff. Lazily initializes a repo so edits are always trackable. ---
async function runGit(cwd:string,args:string[]):Promise<string>{
  try{const{stdout}=await execFileAsync('git',args,{cwd,maxBuffer:5_000_000});return stdout;}
  catch(error:any){if(error?.stdout!==undefined)return error.stdout;throw error;}
}
async function ensureGitRepo(root:string):Promise<void>{
  try{await fs.access(path.join(root,'.git'));return;}catch{/* not a repo yet */}
  await runGit(root,['init']);
  await runGit(root,['config','user.email','dev@bugfixer.local']);
  await runGit(root,['config','user.name','BugFixer Dev']);
  await runGit(root,['add','-A']);
  try{await runGit(root,['commit','-m','Initial workspace snapshot','--allow-empty']);}catch{/* nothing to commit */}
}
export interface GitStatusEntry{path:string;status:string}
export interface GitStatusResult{branch:string;entries:GitStatusEntry[]}
export async function gitStatus(userId:string,id:string):Promise<GitStatusResult>{
  const ws=await workspaceFor(userId,id);
  await ensureGitRepo(ws.rootPath);
  const branchOut=await runGit(ws.rootPath,['rev-parse','--abbrev-ref','HEAD']);
  const statusOut=await runGit(ws.rootPath,['status','--porcelain=v1']);
  const entries:GitStatusEntry[]=statusOut.split('\n').filter(Boolean).map(line=>({status:line.slice(0,2).trim(),path:line.slice(3)}));
  return{branch:branchOut.trim()||'main',entries};
}
export async function gitDiff(userId:string,id:string,file?:string):Promise<string>{
  const ws=await workspaceFor(userId,id);
  await ensureGitRepo(ws.rootPath);
  const args=file?['diff','--',file]:['diff'];
  return runGit(ws.rootPath,args);
}
export async function gitCommit(userId:string,id:string,message:string):Promise<{committed:boolean}>{
  const ws=await workspaceFor(userId,id);
  await ensureGitRepo(ws.rootPath);
  await runGit(ws.rootPath,['add','-A']);
  const trimmed=message.trim()||'Workspace update';
  try{await runGit(ws.rootPath,['commit','-m',trimmed]);return{committed:true};}
  catch{return{committed:false};}
}