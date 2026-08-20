export interface ChatRequest{model:string;system:string;user:string;maxTokens?:number;temperature?:number;apiKey?:string;baseUrl?:string;}
export interface AIProvider{chat(request:ChatRequest):Promise<string>;}
