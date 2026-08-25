import React, { useState } from 'react';
import { BookOpen, Terminal, Code2, Copy, Check, Sparkles, Shield, Cpu, ExternalLink } from 'lucide-react';

export const DocsView: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copySnippet = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div id="docs-view" className="flex-1 overflow-y-auto bg-[#0b0f19] p-6 lg:p-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-md">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
              Documentation & CLI Integration
            </h1>
            <p className="text-sm text-slate-400">
              Integrate BugFixAI into your local terminal, CI/CD pipelines, and GitHub Actions.
            </p>
          </div>
        </div>
      </div>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CLI Quickstart */}
        <div className="rounded-2xl bg-[#131826] border border-[#1f283d] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>1. Install BugFixAI CLI</span>
            </div>
            <button
              onClick={() => copySnippet('npm install -g @bugfixai/cli', 1)}
              className="p-1.5 text-slate-400 hover:text-slate-200 bg-[#0f1422] rounded-lg border border-[#1f283d]"
            >
              {copiedIndex === 1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="p-3 bg-[#090d16] rounded-xl border border-[#1b2338] font-mono text-xs text-cyan-300">
            npm install -g @bugfixai/cli
          </div>
          <p className="text-xs text-slate-400">
            Run diagnostics and auto-generate patches directly in any repository with <code>bugfixai diagnose --auto-fix</code>.
          </p>
        </div>

        {/* GitHub Actions CI/CD */}
        <div className="rounded-2xl bg-[#131826] border border-[#1f283d] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <Code2 className="w-4 h-4 text-purple-400" />
              <span>2. GitHub Actions Integration</span>
            </div>
            <button
              onClick={() => copySnippet('name: AI Bug Triage\non: [pull_request]\njobs:\n  triage:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: bugfixai/action@v2', 2)}
              className="p-1.5 text-slate-400 hover:text-slate-200 bg-[#0f1422] rounded-lg border border-[#1f283d]"
            >
              {copiedIndex === 2 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="p-3 bg-[#090d16] rounded-xl border border-[#1b2338] font-mono text-xs text-purple-300 overflow-x-auto leading-relaxed">
            - uses: bugfixai/action@v2<br/>
            &nbsp;&nbsp;with:<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;auto_suggest_patches: true<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;min_confidence: 90
          </div>
          <p className="text-xs text-slate-400">
            Automatically test and suggest high-confidence unified diffs directly in PR comments.
          </p>
        </div>

      </div>

    </div>
  );
};
