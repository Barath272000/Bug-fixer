export function parsePdf(content:Buffer):string{const text=content.toString('utf8');return text.replace(/[^\x09\x0A\x0D\x20-\x7E]/g,' ');}
