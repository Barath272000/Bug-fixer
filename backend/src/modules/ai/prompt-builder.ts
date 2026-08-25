export function buildDiagnosisPrompt(context:string):string{return `You are a senior debugging engineer. Analyze the supplied project context. Return valid JSON with keys rootCause, explanation, confidence, patchSummary, affectedFiles, estimatedMinutes, originalCode, proposedCode, unifiedDiff. Do not claim tests passed unless test evidence is provided.

CONTEXT:
${context}`;}
export function buildCopilotPrompt(context:string,userMessage:string):string{return `You are a repository-aware coding copilot. Answer the user and propose changes only when evidence in the context supports them. Return JSON with keys answer, proposal. Proposal must be null or contain file,title,description,explanation,startLine,endLine,originalCode,proposedCode,diffSummary.

PROJECT CONTEXT:
${context}

USER:
${userMessage}`;}
