export function parseJsonDocument(content:Buffer):string{return JSON.stringify(JSON.parse(content.toString('utf8')),null,2);}
