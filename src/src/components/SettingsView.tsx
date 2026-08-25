import React, { useState } from 'react';
import { Settings, Cpu, Shield, Key, Bell, Database, Check } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [autoRunTests, setAutoRunTests] = useState(true);
  const [minConfidence, setMinConfidence] = useState(85);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div id="settings-view" className="flex-1 overflow-y-auto bg-[#0b0f19] p-6 lg:p-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-md">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
              Settings & AI Engine Configuration
            </h1>
            <p className="text-sm text-slate-400">
              Configure underlying LLM reasoning models, Docker sandbox execution limits, and notifications.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>{saved ? 'Settings Saved' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Settings Sections */}
      <div className="max-w-3xl space-y-6">
        
        {/* Model Selection */}
        <div className="rounded-2xl bg-[#131826] border border-[#1f283d] p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Primary AI Analysis & Synthesis Model</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI (Omni)', desc: 'Best for multi-file AST context & high complexity' },
              { id: 'claude-3-5', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', desc: 'Superior code syntax precision & refactoring' },
              { id: 'gemini-1-5', name: 'Gemini 1.5 Pro', provider: 'Google DeepMind', desc: '1M+ token context window for huge monorepos' },
            ].map(m => (
              <div
                key={m.id}
                onClick={() => setSelectedModel(m.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedModel === m.id
                    ? 'bg-purple-950/40 border-purple-500/60 shadow-lg shadow-purple-950/30'
                    : 'bg-[#0f1422] border-[#1f283d] hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 text-xs">{m.name}</span>
                  {selectedModel === m.id && <span className="w-2 h-2 rounded-full bg-purple-400" />}
                </div>
                <div className="text-[11px] text-cyan-400 mt-0.5">{m.provider}</div>
                <p className="text-[11px] text-slate-400 mt-2">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Confidence & Sandbox Guardrails */}
        <div className="rounded-2xl bg-[#131826] border border-[#1f283d] p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Sandbox Verification & Guardrails</span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">Auto-execute test suite in Docker container</div>
                <div className="text-slate-500 text-[11px]">Validates that no existing tests break before suggesting a patch</div>
              </div>
              <input
                type="checkbox"
                checked={autoRunTests}
                onChange={(e) => setAutoRunTests(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-[#1f283d]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">Minimum AI Confidence Score Required</span>
                <span className="font-mono font-bold text-cyan-400">{minConfidence}%</span>
              </div>
              <input
                type="range"
                min={70}
                max={99}
                value={minConfidence}
                onChange={(e) => setMinConfidence(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
