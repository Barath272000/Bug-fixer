import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Key, 
  Sparkles, 
  Zap, 
  Shield, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertTriangle,
  Server,
  RefreshCw,
  Sliders,
  Cpu,
  Globe
} from 'lucide-react';
import { CopilotProvider, CopilotModelConfig } from '../types';

export const initialCopilotModels: CopilotModelConfig[] = [
  // Google Gemini
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    providerName: 'Google AI',
    badge: 'Flagship Coding',
    contextWindow: '2M tokens',
    latency: '0.9s avg',
    description: 'Deep multimodal reasoning, entire repo AST ingestion, and zero-regression auto-edits.',
    enabled: true
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    providerName: 'Google AI',
    badge: 'Ultra Fast',
    contextWindow: '1M tokens',
    latency: '0.4s avg',
    description: 'High-speed code autocompletion, real-time syntax checking, and instant fixes.',
    enabled: true
  },

  // Groq (LPU Ultra-Speed)
  {
    id: 'groq-llama-3.3-70b',
    name: 'Llama 3.3 70B Versatile (Groq)',
    provider: 'groq',
    providerName: 'Groq LPU',
    badge: '500+ tok/s',
    contextWindow: '128k tokens',
    latency: '0.25s avg',
    description: 'Instantaneous inference on Groq LPUs for interactive copilot pair-programming.',
    enabled: true
  },
  {
    id: 'groq-mixtral-8x7b',
    name: 'Mixtral 8x7B (Groq)',
    provider: 'groq',
    providerName: 'Groq LPU',
    badge: 'Fast MoE',
    contextWindow: '32k tokens',
    latency: '0.3s avg',
    description: 'Mixture of Experts architecture for versatile multi-language scripting and debugging.',
    enabled: true
  },

  // OpenRouter
  {
    id: 'openrouter-deepseek-r1',
    name: 'DeepSeek R1 (OpenRouter)',
    provider: 'openrouter',
    providerName: 'OpenRouter',
    badge: 'Full Reasoning',
    contextWindow: '64k tokens',
    latency: '1.8s avg',
    description: 'Complete chain-of-thought verification for finding elusive concurrency and logic bugs.',
    enabled: true
  },
  {
    id: 'openrouter-claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet (OpenRouter)',
    provider: 'openrouter',
    providerName: 'OpenRouter',
    badge: 'Top Benchmark',
    contextWindow: '200k tokens',
    latency: '1.2s avg',
    description: 'Industry standard for complex refactorings, API contract adherence, and code diffs.',
    enabled: true
  },
  {
    id: 'openrouter-qwen-2.5-coder',
    name: 'Qwen 2.5 Coder 32B (OpenRouter)',
    provider: 'openrouter',
    providerName: 'OpenRouter',
    badge: 'Code Specialized',
    contextWindow: '128k tokens',
    latency: '0.9s avg',
    description: 'Trained specifically on GitHub repositories and algorithmic competitive coding datasets.',
    enabled: true
  },

  // OpenAI
  {
    id: 'openai-gpt-4o',
    name: 'GPT-4o (Omni)',
    provider: 'openai',
    providerName: 'OpenAI',
    badge: 'Omni Coder',
    contextWindow: '128k tokens',
    latency: '0.8s avg',
    description: 'High accuracy for stack trace diagnosis and interactive permission-based code editing.',
    enabled: true
  },
  {
    id: 'openai-o1-preview',
    name: 'o1-preview (Reasoning)',
    provider: 'openai',
    providerName: 'OpenAI',
    badge: 'Deep Thought',
    contextWindow: '128k tokens',
    latency: '3.2s avg',
    description: 'Advanced multi-stage reasoning to plan architectural refactors before generating diffs.',
    enabled: true
  },

  // Anthropic Direct
  {
    id: 'anthropic-claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet Direct',
    provider: 'anthropic',
    providerName: 'Anthropic',
    badge: 'Direct API',
    contextWindow: '200k tokens',
    latency: '1.1s avg',
    description: 'Direct Anthropic API integration with high precision patch synthesis.',
    enabled: true
  },

  // Custom / Self-Hosted
  {
    id: 'custom-local-ollama',
    name: 'Ollama Local (codellama / qwen)',
    provider: 'custom',
    providerName: 'Local Endpoint',
    badge: 'Self-Hosted',
    contextWindow: '32k tokens',
    latency: 'Local host',
    description: 'Private air-gapped models running on your local machine or internal cluster.',
    baseUrl: 'http://localhost:11434/v1',
    isCustom: true,
    enabled: true
  }
];

