export const realtimeEvents = {
  analysisStarted: 'analysis.started',
  phaseStarted: 'phase.started',
  phaseProgress: 'phase.progress',
  logCreated: 'log.created',
  errorDetected: 'error.detected',
  bugCreated: 'bug.created',
  aiAnalysisStarted: 'ai.analysis.started',
  patchGenerated: 'ai.patch.generated',
  validationStarted: 'validation.started',
  validationCompleted: 'validation.completed',
  analysisCompleted: 'analysis.completed',
  analysisFailed: 'analysis.failed'
} as const;
