import React, { useState } from 'react';
import { X, Sparkles, Check, Clock, Code2, AlertTriangle, CheckCircle2, Copy } from 'lucide-react';
import { Bug, AIFixHistoryItem } from '../types';

interface InspectFixModalProps {
  isOpen: boolean;
  onClose: () => void;
  bug?: Bug | null;
  historyItem?: AIFixHistoryItem | null;
  onApplyPatch?: (bugId: string) => void;
}

export const InspectFixModal: React.FC<InspectFixModalProps> = ({
  isOpen,
  onClose,
  bug,
  historyItem,
  onApplyPatch
}) => {
  const [copied, setCopied] = useState(false);
  const [isApplied, setIsApplied] = useState(false);

  if (!isOpen) return null;

  const bugId = bug?.code || historyItem?.bugId || 'BUG-001';
  const bugTitle = bug?.title || historyItem?.bugTitle || 'Null pointer exception in user auth middleware';
  const model = bug?.fixSuggestion?.model || historyItem?.model || 'GPT-4o';
  const confidence = bug?.fixSuggestion?.confidence || historyItem?.confidence || 94;
  const lines = bug?.fixSuggestion?.lines || historyItem?.lines || 8;
  const explanation = bug?.fixSuggestion?.explanation || 
    'The `auth_middleware` attempts to directly dereference the JWT payload without verifying that `sub` exists or that the decoded token is a dictionary. Adding strict type checks and raising `HTTPException(401)` prevents unhandled 500 crashes.';

  const diffCode = bug?.fixSuggestion?.diffSnippet || `@@ -72,7 +72,11 @@ async def get_current_user(token: str = Depends(oauth2_scheme)):
     except JWTError:
         raise credentials_exception
-    user_id: str = payload.get("sub")
-    user = await get_user_by_id(user_id)
+    if not payload or not isinstance(payload, dict):
+        raise credentials_exception
+    user_id: str = payload.get("sub")
+    if not user_id:
+        raise credentials_exception
+    user = await get_user_by_id(user_id)
     return user`;

  const handleCopy = () => {
    navigator.clipboard.writeText(diffCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    setIsApplied(true);
    if (onApplyPatch) onApplyPatch(bugId);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-[#131826] border border-[#1f283d] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-[#1f283d] flex items-center justify-between bg-[#111622]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-300 text-xs px-2 py-0.5 rounded bg-[#1c2438] border border-[#2b3754]">
                  {bugId}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {model}
                </span>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  {confidence}% Confidence
                </span>
              </div>
              <h2 className="text-sm font-bold text-white mt-1">
                {bugTitle}
              </h2>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#1c253b] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          
          {/* Explanation Box */}
          <div className="p-4 rounded-xl bg-[#0f1422] border border-[#1f283d] space-y-1.5">
            <div className="font-semibold text-slate-300 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>AI Root Cause & Solution Rationale</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              {explanation}
            </p>
          </div>

          {/* Unified Diff View */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-slate-300 flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Generated Unified Diff ({lines} lines altered)</span>
              </div>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1a2336] hover:bg-[#232f48] text-slate-300 border border-[#2b3754] transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Diff'}</span>
              </button>
            </div>

            {/* Code block with syntax highlighting */}
            <div className="rounded-xl bg-[#080b12] border border-[#1b2338] p-4 font-mono text-xs overflow-x-auto leading-relaxed">
              {diffCode.split('\n').map((line, idx) => {
                if (line.startsWith('+')) {
                  return (
                    <div key={idx} className="bg-emerald-950/40 text-emerald-300 px-2 py-0.5 rounded -mx-2 font-semibold">
                      {line}
                    </div>
                  );
                } else if (line.startsWith('-')) {
                  return (
                    <div key={idx} className="bg-rose-950/40 text-rose-400 px-2 py-0.5 rounded -mx-2 font-semibold line-through opacity-80">
                      {line}
                    </div>
                  );
                } else if (line.startsWith('@@')) {
                  return (
                    <div key={idx} className="text-purple-400 py-1 font-semibold">
                      {line}
                    </div>
                  );
                }
                return (
                  <div key={idx} className="text-slate-400 px-2 py-0.5">
                    {line}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Test verification notice */}
          <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center gap-2.5 text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Pre-tested in isolated Docker container — 0 regressions, all 31 tests passed.</span>
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#1f283d] flex items-center justify-between bg-[#111622]">
          <div className="text-slate-500 text-xs">
            Estimated time saved: <strong className="text-slate-300">~15 mins</strong>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#182033] hover:bg-[#202c46] text-slate-300 font-semibold transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleApply}
              disabled={isApplied}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-purple-900/30 transition-all cursor-pointer disabled:opacity-75"
            >
              <Check className="w-4 h-4" />
              <span>{isApplied ? 'Patch Applied Successfully!' : 'Apply Patch to Codebase'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
