import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Check, 
  X, 
  RotateCw, 
  FileCode, 
  Settings, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Cpu, 
  Code2, 
  ChevronDown, 
  ArrowRight, 
  Zap, 
  Terminal, 
  Layers, 
  Copy, 
  CheckCheck,
  ShieldCheck,
  Key,
  Wand2,
  RefreshCw,
  PlusCircle,
  HelpCircle
} from 'lucide-react';
import { CopilotChatMessage, ProposedCodeChange, CopilotModelConfig } from '../types';

interface CopilotChatPanelProps {
  activeFile: string;
  isPatchApplied: boolean;
  onApplyPatch: () => void;
  onRevertPatch: () => void;
  currentModel: CopilotModelConfig;
  onOpenCopilotSettings: () => void;
  onRunTestInTerminal: () => void;
  isCompact?: boolean;
}

export const CopilotChatPanel: React.FC<CopilotChatPanelProps> = ({
  activeFile,
  isPatchApplied,
  onApplyPatch,
  onRevertPatch,
  currentModel,
  onOpenCopilotSettings,
  onRunTestInTerminal,
  isCompact = false
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [copiedDiffId, setCopiedDiffId] = useState<string | null>(null);

  const initialMessages: CopilotChatMessage[] = [
    {
      id: 'msg-1',
      sender: 'ai',
      text: `Hello! I'm your **AI Copilot** powered by **${currentModel.name}** (${currentModel.providerName}).\n\nI have scanned your active workspace file \`${activeFile}\`. I detected a runtime **IndexError** on line 6 due to an unguarded tuple access on query results.\n\nHow can I help you today? You can ask me to fix the bug, explain the code, or add guard clauses.`,
      time: '10:42 AM',
      modelUsed: currentModel.name,
      provider: currentModel.providerName,
      suggestions: [
        'Fix IndexError with safe guard clause',
        'Explain line 6 vulnerability',
        'Generate Pytest regression test',
        'Refactor with Python type hints'
      ]
    }
  ];

  const [messages, setMessages] = useState<CopilotChatMessage[]>(initialMessages);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Synchronize initial message model when model changes
  useEffect(() => {
    setMessages(prev => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        sender: 'system',
        text: `Switched Copilot Engine to **${currentModel.name}** (${currentModel.providerName}). Context window: ${currentModel.contextWindow}.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: currentModel.name
      }
    ]);
  }, [currentModel.id]);

  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDiffId(id);
    setTimeout(() => setCopiedDiffId(null), 2000);
  };

  const handleApproveProposal = (proposalId: string) => {
    // 1. Mutate message state to approved
    setMessages(prev => prev.map(m => {
      if (m.proposedChange && m.proposedChange.id === proposalId) {
        return {
          ...m,
          proposedChange: {
            ...m.proposedChange,
            status: 'approved_and_applied'
          }
        };
      }
      return m;
    }));

    // 2. Trigger Workspace Editor Auto-Patch
    onApplyPatch();

    // 3. Send AI confirmation follow-up
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: `ai-confirm-${Date.now()}`,
          sender: 'ai',
          text: `**Auto-changes applied successfully!** \n\nI have updated \`${activeFile}\` lines 6-10 with the verified guard clause. The syntax error is cleared and AST validation passed. Would you like me to execute pytest in the terminal to verify the fix?`,
          time: now,
          modelUsed: currentModel.name,
          suggestions: [
            'Run pytest in terminal now',
            'Explain what was changed',
            'Commit changes to git'
          ]
        }
      ]);
    }, 400);
  };

  const handleRejectProposal = (proposalId: string) => {
    setMessages(prev => prev.map(m => {
      if (m.proposedChange && m.proposedChange.id === proposalId) {
        return {
          ...m,
          proposedChange: {
            ...m.proposedChange,
            status: 'rejected'
          }
        };
      }
      return m;
    }));

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [
      ...prev,
      {
        id: `ai-reject-${Date.now()}`,
        sender: 'ai',
        text: `Proposal dismissed. No modifications were made to \`${activeFile}\`. Let me know if you would prefer an alternative implementation strategy.`,
        time: now,
        modelUsed: currentModel.name
      }
    ]);
  };

  const handleRevertProposal = (proposalId: string) => {
    setMessages(prev => prev.map(m => {
      if (m.proposedChange && m.proposedChange.id === proposalId) {
        return {
          ...m,
          proposedChange: {
            ...m.proposedChange,
            status: 'reverted'
          }
        };
      }
      return m;
    }));

    onRevertPatch();

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [
      ...prev,
      {
        id: `ai-revert-${Date.now()}`,
        sender: 'system',
        text: `Reverted changes in \`${activeFile}\`. Original code restored.`,
        time: now
      }
    ]);
  };

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query) return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgId = `user-${Date.now()}`;

    // Add user message
    setMessages(prev => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        text: query,
        time: now
      }
    ]);
    setInputQuery('');
    setIsThinking(true);

    const lower = query.toLowerCase();

    setTimeout(() => {
      setIsThinking(false);
      const aiTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Scenario 1: User asks to fix / patch / guard / repair
      if (lower.includes('fix') || lower.includes('patch') || lower.includes('guard') || lower.includes('error') || lower.includes('resolve') || lower.includes('change')) {
        const proposedChange: ProposedCodeChange = {
          id: `prop-${Date.now()}`,
          file: activeFile,
          title: `Guard against empty session tuple in ${activeFile}`,
          description: 'Adds length check and null assertion before accessing index [0] to prevent IndexError crashes on invalid or expired authentication tokens.',
          explanation: `In Python, when the database query returns no matching rows, \`session\` evaluates to an empty tuple \`()\`. Accessing \`session[0]\` immediately raises \`IndexError: tuple index out of range\`.\n\nThe proposed fix safely checks \`if session and len(session) > 0:\` before extracting \`user_id\`, and returns \`False\` for invalid sessions.`,
          startLine: 6,
          endLine: 7,
          originalCode: `    user_id = session[0].get("id")`,
          proposedCode: `    if session and len(session) > 0:\n        user_id = session[0].get("id")\n    else:\n        return False`,
          diffSummary: '+4 lines, -1 line',
          status: isPatchApplied ? 'approved_and_applied' : 'pending_permission',
          timestamp: aiTime
        };

        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: `I have analyzed \`${activeFile}\` using **${currentModel.name}** and prepared a verified patch.\n\n### Proposed Solution & Permission Request:\nBefore I apply auto-changes to your source code, please review the proposed diff below and confirm permission to proceed.`,
            time: aiTime,
            modelUsed: currentModel.name,
            provider: currentModel.providerName,
            proposedChange,
            suggestions: [
              'Explain the AST guard logic',
              'Show me alternative ORM syntax',
              'What other files might be affected?'
            ]
          }
        ]);
      } 
      // Scenario 2: User asks to run tests
      else if (lower.includes('test') || lower.includes('pytest') || lower.includes('run')) {
        onRunTestInTerminal();
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: `Triggered \`pytest tests/test_auth.py\` in the integrated Python terminal.\n\n- If patch is applied: **3/3 Tests Passed (100%)**\n- If patch is not applied: **1 Test Failed (IndexError)**\n\nCheck the Terminal tab in the bottom console to see the live execution log.`,
            time: aiTime,
            modelUsed: currentModel.name,
            suggestions: [
              'Fix the IndexError now',
              'View diff comparison',
              'Open debug console'
            ]
          }
        ]);
      }
      // Scenario 3: User asks to explain
      else if (lower.includes('explain') || lower.includes('why') || lower.includes('how') || lower.includes('understand')) {
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: `### Code Analysis for \`${activeFile}\`:\n\n1. **Vulnerability Location**: Line 6 \`validate_session(token)\`.\n2. **Root Cause**: The query \`db.query("SELECT * FROM sessions WHERE token = ?", token)\` returns an empty tuple \`()\` when the token is missing or expired.\n3. **Runtime Consequence**: \`session[0]\` immediately triggers \`IndexError\`, causing an HTTP 500 Unhandled Exception instead of returning a clean HTTP 401 Unauthorized.\n4. **Industry Best Practice**: Always wrap database query tuple unpacking in a truthy check or use an ORM method like \`.first()\` or \`.one_or_none()\`.`,
            time: aiTime,
            modelUsed: currentModel.name,
            suggestions: [
              'Apply auto-fix with permission',
              'Generate regression test',
              'Refactor with type hints'
            ]
          }
        ]);
      }
      // Scenario 4: General query
      else {
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: `Using **${currentModel.name}** (${currentModel.providerName}):\n\nI can assist you with code generation, syntax validation, bug isolation, and auto-edits for \`${activeFile}\`.\n\nWould you like me to generate a proposed fix, write unit tests, or refactor this module?`,
            time: aiTime,
            modelUsed: currentModel.name,
            suggestions: [
              'Fix the bug in auth_service.py',
              'Explain line 6 error',
              'Run pytest in terminal'
            ]
          }
        ]);
      }

    }, 850);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  return (
    <div className="flex flex-col h-full bg-[#1E1E1E] text-[#CCCCCC] font-sans select-none overflow-hidden">
      
      {/* 1. COPILOT HEADER */}
      <div className="px-3.5 py-2.5 bg-[#252526] border-b border-[#191919] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white tracking-wide">BugFixer Copilot</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
              <span>Target:</span>
              <span className="text-indigo-300 font-semibold">{activeFile}</span>
            </div>
          </div>
        </div>

        {/* Model Selector Pill */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenCopilotSettings}
            className="flex items-center gap-1.5 bg-[#1E1E1E] hover:bg-[#333333] border border-[#3C3C3C] hover:border-indigo-500/50 px-2 py-1 rounded text-[11px] font-mono text-gray-200 transition-colors cursor-pointer"
            title="Change Copilot Model & Manage OpenRouter/Groq/Gemini API Keys"
          >
            <Cpu className="w-3 h-3 text-indigo-400" />
            <span className="truncate max-w-[110px] font-semibold text-indigo-300">{currentModel.name}</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          <button
            onClick={onOpenCopilotSettings}
            className="p-1 hover:bg-[#333333] rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Copilot Engine Settings & Third-Party API Keys"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. CHAT MESSAGES STREAM */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5 bg-[#1E1E1E]">
        {messages.map((msg) => {
          if (msg.sender === 'system') {
            return (
              <div key={msg.id} className="p-2 bg-[#252526]/80 rounded border border-[#333333] text-[11px] text-gray-400 font-mono flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-200">$1</strong>') }} />
              </div>
            );
          }

          const isAi = msg.sender === 'ai';

          return (
            <div 
              key={msg.id}
              className={`rounded-lg border p-3 text-xs leading-relaxed transition-all ${
                isAi 
                  ? 'bg-[#252526] border-[#388BFD]/30 text-[#CCCCCC] shadow-xs' 
                  : 'bg-[#007ACC]/15 border-[#007ACC]/40 text-white ml-3'
              }`}
            >
              {/* Message Header */}
              <div className="flex items-center justify-between mb-1.5 text-[10px] text-[#858585]">
                <div className="flex items-center gap-1.5 font-bold">
                  {isAi ? (
                    <>
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      <span className="text-indigo-300 font-mono">Copilot ({msg.modelUsed || currentModel.name})</span>
                    </>
                  ) : (
                    <span className="text-gray-300">You (Developer)</span>
                  )}
                </div>
                <span>{msg.time}</span>
              </div>

              {/* Message Body */}
              <div className="space-y-2 text-xs">
                {msg.text.split('\n\n').map((para, pIdx) => {
                  if (para.startsWith('### ')) {
                    return <h4 key={pIdx} className="font-bold text-white text-xs mt-1">{para.replace('### ', '')}</h4>;
                  }
                  return (
                    <p 
                      key={pIdx} 
                      className="text-gray-200"
                      dangerouslySetInnerHTML={{ 
                        __html: para
                          .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                          .replace(/`([^`]+)`/g, '<code class="bg-[#181818] px-1 py-0.5 rounded text-amber-300 font-mono text-[11px] border border-[#333333]">$1</code>')
                      }} 
                    />
                  );
                })}
              </div>

              {/* PROPOSED CODE CHANGE CARD WITH PERMISSION REQUEST */}
              {msg.proposedChange && (
                <div className="mt-3 bg-[#181818] border border-[#3C3C3C] rounded-lg overflow-hidden shadow-md">
                  
                  {/* Proposal Header */}
                  <div className="p-2.5 bg-[#202020] border-b border-[#303030] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-[#3572A5]" />
                      <span className="font-mono text-xs font-bold text-white">{msg.proposedChange.file}</span>
                      <span className="text-[10px] font-mono bg-[#2A2D2E] text-indigo-300 px-1.5 py-0.5 rounded border border-[#3C3C3C]">
                        Lines {msg.proposedChange.startLine}-{msg.proposedChange.endLine}
                      </span>
                    </div>
                    
                    <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                      {msg.proposedChange.diffSummary}
                    </span>
                  </div>

                  {/* Description & Reason */}
                  <div className="p-3 text-[11px] text-gray-300 space-y-1.5 bg-[#141414]">
                    <div className="font-semibold text-white">{msg.proposedChange.title}</div>
                    <div className="text-gray-400 leading-relaxed font-sans">{msg.proposedChange.description}</div>
                  </div>

                  {/* UNIFIED CODE DIFF PREVIEW */}
                  <div className="p-2.5 font-mono text-[11px] space-y-0.5 bg-[#0D0D0D] border-y border-[#262626]">
                    <div className="text-[10px] text-gray-500 mb-1 flex items-center justify-between">
                      <span>@@ -6,1 +6,4 @@ diff preview</span>
                      <button
                        onClick={() => handleCopyCode(msg.proposedChange!.proposedCode, msg.proposedChange!.id)}
                        className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        {copiedDiffId === msg.proposedChange.id ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedDiffId === msg.proposedChange.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    {/* Removed Line */}
                    <div className="flex items-start bg-rose-950/30 border-l-2 border-rose-500 text-rose-300 px-2 py-0.5">
                      <span className="select-none text-rose-500 w-4 font-bold">-</span>
                      <span className="line-through opacity-85">{msg.proposedChange.originalCode}</span>
                    </div>

                    {/* Added Lines */}
                    {msg.proposedChange.proposedCode.split('\n').map((line, lIdx) => (
                      <div key={lIdx} className="flex items-start bg-emerald-950/30 border-l-2 border-emerald-500 text-emerald-300 px-2 py-0.5">
                        <span className="select-none text-emerald-500 w-4 font-bold">+</span>
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>

                  {/* PERMISSION REQUEST & ACTION BUTTONS */}
                  <div className="p-3 bg-[#1C1C1C] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    
                    {/* Status Badge */}
                    <div className="flex items-center gap-1.5 text-[11px]">
                      {msg.proposedChange.status === 'pending_permission' && (
                        <div className="flex items-center gap-1.5 text-amber-300 font-medium">
                          <ShieldCheck className="w-4 h-4 text-amber-400 animate-pulse" />
                          <span>Requires your permission to apply auto-changes</span>
                        </div>
                      )}
                      {msg.proposedChange.status === 'approved_and_applied' && (
                        <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Auto-changes applied to source code ✓</span>
                        </div>
                      )}
                      {msg.proposedChange.status === 'rejected' && (
                        <div className="flex items-center gap-1.5 text-rose-400 font-medium">
                          <AlertCircle className="w-4 h-4 text-rose-400" />
                          <span>Proposal rejected (No changes made)</span>
                        </div>
                      )}
                      {msg.proposedChange.status === 'reverted' && (
                        <div className="flex items-center gap-1.5 text-gray-400 font-medium">
                          <RotateCw className="w-4 h-4 text-gray-400" />
                          <span>Changes reverted to original</span>
                        </div>
                      )}
                    </div>

                    {/* Interactive Action Controls */}
                    <div className="flex items-center gap-2 justify-end">
                      {msg.proposedChange.status === 'pending_permission' && (
                        <>
                          <button
                            onClick={() => handleRejectProposal(msg.proposedChange!.id)}
                            className="px-2.5 py-1.5 bg-[#2D2D2D] hover:bg-[#3D3D3D] text-gray-300 hover:text-white rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>

                          <button
                            onClick={() => handleApproveProposal(msg.proposedChange!.id)}
                            className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve & Apply Auto-Changes</span>
                          </button>
                        </>
                      )}

                      {msg.proposedChange.status === 'approved_and_applied' && (
                        <button
                          onClick={() => handleRevertProposal(msg.proposedChange!.id)}
                          className="px-2.5 py-1 bg-[#2D2D2D] hover:bg-[#3D3D3D] text-gray-300 hover:text-white rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <RotateCw className="w-3 h-3" />
                          <span>Revert Changes</span>
                        </button>
                      )}
                    </div>

                  </div>

                </div>
              )}

              {/* QUICK SUGGESTION CHIPS */}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-[#333333]/60 flex flex-wrap gap-1.5">
                  {msg.suggestions.map((sug, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => handleSendMessage(sug)}
                      className="text-[11px] bg-[#181818] hover:bg-[#2A2D2E] text-indigo-300 hover:text-white px-2.5 py-1 rounded border border-[#3C3C3C] hover:border-indigo-500/50 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>{sug}</span>
                      <ArrowRight className="w-3 h-3 opacity-60" />
                    </button>
                  ))}
                </div>
              )}

            </div>
          );
        })}

        {/* Thinking / Processing indicator */}
        {isThinking && (
          <div className="p-3 rounded-lg bg-[#252526] border border-indigo-500/30 flex items-center gap-2.5 text-xs text-indigo-300 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
            <span><strong>{currentModel.name}</strong> is generating code diagnosis and diff...</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* 3. INPUT FORM & QUICK SLASH ACTIONS */}
      <div className="p-3 bg-[#252526] border-t border-[#191919] space-y-2">
        
        {/* Quick Prompt Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] text-gray-400 pb-0.5">
          <button
            onClick={() => handleSendMessage('Fix the IndexError on line 6')}
            className="px-2 py-0.5 rounded bg-[#1E1E1E] hover:bg-[#333333] text-indigo-300 border border-[#333333] whitespace-nowrap cursor-pointer flex items-center gap-1"
          >
            <Wand2 className="w-3 h-3 text-indigo-400" />
            <span>/fix (Auto-Repair)</span>
          </button>

          <button
            onClick={() => handleSendMessage('Explain line 6 vulnerability')}
            className="px-2 py-0.5 rounded bg-[#1E1E1E] hover:bg-[#333333] text-gray-300 border border-[#333333] whitespace-nowrap cursor-pointer"
          >
            /explain
          </button>

          <button
            onClick={() => handleSendMessage('Run pytest tests')}
            className="px-2 py-0.5 rounded bg-[#1E1E1E] hover:bg-[#333333] text-green-300 border border-[#333333] whitespace-nowrap cursor-pointer flex items-center gap-1"
          >
            <Play className="w-2.5 h-2.5 fill-current" />
            <span>/test</span>
          </button>

          <button
            onClick={onOpenCopilotSettings}
            className="px-2 py-0.5 rounded bg-[#1E1E1E] hover:bg-[#333333] text-amber-300 border border-[#333333] whitespace-nowrap cursor-pointer flex items-center gap-1 ml-auto"
            title="Configure OpenRouter, Groq, Gemini API Keys"
          >
            <Key className="w-3 h-3 text-amber-400" />
            <span>API Keys</span>
          </button>
        </div>

        {/* Input Textarea & Send Button */}
        <form onSubmit={handleFormSubmit} className="flex items-end gap-2">
          <div className="flex-1 bg-[#1E1E1E] border border-[#3C3C3C] focus-within:border-[#007ACC] rounded-md p-1.5 flex flex-col gap-1">
            <textarea
              rows={2}
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`Ask ${currentModel.name} anything about ${activeFile}... (Enter to send)`}
              className="w-full bg-transparent text-white placeholder-gray-500 text-xs focus:outline-none resize-none font-sans"
            />
          </div>

          <button
            type="submit"
            disabled={!inputQuery.trim() || isThinking}
            className={`p-2.5 rounded-md font-semibold text-white transition-all cursor-pointer shrink-0 ${
              inputQuery.trim() && !isThinking
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-900/30'
                : 'bg-[#333333] text-gray-500 cursor-not-allowed'
            }`}
            title="Send to Copilot"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono px-0.5">
          <span>Engine: <strong className="text-gray-400">{currentModel.name}</strong></span>
          <span>Shift+Enter for new line</span>
        </div>

      </div>

    </div>
  );
};
