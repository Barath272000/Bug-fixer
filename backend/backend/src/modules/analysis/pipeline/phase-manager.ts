export const pipelineDefinitions=[
 {number:1,name:'Project Input',description:'Validate source archive, repository metadata, and context documents.'},
 {number:2,name:'Project Setup',description:'Detect language, framework, dependencies, structure, and analysis targets.'},
 {number:3,name:'Isolated Environment',description:'Create a constrained sandbox for safe project execution.'},
 {number:4,name:'Install & Build',description:'Install dependencies and build the project using its detected runtime.'},
 {number:5,name:'Run & Test',description:'Run unit, integration, API, and runtime checks.'},
 {number:6,name:'Error Collection',description:'Normalize, fingerprint, group, and persist runtime and test failures.'},
 {number:7,name:'AI Root Cause Analysis',description:'Build source-aware context and generate root-cause diagnoses.'},
 {number:8,name:'AI Patch & Validation',description:'Generate patches, apply them in a sandbox, validate, and persist results.'}
] as const;
