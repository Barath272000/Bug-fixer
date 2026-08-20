export function repositorySourceType(url:string):'GITHUB'|'GIT'{return url.includes('github.com')?'GITHUB':'GIT';}
export function normalizeRepositoryUrl(url:string):string{const normalized=url.trim();if(!/^https?:\/\//.test(normalized)&&!/^git@/.test(normalized))throw new Error('Repository URL must be an HTTPS or SSH Git URL');return normalized.replace(/\.git$/,'');}