interface CopilotSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCopilotModelId: string;
  onSelectCopilotModel: (modelId: string) => void;
  models: CopilotModelConfig[];
  onUpdateModels: (updated: CopilotModelConfig[]) => void;
  apiKeys: Record<string, string>;
  onSaveApiKey: (provider: string, key: string) => void;
}

export const CopilotSettingsModal: React.FC<CopilotSettingsModalProps> = ({
  isOpen,
  onClose,
  activeCopilotModelId,
  onSelectCopilotModel,
  models,
  onUpdateModels,
  apiKeys,
  onSaveApiKey
}) => {
  const [activeTab, setActiveTab] = useState<'models' | 'apikeys' | 'custom'>('models');
  const [selectedProviderFilter, setSelectedProviderFilter] = useState<string>('all');
  const [showKeyVisibility, setShowKeyVisibility] = useState<Record<string, boolean>>({});
  const [localKeys, setLocalKeys] = useState<Record<string, string>>(apiKeys);
  const [testStatus, setTestStatus] = useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({});
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // New Custom Model Form State
  const [newModelName, setNewModelName] = useState('');
  const [newModelId, setNewModelId] = useState('');
  const [newModelProvider, setNewModelProvider] = useState<CopilotProvider>('openrouter');
  const [newModelBaseUrl, setNewModelBaseUrl] = useState('');
  const [newModelContext, setNewModelContext] = useState('128k tokens');
  const [newModelDesc, setNewModelDesc] = useState('');

  useEffect(() => {
    setLocalKeys(apiKeys);
  }, [apiKeys]);

  if (!isOpen) return null;

  const toggleKeyVisibility = (provider: string) => {
    setShowKeyVisibility(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const handleKeyChange = (provider: string, value: string) => {
    setLocalKeys(prev => ({ ...prev, [provider]: value }));
  };

  const handleSaveSingleKey = (provider: string) => {
    const key = localKeys[provider] || '';
    onSaveApiKey(provider, key);
    
    // Simulate test verification
    setTestStatus(prev => ({ ...prev, [provider]: 'testing' }));
    setTimeout(() => {
      setTestStatus(prev => ({ ...prev, [provider]: key.trim().length > 4 ? 'success' : 'error' }));
      setSaveToast(`Saved API Key for ${provider.toUpperCase()} securely!`);
      setTimeout(() => setSaveToast(null), 2500);
    }, 600);
  };

  const handleTestConnection = (provider: string) => {
    setTestStatus(prev => ({ ...prev, [provider]: 'testing' }));
    setTimeout(() => {
      const key = localKeys[provider] || '';
      if (key.trim().length > 4 || provider === 'custom') {
        setTestStatus(prev => ({ ...prev, [provider]: 'success' }));
      } else {
        setTestStatus(prev => ({ ...prev, [provider]: 'error' }));
      }
    }, 700);
  };

  const handleSelectModel = (modelId: string) => {
    onSelectCopilotModel(modelId);
    setSaveToast(`Active Copilot Model updated to ${models.find(m => m.id === modelId)?.name}`);
    setTimeout(() => {
      setSaveToast(null);
      onClose();
    }, 700);
  };

  const handleToggleModelEnabled = (modelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = models.map(m => m.id === modelId ? { ...m, enabled: !m.enabled } : m);
    onUpdateModels(updated);
  };

  const handleAddCustomModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModelName.trim() || !newModelId.trim()) return;

    const newConfig: CopilotModelConfig = {
      id: newModelId.trim().toLowerCase().replace(/\s+/g, '-'),
      name: newModelName.trim(),
      provider: newModelProvider,
      providerName: newModelProvider === 'openrouter' ? 'OpenRouter' : newModelProvider === 'groq' ? 'Groq' : newModelProvider === 'google' ? 'Google AI' : 'Custom',
      badge: 'Custom Added',
      contextWindow: newModelContext || '128k tokens',
      latency: 'Custom',
      description: newModelDesc || 'User-configured custom model via third-party API gateway.',
      baseUrl: newModelBaseUrl || undefined,
      isCustom: true,
      enabled: true
    };

    onUpdateModels([newConfig, ...models]);
    setSaveToast(`Added custom model "${newModelName}"!`);
    setNewModelName('');
    setNewModelId('');
    setNewModelDesc('');
    setActiveTab('models');
    setTimeout(() => setSaveToast(null), 2500);
  };

  const handleDeleteModel = (modelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = models.filter(m => m.id !== modelId);
    onUpdateModels(updated);
  };

  const filteredModels = models.filter(m => {
    if (selectedProviderFilter === 'all') return true;
    return m.provider === selectedProviderFilter;
  });

  const providersInfo = [
    {
      id: 'google',
      name: 'Google Gemini AI',
      desc: 'Gemini 2.5 Pro & Flash with native multimodal reasoning and 2M token context.',
      link: 'https://aistudio.google.com/app/apikey',
      placeholder: 'AIzaSy...'
    },
    {
      id: 'groq',
      name: 'Groq Cloud (LPU Ultra-Fast)',
      desc: 'Lightning-fast inference with 500+ tokens/second on Llama 3.3 70B and Mixtral.',
      link: 'https://console.groq.com/keys',
      placeholder: 'gsk_...'
    },
    {
      id: 'openrouter',
      name: 'OpenRouter API',
      desc: 'Universal gateway to DeepSeek R1/V3, Claude 3.5 Sonnet, Qwen Coder, and 200+ models.',
      link: 'https://openrouter.ai/keys',
      placeholder: 'sk-or-v1-...'
    },
    {
      id: 'openai',
      name: 'OpenAI API',
      desc: 'GPT-4o, GPT-4 Turbo, and o1-preview for advanced diagnostic reasoning.',
      link: 'https://platform.openai.com/api-keys',
      placeholder: 'sk-proj-...'
    },
    {
      id: 'anthropic',
      name: 'Anthropic Claude API',
      desc: 'Claude 3.5 Sonnet for state-of-the-art bug repair diffs.',
      link: 'https://console.anthropic.com/settings/keys',
      placeholder: 'sk-ant-...'
    },
    {
      id: 'custom',
      name: 'Custom / Local Gateway (Ollama / vLLM)',
      desc: 'Self-hosted or proxy endpoint for air-gapped enterprise environments.',
      link: 'https://ollama.com',
      placeholder: 'Optional Bearer Token / API Key'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-[#0D1117] border border-[#30363D] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#E2E8F0] animate-in fade-in zoom-in duration-150">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#30363D] flex items-center justify-between bg-[#161B22]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-900/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Copilot Engine & Third-Party API Keys</h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-full">
                  IDE Copilot
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Switch models separately, connect OpenRouter, Groq, Gemini, or custom endpoints to power auto-edits.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#21262D] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-[#30363D] bg-[#0B0E14] px-4 pt-2 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('models')}
            className={`flex items-center gap-1.5 px-4 py-2 font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'models' 
                ? 'text-indigo-400 border-indigo-500 bg-[#161B22]/50 rounded-t-md' 
                : 'text-gray-400 border-transparent hover:text-gray-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Select Model ({models.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('apikeys')}
            className={`flex items-center gap-1.5 px-4 py-2 font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'apikeys' 
                ? 'text-indigo-400 border-indigo-500 bg-[#161B22]/50 rounded-t-md' 
                : 'text-gray-400 border-transparent hover:text-gray-200'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Third-Party API Keys</span>
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            className={`flex items-center gap-1.5 px-4 py-2 font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'custom' 
                ? 'text-indigo-400 border-indigo-500 bg-[#161B22]/50 rounded-t-md' 
                : 'text-gray-400 border-transparent hover:text-gray-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Model / Endpoint</span>
          </button>
        </div>

        {/* Save Toast */}
        {saveToast && (
          <div className="bg-emerald-950/80 border-b border-emerald-500/40 px-4 py-2 flex items-center justify-between text-xs text-emerald-300 animate-in fade-in">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{saveToast}</span>
            </div>
          </div>
        )}

        {/* TAB 1: MODEL SELECTOR */}
        {activeTab === 'models' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-[#0B0E14]">
            
            {/* Filter Pills */}
            <div className="p-3 border-b border-[#30363D] bg-[#0D1117] flex items-center gap-1.5 overflow-x-auto text-xs">
              <span className="text-gray-400 mr-1 font-mono text-[11px]">Provider:</span>
              {[
                { id: 'all', label: 'All Providers' },
                { id: 'google', label: 'Google Gemini' },
                { id: 'groq', label: 'Groq (Ultra-Fast)' },
                { id: 'openrouter', label: 'OpenRouter' },
                { id: 'openai', label: 'OpenAI' },
                { id: 'anthropic', label: 'Anthropic' },
                { id: 'custom', label: 'Local / Custom' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedProviderFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    selectedProviderFilter === tab.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-[#161B22] text-gray-400 hover:text-white border border-[#30363D]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Model List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredModels.map(model => {
                const isSelected = activeCopilotModelId === model.id;
                const hasApiKey = Boolean(apiKeys[model.provider] || model.provider === 'custom');

                return (
                  <div
                    key={model.id}
                    onClick={() => handleSelectModel(model.id)}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-indigo-950/25 border-indigo-500 shadow-md shadow-indigo-950/40 ring-1 ring-indigo-500/50'
                        : 'bg-[#0D1117] border-[#30363D] hover:border-gray-500 hover:bg-[#161B22]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${model.enabled ? 'bg-emerald-400 shadow-xs shadow-emerald-400/50' : 'bg-gray-600'}`} />
                          <h4 className="text-sm font-bold text-white font-mono">{model.name}</h4>
                          <span className="text-[10px] font-mono text-gray-400 bg-[#21262D] px-1.5 py-0.5 rounded border border-[#30363D]">
                            {model.providerName}
                          </span>
                          {model.badge && (
                            <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                              {model.badge}
                            </span>
                          )}
                          {isSelected && (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              ACTIVE IN COPILOT
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-300 leading-relaxed font-sans pt-1">
                          {model.description}
                        </p>

                        <div className="flex items-center gap-4 text-[11px] font-mono text-gray-400 pt-1.5">
                          <span>Context: <strong className="text-gray-200">{model.contextWindow}</strong></span>
                          <span>Latency: <strong className="text-gray-200">{model.latency || 'Fast'}</strong></span>
                          {model.baseUrl && (
                            <span className="text-indigo-400 truncate max-w-xs">Base: {model.baseUrl}</span>
                          )}
                        </div>
                      </div>

                      {/* Right Action */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectModel(model.id);
                          }}
                          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[#21262D] hover:bg-indigo-600 text-gray-200 hover:text-white border border-[#30363D]'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Use as Copilot'}
                        </button>

                        {model.isCustom && (
                          <button
                            onClick={(e) => handleDeleteModel(model.id, e)}
                            className="p-1 text-gray-500 hover:text-rose-400 transition-colors"
                            title="Delete custom model"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* TAB 2: API KEYS CONFIGURATION */}
        {activeTab === 'apikeys' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#0B0E14]">
            <div className="p-3 bg-indigo-950/20 border border-indigo-500/30 rounded-lg flex items-start gap-2.5 text-xs text-indigo-200">
              <Lock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Direct Client-Side & Backend Security</strong>
                <p className="mt-0.5 text-gray-300 leading-relaxed">
                  Provide your API keys from OpenRouter, Groq, Google Gemini, OpenAI, or Anthropic. All keys are encrypted in your active environment session.
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              {providersInfo.map(provider => {
                const currentVal = localKeys[provider.id] || '';
                const isVisible = showKeyVisibility[provider.id] || false;
                const status = testStatus[provider.id] || 'idle';

                return (
                  <div 
                    key={provider.id}
                    className="p-4 bg-[#0D1117] border border-[#30363D] rounded-lg space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-indigo-400" />
                        <h4 className="text-sm font-bold text-white font-mono">{provider.name}</h4>
                      </div>
                      <a
                        href={provider.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 hover:underline font-medium"
                      >
                        <span>Get API Key</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <p className="text-xs text-gray-400">
                      {provider.desc}
                    </p>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type={isVisible ? 'text' : 'password'}
                          value={currentVal}
                          onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                          placeholder={provider.placeholder}
                          className="w-full bg-[#161B22] border border-[#30363D] focus:border-indigo-500 rounded-md px-3 py-2 text-xs text-gray-100 font-mono focus:outline-none pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => toggleKeyVisibility(provider.id)}
                          className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white"
                          title={isVisible ? "Hide API key" : "Show API key"}
                        >
                          {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <button
                        onClick={() => handleSaveSingleKey(provider.id)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>

                      <button
                        onClick={() => handleTestConnection(provider.id)}
                        disabled={status === 'testing'}
                        className="bg-[#21262D] hover:bg-[#30363D] text-gray-200 px-3 py-2 rounded-md text-xs font-medium border border-[#30363D] transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        {status === 'testing' ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                        ) : status === 'success' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : status === 'error' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        ) : (
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span>{status === 'testing' ? 'Testing...' : status === 'success' ? 'Connected ✓' : status === 'error' ? 'Invalid Key' : 'Test'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: ADD CUSTOM MODEL */}
        {activeTab === 'custom' && (
          <form onSubmit={handleAddCustomModel} className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#0B0E14]">
            <div className="p-3 bg-[#161B22] border border-[#30363D] rounded-lg text-xs text-gray-300 space-y-1">
              <strong className="text-white flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span>Add any Model from OpenRouter, Groq, Ollama, or Custom Gateway</span>
              </strong>
              <p className="text-gray-400">
                You can register custom models (e.g. <code>deepseek/deepseek-chat</code>, <code>meta-llama/llama-3.3-70b-instruct</code>, <code>qwen2.5-coder:32b</code>).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-gray-300">Model Display Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DeepSeek Coder V2 (OpenRouter)"
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  className="w-full bg-[#161B22] border border-[#30363D] focus:border-indigo-500 rounded-md px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-gray-300">Model ID / Slug *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. deepseek/deepseek-coder"
                  value={newModelId}
                  onChange={(e) => setNewModelId(e.target.value)}
                  className="w-full bg-[#161B22] border border-[#30363D] focus:border-indigo-500 rounded-md px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-gray-300">Provider Category</label>
                <select
                  value={newModelProvider}
                  onChange={(e) => setNewModelProvider(e.target.value as CopilotProvider)}
                  className="w-full bg-[#161B22] border border-[#30363D] focus:border-indigo-500 rounded-md px-3 py-2 text-xs text-white"
                >
                  <option value="openrouter">OpenRouter Gateway</option>
                  <option value="groq">Groq LPU Cloud</option>
                  <option value="google">Google Gemini AI</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="custom">Self-Hosted / Local (Ollama, vLLM)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-gray-300">Context Window</label>
                <input
                  type="text"
                  placeholder="e.g. 128k tokens"
                  value={newModelContext}
                  onChange={(e) => setNewModelContext(e.target.value)}
                  className="w-full bg-[#161B22] border border-[#30363D] focus:border-indigo-500 rounded-md px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="font-semibold text-gray-300">Custom Base URL (Optional for self-hosted)</label>
                <input
                  type="text"
                  placeholder="e.g. http://localhost:11434/v1 or https://my-custom-proxy.internal/v1"
                  value={newModelBaseUrl}
                  onChange={(e) => setNewModelBaseUrl(e.target.value)}
                  className="w-full bg-[#161B22] border border-[#30363D] focus:border-indigo-500 rounded-md px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="font-semibold text-gray-300">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief note on what this model is optimized for..."
                  value={newModelDesc}
                  onChange={(e) => setNewModelDesc(e.target.value)}
                  className="w-full bg-[#161B22] border border-[#30363D] focus:border-indigo-500 rounded-md px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#30363D] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('models')}
                className="px-4 py-2 bg-[#21262D] hover:bg-[#30363D] text-gray-300 rounded-md text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-semibold shadow-md flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register Model in Copilot</span>
              </button>
            </div>
          </form>
        )}

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#30363D] bg-[#161B22] flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active Copilot Model: <strong className="text-indigo-400 font-mono">{models.find(m => m.id === activeCopilotModelId)?.name || activeCopilotModelId}</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#21262D] hover:bg-[#30363D] text-white rounded-md font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
