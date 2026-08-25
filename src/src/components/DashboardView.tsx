import React, { useState, useEffect, useRef } from 'react';
import { 
  UploadCloud, 
  Play, 
  RotateCw, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Cpu, 
  AlertCircle, 
  Boxes, 
  Search, 
  Download, 
  Folder, 
  FileCode, 
  Layers, 
  Github, 
  Code, 
  Check, 
  Zap,
  Terminal,
  Activity,
  CheckCircle,
  BookOpen,
  FileCheck
} from 'lucide-react';
import { pipelinePhases as initialPipelinePhases, initialLogs } from '../data/mockData';
import { LogLine, PipelinePhase, ContextDoc } from '../types';
import { LiveLogTable, ExtendedLogLine } from './LiveLogTable';
import { ContextDocsUploader } from './ContextDocsUploader';
import { PhaseInspectorModal } from './PhaseInspectorModal';

const extendedInitialLogs: ExtendedLogLine[] = [
  { 
    id: '1', 
    timestamp: '10:31:04.120', 
    level: 'INFO', 
    category: 'setup', 
    phaseName: 'Project Input',
    durationMs: 18,
    message: 'Validating project ZIP archive: fastapi-gateway-v1.4.zip (4.8MB)...',
    details: 'Archive SHA256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069\nValid zip header confirmed. 34 files, 6 directories found.'
  },
  { 
    id: '1-ctx', 
    timestamp: '10:31:04.210', 
    level: 'PASS', 
    category: 'setup', 
    phaseName: 'Project Input',
    durationMs: 14,
    message: 'Loaded context documentation: openapi-spec.yaml (18.4 KB) & architecture rules.',
    details: 'Grounding AST engine with OpenAPI 3.0.3 endpoints (/api/v1/auth/user) and strict JWT HMAC-SHA256 standards.'
  },
  { 
    id: '2', 
    timestamp: '10:31:04.380', 
    level: 'PASS', 
    category: 'setup', 
    phaseName: 'Project Setup',
    durationMs: 42,
    message: 'Tech stack detected: Python 3.11.6, FastAPI 0.104.1, SQLAlchemy 2.0.23, Redis 5.0.1' 
  },
  { 
    id: '3', 
    timestamp: '10:31:05.010', 
    level: 'INFO', 
    category: 'setup', 
    phaseName: 'Project Setup',
    durationMs: 24,
    message: 'AST tree construction initialized with tree-sitter-python & context doc bindings' 
  },
  { 
    id: '4', 
    timestamp: '10:31:06.220', 
    level: 'INFO', 
    category: 'docker', 
    phaseName: 'Isolated Environment',
    durationMs: 140,
    message: 'Spinning up isolated Docker container: python:3.11-slim (2 vCPU, 4096MB memory)' 
  },
  { 
    id: '5', 
    timestamp: '10:31:18.910', 
    level: 'PASS', 
    category: 'docker', 
    phaseName: 'Isolated Environment',
    durationMs: 820,
    message: 'Container spawned with cgroup isolation & seccomp profile [PID 4092]' 
  },
  { 
    id: '6', 
    timestamp: '10:31:19.450', 
    level: 'INFO', 
    category: 'install', 
    phaseName: 'Install & Build',
    durationMs: 310,
    message: 'pip install -r requirements.txt --no-cache-dir --disable-pip-version-check' 
  },
  { 
    id: '7', 
    timestamp: '10:31:44.200', 
    level: 'PASS', 
    category: 'install', 
    phaseName: 'Install & Build',
    durationMs: 25300,
    message: '47 packages installed successfully into virtualenv' 
  },
  { 
    id: '8', 
    timestamp: '10:31:45.030', 
    level: 'INFO', 
    category: 'lint', 
    phaseName: 'Install & Build',
    durationMs: 85,
    message: 'Running AST static linter flake8 on 23 source files...' 
  },
  { 
    id: '9', 
    timestamp: '10:31:47.110', 
    level: 'WARN', 
    category: 'lint', 
    phaseName: 'Install & Build',
    durationMs: 12,
    message: 'app/routers/auth.py:42: F841 local variable \'token_claims\' is assigned to but never used',
    details: 'Line 42 in src/app/routers/auth.py:\ntoken_claims = decode_header(token)\nRecommendation: Remove unused variable or pass to validator.'
  },
  { 
    id: '10', 
    timestamp: '10:31:48.040', 
    level: 'WARN', 
    category: 'lint', 
    phaseName: 'Install & Build',
    durationMs: 14,
    message: 'app/services/rate_limiter.py:18: E501 line exceeds 79 character standard (88 chars)' 
  },
  { 
    id: '11', 
    timestamp: '10:31:49.200', 
    level: 'PASS', 
    category: 'lint', 
    phaseName: 'Install & Build',
    durationMs: 95,
    message: 'Lint validation completed with 2 non-blocking warnings' 
  },
  { 
    id: '12', 
    timestamp: '10:31:50.000', 
    level: 'INFO', 
    category: 'test', 
    phaseName: 'Run & Test',
    durationMs: 210,
    message: 'pytest -v --tb=short tests/ (executing 31 test suites)' 
  },
  { 
    id: '13', 
    timestamp: '10:31:52.400', 
    level: 'PASS', 
    category: 'test', 
    phaseName: 'Run & Test',
    durationMs: 340,
    message: 'tests/test_health.py::test_health_endpoint PASSED [ 3%]' 
  },
  { 
    id: '14', 
    timestamp: '10:31:54.100', 
    level: 'PASS', 
    category: 'test', 
    phaseName: 'Run & Test',
    durationMs: 410,
    message: 'tests/test_db.py::test_db_connection PASSED [ 6%]' 
  },
  { 
    id: '15', 
    timestamp: '10:31:57.600', 
    level: 'ERROR', 
    category: 'test', 
    phaseName: 'Run & Test',
    durationMs: 82,
    message: 'tests/test_auth.py::test_jwt_empty_sub FAILED [ 9%]',
    details: 'Traceback (most recent call last):\n  File "tests/test_auth.py", line 18, in test_jwt_empty_sub\n    response = client.get("/api/v1/profile", headers={"Authorization": "Bearer malformed_token"})\n  File "src/app/routers/auth.py", line 76, in authenticate_user\n    sub = payload.get("sub")\nAttributeError: \'NoneType\' object has no attribute \'get\' at auth.py:76',
    codeSnippet: '@@ -76,2 +76,6 @@\n- sub = payload.get("sub")\n+ if not payload or not isinstance(payload, dict):\n+     raise HTTPException(status_code=401, detail="Invalid token payload")\n+ sub = payload.get("sub")'
  },
  { 
    id: '16', 
    timestamp: '10:31:58.200', 
    level: 'ERROR', 
    category: 'test', 
    phaseName: 'Run & Test',
    durationMs: 45,
    message: 'Unhandled Exception: AttributeError at src/app/routers/auth.py:76 on null payload decode',
    details: 'Variable inspection:\n  payload = None (type: NoneType)\n  request.headers["Authorization"] = "Bearer eyJhbGciOi..."'
  },
  { 
    id: '17', 
    timestamp: '10:32:01.400', 
    level: 'ERROR', 
    category: 'test', 
    phaseName: 'Run & Test',
    durationMs: 110,
    message: 'tests/test_rate_limit.py::test_cluster_reset FAILED [ 12%]',
    details: 'Redis cluster TTL not resetting token bucket per-minute counter on key migration.\nError: KeyExpirationMissing: TTL not propagated across Redis cluster slots at src/services/rate_limiter.ts:48:12',
    codeSnippet: '@@ -48,2 +48,6 @@\n- await redis.incr(key);\n- await redis.expire(key, 60);\n+ const luaScript = `local c = redis.call(\'incr\', KEYS[1]) if tonumber(c) == 1 then redis.call(\'expire\', KEYS[1], ARGV[1]) end return c`;\n+ return await redis.eval(luaScript, 1, key, 60);'
  },
  { 
    id: '18', 
    timestamp: '10:32:03.150', 
    level: 'INFO', 
    category: 'ai-agent', 
    phaseName: 'Error Collection',
    durationMs: 50,
    message: 'Capturing failed stack frames, AST call graph & environment metadata...' 
  },
  { 
    id: '19', 
    timestamp: '10:32:05.400', 
    level: 'INFO', 
    category: 'ai-agent', 
    phaseName: 'AI Root Cause Analysis',
    durationMs: 1200,
    message: 'Deep Reasoning LLM dispatched: Analyzing root cause and cross-referencing openapi-spec.yaml...',
    details: 'Prompt tokens: 2,410 | Model: GPT-4-Turbo | Temperature: 0.1\nContext grounding: Verified against openapi-spec.yaml contract requirement for HTTP 401 handling.'
  },
  { 
    id: '20', 
    timestamp: '10:32:08.800', 
    level: 'PASS', 
    category: 'ai-agent', 
    phaseName: 'AI Patch Generation',
    durationMs: 980,
    message: 'Generated verified unified diff patch for BUG-001 compliant with OpenAPI spec (94% confidence)',
    codeSnippet: '@@ -76,3 +76,7 @@\n- sub = payload.get("sub")\n- user = await get_user_by_id(sub)\n+ if not payload or not isinstance(payload, dict):\n+     raise HTTPException(status_code=401, detail="Invalid token payload")\n+ sub = payload.get("sub")\n+ user = await get_user_by_id(sub)'
  }
];

