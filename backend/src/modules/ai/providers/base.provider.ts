export interface ChatRequest{model:string;system:string;user:string;maxTokens?:number;temperature?:number;apiKey?:string;baseUrl?:string|null;}
export interface AIProvider{chat(request:ChatRequest):Promise<string>;}
