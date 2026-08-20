import{parseText}from'./text.parser.js';export function parseMarkdown(content:Buffer):string{return parseText(content);}