export const DashboardView: React.FC = () => {
  const [activeUploadTab, setActiveUploadTab] = useState<'zip' | 'github' | 'paste'>('zip');
  const [projectName, setProjectName] = useState('api-gateway');
  const [activeRightTab, setActiveRightTab] = useState<'pipeline' | 'logs'>('pipeline');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(65);
  const [phases, setPhases] = useState<PipelinePhase[]>(initialPipelinePhases);
  const [logs, setLogs] = useState<ExtendedLogLine[]>(extendedInitialLogs);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>('api-gateway-v1.4.zip');
  const [currentExecutingPhase, setCurrentExecutingPhase] = useState<string>('Run & Test');

  // Optional Context Docs State
  const [contextDocs, setContextDocs] = useState<ContextDoc[]>([
    {
      id: 'doc-1',
      name: 'openapi-spec.yaml',
      size: '18.4 KB',
      type: 'openapi',
      uploadedAt: '10:30 AM',
      description: 'REST API endpoints & JWT schema specification',
      content: `openapi: 3.0.3
info:
  title: API Gateway Service
  version: 1.4.0
paths:
  /api/v1/auth/user:
    get:
      summary: Retrieve authenticated user profile
      security:
        - BearerAuth: []
      responses:
        '200':
          description: User object with valid sub claim
        '401':
          description: Missing or malformed bearer token`
    }
  ]);
  const [customInstructions, setCustomInstructions] = useState<string>('Enforce strict null checks for JWT tokens; do not mutate existing API contracts.');
  const [selectedPhaseForInspection, setSelectedPhaseForInspection] = useState<PipelinePhase | null>(null);
  const [isPhaseInspectorOpen, setIsPhaseInspectorOpen] = useState<boolean>(false);

  const handleOpenPhaseInspector = (phase: PipelinePhase) => {
    setSelectedPhaseForInspection(phase);
    setIsPhaseInspectorOpen(true);
  };

  const handleClosePhaseInspector = () => {
    setIsPhaseInspectorOpen(false);
    setSelectedPhaseForInspection(null);
  };

  const handleRerunSecurityChecks = () => {
    const timeStr = new Date().toTimeString().split(' ')[0] + '.' + String(new Date().getMilliseconds()).padStart(3, '0');
    const secLog: ExtendedLogLine = {
      id: `${Date.now()}-sec-rerun`,
      timestamp: timeStr,
      level: 'PASS',
      category: 'security',
      phaseName: 'Project Input',
      durationMs: 28,
      message: 'Zero-Trust Security re-verified: Quota safe (4.82MB), 0 malicious binaries, Zip Slip path traversal prevented.',
      details: 'SHA-256 Checksum verified.\nMagic Bytes Header: PK\\x03\\x04 verified.\nAll 34 files verified against safe chroot sandbox boundary.'
    };
    setLogs(prev => [secLog, ...prev]);
  };

  const handleAddContextDoc = (newDoc: ContextDoc) => {
    setContextDocs(prev => [...prev, newDoc]);
  };

  const handleRemoveContextDoc = (id: string) => {
    setContextDocs(prev => prev.filter(d => d.id !== id));
  };

  const handleClearAllContextDocs = () => {
    setContextDocs([]);
  };

  const handleStartAnalysis = () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setProgress(5);
    setCurrentExecutingPhase('Project Input');

    // Reset phases to running flow
    setPhases(prev => prev.map((p, idx) => {
      if (idx === 0) return { ...p, status: 'running', duration: undefined };
      return { ...p, status: 'pending', duration: undefined };
    }));

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');

    // Add initial log
    const startLog: ExtendedLogLine = {
      id: String(Date.now()),
      timestamp: timeStr,
      level: 'INFO',
      category: 'ai-engine',
      phaseName: 'Project Input',
      durationMs: 12,
      message: `Initiating diagnostic pipeline for project [${projectName}] with ${contextDocs.length} context doc(s)...`
    };

    const initialLogsToSet = [startLog];

    if (contextDocs.length > 0) {
      initialLogsToSet.push({
        id: `${Date.now()}-ctx`,
        timestamp: timeStr,
        level: 'PASS',
        category: 'setup',
        phaseName: 'Project Input',
        durationMs: 18,
        message: `Context docs bound: ${contextDocs.map(d => d.name).join(', ')}`,
        details: `Loaded ${contextDocs.length} grounding documents. Rules: ${customInstructions || 'Default zero-regression constraints.'}`
      });
    }

    setLogs(initialLogsToSet);

    // Multi-phase execution simulation covering all 8 phases and sub-processes
    const steps = [
      {
        phaseId: 1,
        phaseName: 'Project Input',
        progress: 12,
        delay: 600,
        logs: [
          { level: 'INFO' as const, category: 'setup', message: `Archive validation: Checking file size & archive quota (4.82MB / 500MB max limit)...` },
          { level: 'PASS' as const, category: 'security', message: `Malicious file scan: 0 rogue binaries (.exe/.dll/.so) detected. Clean sandbox.` },
          { level: 'PASS' as const, category: 'security', message: `Zip Slip & Path traversal defense: Canonical root strictly enforced. 0 relative climbs.` },
          { level: 'PASS' as const, category: 'setup', message: `Archive validated for ${projectName}. 34 source files decompressed cleanly.` }
        ]
      },
      {
        phaseId: 2,
        phaseName: 'Project Setup',
        progress: 24,
        delay: 1300,
        logs: [
          { level: 'INFO' as const, category: 'setup', message: 'Extracting project analysis directory and building AST symbol table...' },
          { level: 'PASS' as const, category: 'setup', message: 'Detecting language (Python 3.11), framework (FastAPI 0.104), and dependencies (SQLAlchemy, Redis)...' },
          { level: 'PASS' as const, category: 'setup', message: 'Entry point detected at src/main.py:app. Context contracts verified.' }
        ]
      },
      {
        phaseId: 3,
        phaseName: 'Isolated Environment',
        progress: 36,
        delay: 2100,
        logs: [
          { level: 'INFO' as const, category: 'docker', message: 'Creating isolated Docker container sandbox with secure cgroup namespaces...' },
          { level: 'PASS' as const, category: 'docker', message: 'Mounted workspace to /sandbox/app with resource limits: 2.0 vCPU, 4096MB RAM, read-only system root.' }
        ]
      },
      {
        phaseId: 4,
        phaseName: 'Install & Build',
        progress: 48,
        delay: 3000,
        logs: [
          { level: 'INFO' as const, category: 'install', message: 'Installing 47 project dependencies in isolated virtualenv...' },
          { level: 'PASS' as const, category: 'install', message: 'Compilation check: AST parsed cleanly across all 34 source files.' },
          { level: 'WARN' as const, category: 'lint', message: 'Capturing build warnings: 1 unused variable in auth.py:42 (non-fatal).' }
        ]
      },
      {
        phaseId: 5,
        phaseName: 'Run & Test',
        progress: 62,
        delay: 4100,
        logs: [
          { level: 'INFO' as const, category: 'test', message: 'Starting application server on 0.0.0.0:8000 and executing test harness...' },
          { level: 'PASS' as const, category: 'test', message: 'Unit & Integration tests: 30 passed, 1 failed. Capturing runtime behavior.' },
          { 
            level: 'ERROR' as const, 
            category: 'test', 
            message: 'pytest tests/test_auth.py: AttributeError at auth.py:76 on null bearer token sub claim',
            details: 'Traceback:\n  File "src/app/routers/auth.py", line 76, in authenticate_user\n    sub = payload.get("sub")\nAttributeError: \'NoneType\' object has no attribute \'get\'',
            codeSnippet: '@@ -76,2 +76,5 @@\n- sub = payload.get("sub")\n+ if not payload:\n+     raise HTTPException(status_code=401, detail="Invalid token")\n+ sub = payload.get("sub")'
          }
        ]
      },
      {
        phaseId: 6,
        phaseName: 'Error Collection',
        progress: 74,
        delay: 5200,
        logs: [
          { level: 'INFO' as const, category: 'ai-agent', message: 'Collecting stack traces, container stderr logs, and non-zero exit codes...' },
          { level: 'PASS' as const, category: 'ai-agent', message: 'Isolated 1 critical defect [BUG-001] in auth module call graph.' }
        ]
      },
      {
        phaseId: 7,
        phaseName: 'AI Root Cause Analysis',
        progress: 88,
        delay: 6400,
        logs: [
          { 
            level: 'INFO' as const, 
            category: 'ai-agent', 
            message: `Locating responsible code & cross-referencing context contracts (${contextDocs.map(d => d.name).join(', ') || 'standard rules'})...`,
            details: `Root Cause: Null token payload not caught before sub dict access. Impact: HTTP 500 instead of HTTP 401 Unauthorized.`
          }
        ]
      },
      {
        phaseId: 8,
        phaseName: 'AI Patch & Validation Loop',
        progress: 100,
        delay: 7600,
        logs: [
          { level: 'INFO' as const, category: 'ai-agent', message: 'Generating verified fix & applying patch to sandbox environment overlay...' },
          { level: 'PASS' as const, category: 'ai-agent', message: 'Re-running test validation suite: 31/31 PASSED (100%). Zero regressions found.' },
          { 
            level: 'PASS' as const, 
            category: 'ai-agent', 
            message: 'Final Audit Report generated: Patch validated and ready for export.',
            codeSnippet: '@@ -76,3 +76,7 @@\n- sub = payload.get("sub")\n- user = await get_user_by_id(sub)\n+ if not payload or not isinstance(payload, dict):\n+     raise HTTPException(status_code=401, detail="Invalid token payload")\n+ sub = payload.get("sub")\n+ user = await get_user_by_id(sub)'
          }
        ]
      }
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setCurrentExecutingPhase(step.phaseName);
        setProgress(step.progress);

        // Update pipeline phases statuses
        setPhases(prev => prev.map((p, idx) => {
          if (p.id < step.phaseId) {
            return { ...p, status: 'completed', duration: `${(0.4 + idx * 0.3).toFixed(1)}s` };
          } else if (p.id === step.phaseId) {
            return { 
              ...p, 
              status: index === steps.length - 1 ? 'completed' : 'running',
              duration: index === steps.length - 1 ? '1.2s' : undefined
            };
          } else {
            return { ...p, status: 'pending' };
          }
        }));

        // Append logs
        const currentNow = new Date();
        const currentTimestamp = currentNow.toTimeString().split(' ')[0] + '.' + String(currentNow.getMilliseconds()).padStart(3, '0');

        const newLogEntries: ExtendedLogLine[] = step.logs.map((l, lIdx) => ({
          id: `${Date.now()}-${step.phaseId}-${lIdx}`,
          timestamp: currentTimestamp,
          level: l.level,
          category: l.category,
          phaseName: step.phaseName,
          durationMs: Math.floor(Math.random() * 120) + 15,
          message: l.message,
          details: (l as any).details,
          codeSnippet: (l as any).codeSnippet
        }));

        setLogs(prev => [...prev, ...newLogEntries]);

        if (index === steps.length - 1) {
          setIsAnalyzing(false);
        }
      }, step.delay);
    });
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <div id="dashboard-view" className="flex-1 overflow-y-auto bg-[#0B0E14] p-6 lg:p-8 space-y-6 text-[#E2E8F0]">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
            Project Diagnostic Upload & Analysis Pipeline
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Submit your repository or archive with optional context docs for AI-powered AST defect detection, container execution, and automated repair.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex items-center bg-[#0D1117] border border-[#30363D] p-1 rounded-lg">
            <button
              onClick={() => setActiveRightTab('pipeline')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                activeRightTab === 'pipeline'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Pipeline & Live Logs
            </button>
            <button
              onClick={() => setActiveRightTab('logs')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                activeRightTab === 'logs'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Tech Stack & Diagnostics
            </button>
          </div>

          {/* AI Engine Status Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#0D1117] border border-[#30363D] text-xs font-semibold">
            <span className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-amber-400 animate-ping' : 'bg-green-500 animate-pulse'}`} />
            <span className="text-gray-300 font-mono">{isAnalyzing ? 'Executing Pipeline...' : 'Engine Ready'}</span>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Column (5 Cols) */}
        <div className="xl:col-span-5 space-y-6">
          
          {/* Recent Runs Card */}
          <div className="rounded-lg bg-[#0D1117] border border-[#30363D] p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
                Recent Runs
              </h2>
              <span className="text-[11px] font-medium text-gray-400 bg-[#161B22] px-2.5 py-0.5 rounded border border-[#30363D]">
                Today
              </span>
            </div>

            {/* Run List Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-md bg-[#161B22] hover:bg-[#21262D] border border-[#30363D] transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-green-500 shrink-0 shadow-sm shadow-green-500/50" />
                  <div>
                    <div className="text-xs font-semibold font-mono text-gray-200">api-gateway</div>
                    <div className="text-[11px] text-gray-500">2h ago · 4m 12s</div>
                  </div>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                  3 bugs fixed
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-md bg-[#161B22] hover:bg-[#21262D] border border-[#30363D] transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 shadow-sm shadow-red-500/50" />
                  <div>
                    <div className="text-xs font-semibold font-mono text-gray-200">auth-service</div>
                    <div className="text-[11px] text-gray-500">5h ago · 6m 55s</div>
                  </div>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                  7 bugs found
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-md bg-[#161B22] hover:bg-[#21262D] border border-[#30363D] transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-ping" />
                  <div>
                    <div className="text-xs font-semibold font-mono text-gray-200">data-pipeline</div>
                    <div className="text-[11px] text-gray-500">8h ago · active</div>
                  </div>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  running
                </span>
              </div>
            </div>

            {/* Run Stats Summary */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-[#30363D] text-center">
              <div className="p-2.5 rounded bg-[#161B22] border border-[#30363D]">
                <div className="text-lg font-bold text-white">14</div>
                <div className="text-[10px] text-gray-400 uppercase font-semibold">Total Runs</div>
              </div>
              <div className="p-2.5 rounded bg-[#161B22] border border-[#30363D]">
                <div className="text-lg font-bold text-green-400">11</div>
                <div className="text-[10px] text-gray-400 uppercase font-semibold">Fixed</div>
              </div>
              <div className="p-2.5 rounded bg-[#161B22] border border-[#30363D]">
                <div className="text-lg font-bold text-red-400">3</div>
                <div className="text-[10px] text-gray-400 uppercase font-semibold">Failed</div>
              </div>
            </div>
          </div>

          {/* Project Upload Section Card */}
          <div className="rounded-lg bg-[#0D1117] border border-[#30363D] p-5 space-y-4 shadow-sm">
            
            {/* Upload Mode Tabs */}
            <div className="flex border-b border-[#30363D] gap-6 text-xs font-semibold">
              <button
                onClick={() => setActiveUploadTab('zip')}
                className={`pb-2.5 flex items-center gap-2 transition-all cursor-pointer relative ${
                  activeUploadTab === 'zip' ? 'text-indigo-400' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                <span>ZIP Upload</span>
                {activeUploadTab === 'zip' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
                )}
              </button>

              <button
                onClick={() => setActiveUploadTab('github')}
                className={`pb-2.5 flex items-center gap-2 transition-all cursor-pointer relative ${
                  activeUploadTab === 'github' ? 'text-indigo-400' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Github className="w-4 h-4" />
                <span>GitHub / GitLab</span>
                {activeUploadTab === 'github' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
                )}
              </button>

              <button
                onClick={() => setActiveUploadTab('paste')}
                className={`pb-2.5 flex items-center gap-2 transition-all cursor-pointer relative ${
                  activeUploadTab === 'paste' ? 'text-indigo-400' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Code className="w-4 h-4" />
                <span>Paste Code</span>
                {activeUploadTab === 'paste' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
                )}
              </button>
            </div>

            {/* Tab 1: ZIP Upload */}
            {activeUploadTab === 'zip' && (
              <div className="space-y-4">
                
                {/* 1. Primary ZIP Dropzone */}
                <div 
                  className="border-2 border-dashed border-[#30363D] hover:border-indigo-500/60 rounded-lg p-5 flex flex-col items-center justify-center text-center cursor-pointer bg-[#161B22]/50 hover:bg-[#161B22] transition-colors group"
                  onClick={() => setUploadedFileName('fastapi-gateway-master.zip')}
                >
                  <div className="w-10 h-10 rounded-md bg-[#21262D] group-hover:bg-indigo-950/40 border border-[#30363D] group-hover:border-indigo-500/40 flex items-center justify-center text-indigo-400 mb-2 transition-colors">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-semibold text-gray-200 mb-1">
                    Drop your project ZIP archive here
                  </div>
                  <div className="text-[11px] text-gray-500 mb-2">
                    .zip or .tar.gz · Max 500MB
                  </div>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#0D1117] text-gray-400 border border-[#30363D]">
                      .zip
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#0D1117] text-gray-400 border border-[#30363D]">
                      .tar.gz
                    </span>
                  </div>
                  {uploadedFileName && (
                    <div className="mt-3 text-[11px] text-green-400 bg-green-950/40 border border-green-500/30 px-3 py-0.5 rounded flex items-center gap-1.5 font-mono">
                      <Check className="w-3 h-3" />
                      <span>Loaded: {uploadedFileName}</span>
                    </div>
                  )}
                </div>

                {/* 2. OPTIONAL CONTEXT DOCS UPLOADER UNDER THE ZIP UPLOAD */}
                <ContextDocsUploader
                  docs={contextDocs}
                  onAddDoc={handleAddContextDoc}
                  onRemoveDoc={handleRemoveContextDoc}
                  onClearAllDocs={handleClearAllContextDocs}
                  customInstructions={customInstructions}
                  onCustomInstructionsChange={setCustomInstructions}
                />

                {/* 3. Project Name input */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. api-gateway"
                    className="w-full px-3 py-2 rounded-md bg-[#161B22] border border-[#30363D] text-xs text-gray-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                {/* 4. Start Button */}
                <button
                  id="start-ai-analysis-btn"
                  onClick={handleStartAnalysis}
                  disabled={isAnalyzing}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-sm cursor-pointer disabled:opacity-60"
                >
                  <Zap className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  <span>{isAnalyzing ? 'Executing Pipeline & Streaming Logs...' : 'Start AI Analysis Pipeline'}</span>
                </button>
              </div>
            )}

            {/* Tab 2: GitHub / GitLab */}
            {activeUploadTab === 'github' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">Repository URL</label>
                  <input
                    type="text"
                    defaultValue="https://github.com/organization/api-gateway"
                    className="w-full px-3 py-2 rounded-md bg-[#161B22] border border-[#30363D] text-xs text-gray-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">Branch / Tag</label>
                  <input
                    type="text"
                    defaultValue="main"
                    className="w-full px-3 py-2 rounded-md bg-[#161B22] border border-[#30363D] text-xs text-gray-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                {/* Optional Context Docs also for GitHub tab */}
                <ContextDocsUploader
                  docs={contextDocs}
                  onAddDoc={handleAddContextDoc}
                  onRemoveDoc={handleRemoveContextDoc}
                  onClearAllDocs={handleClearAllContextDocs}
                  customInstructions={customInstructions}
                  onCustomInstructionsChange={setCustomInstructions}
                />

                <button
                  onClick={handleStartAnalysis}
                  disabled={isAnalyzing}
                  className="w-full py-2.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>{isAnalyzing ? 'Executing Pipeline...' : 'Clone & Run Pipeline'}</span>
                </button>
              </div>
            )}

            {/* Tab 3: Paste Code */}
            {activeUploadTab === 'paste' && (
              <div className="space-y-4">
                <textarea
                  rows={5}
                  placeholder="// Paste script, Dockerfile, or stack trace..."
                  className="w-full px-3 py-2 rounded-md bg-[#161B22] border border-[#30363D] font-mono text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                  defaultValue={`async def authenticate_user(request: Request):\n    auth_header = request.headers.get("Authorization")\n    payload = jwt.decode(token, SECRET_KEY)\n    sub = payload.get("sub")\n    return await get_user_by_id(sub)`}
                />

                {/* Optional Context Docs also for Paste tab */}
                <ContextDocsUploader
                  docs={contextDocs}
                  onAddDoc={handleAddContextDoc}
                  onRemoveDoc={handleRemoveContextDoc}
                  onClearAllDocs={handleClearAllContextDocs}
                  customInstructions={customInstructions}
                  onCustomInstructionsChange={setCustomInstructions}
                />

                <button
                  onClick={handleStartAnalysis}
                  disabled={isAnalyzing}
                  className="w-full py-2.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{isAnalyzing ? 'Executing Pipeline...' : 'Diagnose Code Snippet'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 Cols) */}
        <div className="xl:col-span-7 space-y-6">

          {activeRightTab === 'pipeline' ? (
            <div className="space-y-6">
              
              {/* Analysis Pipeline Card */}
              <div className="rounded-lg bg-[#0D1117] border border-[#30363D] p-6 space-y-4 shadow-sm">
                
                {/* Pipeline Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
                      <span>Analysis Pipeline</span>
                      {isAnalyzing && (
                        <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded animate-pulse">
                          EXECUTING
                        </span>
                      )}
                      {contextDocs.length > 0 && (
                        <span className="text-[10px] font-mono bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-indigo-400" />
                          <span>{contextDocs.length} Context Doc{contextDocs.length > 1 ? 's' : ''}</span>
                        </span>
                      )}
                    </h2>
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                      {projectName} · run-005 · active phase: <span className="text-indigo-300 font-semibold">{currentExecutingPhase}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right text-xs">
                      <span className="font-semibold text-gray-300">
                        {phases.filter(p => p.status === 'completed').length}/8 phases
                      </span>
                      <span className="text-gray-500 ml-2">{progress}% complete</span>
                    </div>
                    <span className={`px-2.5 py-0.5 text-[11px] font-semibold rounded flex items-center gap-1.5 ${
                      isAnalyzing 
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' 
                        : progress === 100 
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                        : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isAnalyzing ? 'bg-amber-400 animate-ping' : 'bg-green-400'}`} />
                      <span>{isAnalyzing ? 'Running' : progress === 100 ? 'Completed' : 'Standby'}</span>
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[#161B22] h-2 rounded-full overflow-hidden border border-[#30363D]">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      progress === 100 ? 'bg-green-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* 8 Phase Stepper List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                  {phases.map((phase) => {
                    const isCompleted = phase.status === 'completed';
                    const isRunning = phase.status === 'running';
                    const isPending = phase.status === 'pending';
                    const isProjectInput = phase.id === 1 || phase.name.toLowerCase().includes('input');

                    return (
                      <div 
                        key={phase.id}
                        onClick={() => handleOpenPhaseInspector(phase)}
                        role="button"
                        tabIndex={0}
                        title={`Click to inspect ${phase.name} execution details & security checks`}
                        className={`rounded-md border p-2.5 transition-all cursor-pointer group relative ${
                          isRunning 
                            ? 'bg-[#161B22] border-indigo-500/80 shadow-md ring-1 ring-indigo-500/30' 
                            : isCompleted
                            ? 'bg-[#161B22]/50 border-[#30363D] hover:border-indigo-500/60 hover:bg-[#161B22]'
                            : 'bg-[#0B0E14] border-[#21262D] opacity-60 hover:opacity-100 hover:border-[#30363D]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 min-w-0">
                            {isCompleted && (
                              <div className="w-5 h-5 rounded bg-green-950/60 border border-green-500/40 text-green-400 flex items-center justify-center shrink-0 mt-0.5">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}

                            {isRunning && (
                              <div className="w-5 h-5 rounded bg-indigo-950/70 border border-indigo-500/50 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 animate-spin">
                                <RotateCw className="w-3 h-3" />
                              </div>
                            )}

                            {isPending && (
                              <div className="w-5 h-5 rounded bg-[#21262D] border border-[#30363D] text-gray-500 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-semibold">
                                {phase.id}
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className={`text-xs font-semibold truncate ${isRunning ? 'text-indigo-300' : isCompleted ? 'text-gray-200' : 'text-gray-400'} group-hover:text-indigo-300 transition-colors`}>
                                  {phase.name}
                                </span>
                                {isRunning && (
                                  <span className="text-[9px] font-bold px-1 py-0.1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                                    LIVE
                                  </span>
                                )}
                                {isProjectInput && (
                                  <span className="text-[8px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1 py-0.2 rounded shrink-0">
                                    SECURITY CHECK
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-gray-400 truncate mt-0.5 group-hover:text-gray-300 transition-colors">
                                {phase.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {phase.duration && (
                              <span className="text-[10px] font-mono text-gray-500">
                                {phase.duration}
                              </span>
                            )}
                            <span className="text-[9px] font-mono text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              Inspect ↗
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* LIVE LOG TABLE DIRECTLY UNDER THE ANALYSIS PIPELINE */}
              <LiveLogTable
                logs={logs}
                isExecuting={isAnalyzing}
                currentPhaseName={currentExecutingPhase}
                onClearLogs={handleClearLogs}
                onRestartPipeline={handleStartAnalysis}
              />

            </div>
          ) : (
            /* Tech Stack & Diagnostics View */
            <div className="space-y-6">
              
              {/* Stack & Structure */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg bg-[#0D1117] border border-[#30363D] p-5 space-y-3">
                  <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-indigo-400" />
                    <span>Detected Runtime Stack</span>
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded bg-[#161B22] border border-[#30363D]">
                      <span className="text-gray-400">Language</span>
                      <span className="font-semibold text-gray-200 font-mono">Python 3.11.6</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-[#161B22] border border-[#30363D]">
                      <span className="text-gray-400">Framework</span>
                      <span className="font-semibold text-gray-200 font-mono">FastAPI 0.104.1</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-[#161B22] border border-[#30363D]">
                      <span className="text-gray-400">Database</span>
                      <span className="font-semibold text-gray-200 font-mono">PostgreSQL 15.4</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-[#161B22] border border-[#30363D]">
                      <span className="text-gray-400">Test Runner</span>
                      <span className="font-semibold text-gray-200 font-mono">Pytest 7.4.3</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-[#0D1117] border border-[#30363D] p-5 space-y-3">
                  <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>Key Package Dependencies</span>
                  </h3>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between p-2 rounded bg-[#161B22] border border-[#30363D]">
                      <span className="text-gray-300">sqlalchemy</span>
                      <span className="text-indigo-400 font-bold">2.0.23</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-[#161B22] border border-[#30363D]">
                      <span className="text-gray-300">alembic</span>
                      <span className="text-indigo-400 font-bold">1.12.1</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-[#161B22] border border-[#30363D]">
                      <span className="text-gray-300">pydantic</span>
                      <span className="text-indigo-400 font-bold">2.5.0</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-[#161B22] border border-[#30363D]">
                      <span className="text-gray-300">redis</span>
                      <span className="text-indigo-400 font-bold">5.0.1</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full Live Log Table also available here */}
              <LiveLogTable
                logs={logs}
                isExecuting={isAnalyzing}
                currentPhaseName={currentExecutingPhase}
                onClearLogs={handleClearLogs}
                onRestartPipeline={handleStartAnalysis}
              />

            </div>
          )}

        </div>

      </div>

      {/* Phase Inspector Modal */}
      <PhaseInspectorModal
        phase={selectedPhaseForInspection}
        isOpen={isPhaseInspectorOpen}
        onClose={handleClosePhaseInspector}
        projectName={projectName}
        contextDocs={contextDocs}
        onRerunSecurityChecks={handleRerunSecurityChecks}
      />
    </div>
  );
};
