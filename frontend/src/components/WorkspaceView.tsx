import {
  AlertCircle,
  Bug,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Columns,
  Cpu,
  FileCode,
  FileText,
  Folder,
  GitBranch,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Play,
  Puzzle,
  RefreshCw,
  RotateCw,
  Search,
  Send,
  Settings,
  Sparkles,
  Terminal as TerminalIcon,
  X
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Bug as BugType } from '../types';

interface WorkspaceViewProps {
  initialSelectedBug?: BugType | null;
  activeModel?: string;
  onOpenModelSelector?: () => void;
}

type ActivityBarTab = 'explorer' | 'search' | 'git' | 'debug' | 'extensions' | 'copilot';
type BottomPanelTab = 'problems' | 'output' | 'debug' | 'terminal' | 'copilot';

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  initialSelectedBug,
  activeModel = 'GPT-4-Turbo',
  onOpenModelSelector
}) => {
  void initialSelectedBug; // TODO: wire this up to pre-select the bug in the editor

  // Activity bar state
  const [activeActivityTab, setActiveActivityTab] = useState<ActivityBarTab>('explorer');
  
  // File state
  const [activeFile, setActiveFile] = useState<string>('auth_service.py');
  const [openFiles, setOpenFiles] = useState<string[]>(['auth_service.py', 'database_utils.js', 'api_gateway.go']);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    src: true,
    services: true,
    app: true,
  });
  

  // Editor states
  const [isPatchApplied, setIsPatchApplied] = useState(false);
  const [isDiffMode, setIsDiffMode] = useState(false);
  const [breakpoints, setBreakpoints] = useState<number[]>([6]);
  const [showErrorHover, setShowErrorHover] = useState(true);
  const [, setSelectedLine] = useState<number>(6);

  // Bottom Panel state
  const [bottomTab, setBottomTab] = useState<BottomPanelTab>('problems');
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(true);
  const [isBottomPanelMaximized, setIsBottomPanelMaximized] = useState(false);

  // Terminal Interactive State
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    'Python 3.11.6 (main, Nov 14 2024, 18:22:05) [GCC 11.4.0] on linux',
    'Type "help", "copyright", "credits" or "license" for more information.',
    '➜ nexus-v3 git:(main) ✗ pytest tests/test_auth.py',
    '============================= test session starts =============================',
    'collected 3 items',
    'tests/test_auth.py::test_valid_token PASSED                              [ 33%]',
    'tests/test_auth.py::test_expired_token PASSED                            [ 66%]',
    'tests/test_auth.py::test_empty_session_token FAILED                      [100%]',
    '',
    '================================== FAILURES ===================================',
    '__________________________ test_empty_session_token ___________________________',
    '    def validate_session(token):',
    '>       user_id = session[0].get("id")',
    'E       IndexError: tuple index out of range at auth_service.py:6',
    '========================= 1 failed, 2 passed in 0.42s =========================',
    '➜ nexus-v3 git:(main) ✗ '
  ]);

  // AI Copilot Chat state
  const [copilotInput, setCopilotInput] = useState('');
  const [copilotMessages, setCopilotMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: `Hello! I'm running ${activeModel}. I detected a potential **IndexError** on line 6 in \`auth_service.py\`. \`session[0]\` is accessed without verifying if \`session\` contains query records. Would you like me to generate a verified guard clause?`,
      time: '10:42 AM'
    }
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const copilotEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalHistory]);

  useEffect(() => {
    copilotEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [copilotMessages]);

  const toggleFolder = (folderKey: string) => {
    setOpenFolders(prev => ({ ...prev, [folderKey]: !prev[folderKey] }));
  };

  const handleOpenFile = (filename: string) => {
    setActiveFile(filename);
    if (!openFiles.includes(filename)) {
      setOpenFiles(prev => [...prev, filename]);
    }
  };

  const handleCloseFile = (filename: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = openFiles.filter(f => f !== filename);
    setOpenFiles(remaining);
    if (activeFile === filename && remaining.length > 0) {
      setActiveFile(remaining[remaining.length - 1]);
    }
  };

  const toggleBreakpoint = (lineNum: number) => {
    setBreakpoints(prev => 
      prev.includes(lineNum) ? prev.filter(l => l !== lineNum) : [...prev, lineNum]
    );
  };

  const handleApplyFix = () => {
    setIsPatchApplied(true);
    setShowErrorHover(false);
    setTerminalHistory(prev => [
      ...prev,
      '➜ nexus-v3 git:(main) ✗ bugfixai apply --patch BUG-001',
      '✔ AST patch applied to src/services/auth_service.py',
      '✔ Running pytest verification suite in container...',
      'tests/test_auth.py::test_empty_session_token PASSED                      [100%]',
      '========================= 3 passed in 0.28s (0 regressions) =========================',
      '➜ nexus-v3 git:(main) '
    ]);
    setCopilotMessages(prev => [
      ...prev,
      {
        sender: 'ai',
        text: '✨ **Patch successfully applied to `auth_service.py`!** All 3 test cases in Pytest now pass with 0 regressions.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleRevertFix = () => {
    setIsPatchApplied(false);
    setShowErrorHover(true);
  };

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;
    const cmd = terminalInput.trim();
    setTerminalInput('');

    let output = '';
    if (cmd === 'clear') {
      setTerminalHistory(['➜ nexus-v3 git:(main) ']);
      return;
    } else if (cmd === 'pytest' || cmd.startsWith('pytest')) {
      if (isPatchApplied) {
        output = '========================= 3 passed in 0.24s =========================';
      } else {
        output = 'FAILED tests/test_auth.py::test_empty_session_token - IndexError: tuple index out of range\n========================= 1 failed, 2 passed in 0.38s =========================';
      }
    } else if (cmd === 'fix' || cmd === 'auto-fix') {
      handleApplyFix();
      return;
    } else if (cmd === 'git status') {
      output = isPatchApplied 
        ? 'On branch main\nChanges not staged for commit:\n  modified:   src/services/auth_service.py'
        : 'On branch main\nnothing to commit, working tree clean';
    } else if (cmd === 'git diff') {
      output = isPatchApplied
        ? '@@ -6,1 +6,4 @@\n-    user_id = session[0].get("id")\n+    if session and len(session) > 0:\n+        user_id = session[0].get("id")\n+    else:\n+        return False'
        : '(no changes)';
    } else if (cmd === 'help') {
      output = 'Available commands: pytest, fix, git status, git diff, clear, python --version, model';
    } else if (cmd === 'model') {
      output = `Active Model: ${activeModel}`;
    } else {
      output = `zsh: command executed: ${cmd}`;
    }

    setTerminalHistory(prev => [
      ...prev,
      `➜ nexus-v3 git:(main) ${cmd}`,
      ...(output ? [output] : []),
      '➜ nexus-v3 git:(main) '
    ]);
  };

  const handleCopilotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotInput.trim()) return;
    const query = copilotInput.trim();
    setCopilotInput('');

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setCopilotMessages(prev => [
      ...prev,
      { sender: 'user', text: query, time: now },
      { 
        sender: 'ai', 
        text: `Using **${activeModel}**: In \`${activeFile}\`, accessing index \`[0]\` on the database query result directly assumes a non-empty result set. In Python, an empty query result evaluates to \`()\` or \`[]\`, triggering an \`IndexError\`. Guarding with \`if session and len(session) > 0:\` or using an ORM \`.first()\` method is the recommended fix.`,
        time: now 
      }
    ]);
  };

  return (
    <div id="vs-code-workspace" className="flex-1 flex flex-col h-full overflow-hidden bg-[#1E1E1E] text-[#CCCCCC] font-sans select-none">
      
      {/* VS Code Main Layout Area (Activity Bar + SideBar + Editor Group) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* 1. VS Code ACTIVITY BAR (48px Width) */}
        <div className="w-12 bg-[#333333] flex flex-col justify-between items-center py-2 shrink-0 z-20 border-r border-[#252526]">
          
          {/* Top Activity Icons */}
          <div className="flex flex-col items-center gap-1 w-full">
            
            {/* Explorer */}
            <button
              onClick={() => setActiveActivityTab(activeActivityTab === 'explorer' ? ('' as any) : 'explorer')}
              className={`w-full h-11 flex items-center justify-center relative transition-colors cursor-pointer ${
                activeActivityTab === 'explorer' ? 'text-white' : 'text-[#858585] hover:text-white'
              }`}
              title="Explorer (Ctrl+Shift+E)"
            >
              {activeActivityTab === 'explorer' && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white" />
              )}
              <Folder className="w-5 h-5" />
            </button>

            {/* Search */}
            <button
              onClick={() => setActiveActivityTab(activeActivityTab === 'search' ? ('' as any) : 'search')}
              className={`w-full h-11 flex items-center justify-center relative transition-colors cursor-pointer ${
                activeActivityTab === 'search' ? 'text-white' : 'text-[#858585] hover:text-white'
              }`}
              title="Search (Ctrl+Shift+F)"
            >
              {activeActivityTab === 'search' && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white" />
              )}
              <Search className="w-5 h-5" />
            </button>

            {/* Source Control / Git */}
            <button
              onClick={() => setActiveActivityTab(activeActivityTab === 'git' ? ('' as any) : 'git')}
              className={`w-full h-11 flex items-center justify-center relative transition-colors cursor-pointer ${
                activeActivityTab === 'git' ? 'text-white' : 'text-[#858585] hover:text-white'
              }`}
              title="Source Control (Ctrl+Shift+G)"
            >
              {activeActivityTab === 'git' && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white" />
              )}
              <div className="relative">
                <GitBranch className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#007ACC] text-[9px] font-bold text-white flex items-center justify-center">
                  1
                </span>
              </div>
            </button>

            {/* Run & Debug */}
            <button
              onClick={() => setActiveActivityTab(activeActivityTab === 'debug' ? ('' as any) : 'debug')}
              className={`w-full h-11 flex items-center justify-center relative transition-colors cursor-pointer ${
                activeActivityTab === 'debug' ? 'text-white' : 'text-[#858585] hover:text-white'
              }`}
              title="Run and Debug (Ctrl+Shift+D)"
            >
              {activeActivityTab === 'debug' && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white" />
              )}
              <Bug className="w-5 h-5" />
            </button>

            {/* Extensions */}
            <button
              onClick={() => setActiveActivityTab(activeActivityTab === 'extensions' ? ('' as any) : 'extensions')}
              className={`w-full h-11 flex items-center justify-center relative transition-colors cursor-pointer ${
                activeActivityTab === 'extensions' ? 'text-white' : 'text-[#858585] hover:text-white'
              }`}
              title="Extensions (Ctrl+Shift+X)"
            >
              {activeActivityTab === 'extensions' && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white" />
              )}
              <Puzzle className="w-5 h-5" />
            </button>

            {/* AI Copilot & BugFixer Tool */}
            <button
              onClick={() => setActiveActivityTab(activeActivityTab === 'copilot' ? ('' as any) : 'copilot')}
              className={`w-full h-11 flex items-center justify-center relative transition-colors cursor-pointer ${
                activeActivityTab === 'copilot' ? 'text-[#388BFD]' : 'text-[#858585] hover:text-[#388BFD]'
              }`}
              title={`BugFixer AI Copilot (${activeModel})`}
            >
              {activeActivityTab === 'copilot' && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#388BFD]" />
              )}
              <div className="relative">
                <Sparkles className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </div>
            </button>

          </div>

          {/* Bottom Activity Icons */}
          <div className="flex flex-col items-center gap-2 w-full text-[#858585]">
            <button 
              onClick={onOpenModelSelector}
              className="w-full h-10 flex items-center justify-center hover:text-white cursor-pointer"
              title={`Active Model: ${activeModel} (Click to change)`}
            >
              <Cpu className="w-5 h-5 text-indigo-400" />
            </button>
            <button className="w-full h-10 flex items-center justify-center hover:text-white cursor-pointer" title="Settings">
              <Settings className="w-5 h-5" />
            </button>
          </div>

        </div>

        {/* 2. VS Code SIDEBAR PANEL (240px Width) */}
        {activeActivityTab && (
          <div className="w-60 bg-[#252526] border-r border-[#191919] flex flex-col shrink-0 text-xs text-[#CCCCCC] select-none">
            
            {/* Sidebar Header */}
            <div className="px-4 py-2.5 flex items-center justify-between text-[11px] font-bold tracking-wider uppercase text-[#BBBBBB] border-b border-[#333333]">
              <span>
                {activeActivityTab === 'explorer' && 'EXPLORER: NEXUS-V3'}
                {activeActivityTab === 'search' && 'SEARCH'}
                {activeActivityTab === 'git' && 'SOURCE CONTROL: GIT'}
                {activeActivityTab === 'debug' && 'RUN AND DEBUG'}
                {activeActivityTab === 'extensions' && 'EXTENSIONS'}
                {activeActivityTab === 'copilot' && `BUGFIXER COPILOT (${activeModel})`}
              </span>
              <div className="flex items-center gap-1 text-[#858585]">
                <button className="hover:text-white p-0.5"><MoreHorizontal className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            {/* Sidebar Content Switch */}
            <div className="flex-1 overflow-y-auto">
              
              {/* TAB: EXPLORER */}
              {activeActivityTab === 'explorer' && (
                <div className="py-1">
                  
                  {/* OPEN EDITORS Accordion */}
                  <div className="px-2 py-1 flex items-center gap-1 font-bold text-[11px] text-[#BBBBBB] hover:bg-[#2A2D2E] cursor-pointer">
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>OPEN EDITORS</span>
                  </div>
                  
                  <div className="pl-4 pr-2 space-y-0.5 mb-2">
                    {openFiles.map(file => (
                      <div
                        key={file}
                        onClick={() => setActiveFile(file)}
                        className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer ${
                          activeFile === file ? 'bg-[#37373D] text-white' : 'hover:bg-[#2A2D2E] text-[#CCCCCC]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <FileCode className={`w-3.5 h-3.5 ${file.endsWith('.py') ? 'text-[#3572A5]' : file.endsWith('.js') ? 'text-[#F1E05A]' : 'text-[#00ADD8]'}`} />
                          <span className="truncate">{file}</span>
                          {file === 'auth_service.py' && !isPatchApplied && (
                            <span className="text-[10px] text-[#F48771] font-bold">●</span>
                          )}
                        </div>
                        <button 
                          onClick={(e) => handleCloseFile(file, e)}
                          className="hover:text-white p-0.5 text-[#858585]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* WORKSPACE TREE Accordion */}
                  <div className="px-2 py-1 flex items-center gap-1 font-bold text-[11px] text-[#BBBBBB] hover:bg-[#2A2D2E] cursor-pointer border-t border-[#333333]">
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>NEXUS-V3</span>
                  </div>

                  <div className="pl-2 pr-1 space-y-0.5">
                    
                    {/* src folder */}
                    <div>
                      <div 
                        onClick={() => toggleFolder('src')}
                        className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#2A2D2E] cursor-pointer"
                      >
                        {openFolders['src'] ? <ChevronDown className="w-3.5 h-3.5 text-[#858585]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#858585]" />}
                        <Folder className="w-3.5 h-3.5 text-[#DCB67A]" />
                        <span>src</span>
                      </div>

                      {openFolders['src'] && (
                        <div className="pl-4">
                          
                          {/* services folder */}
                          <div 
                            onClick={() => toggleFolder('services')}
                            className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#2A2D2E] cursor-pointer"
                          >
                            {openFolders['services'] ? <ChevronDown className="w-3.5 h-3.5 text-[#858585]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#858585]" />}
                            <Folder className="w-3.5 h-3.5 text-[#DCB67A]" />
                            <span>services</span>
                          </div>

                          {openFolders['services'] && (
                            <div className="pl-4 space-y-0.5">
                              {/* auth_service.py */}
                              <div
                                onClick={() => handleOpenFile('auth_service.py')}
                                className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer ${
                                  activeFile === 'auth_service.py' ? 'bg-[#37373D] text-white font-medium' : 'hover:bg-[#2A2D2E]'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <FileCode className="w-3.5 h-3.5 text-[#3572A5]" />
                                  <span className="truncate">auth_service.py</span>
                                </div>
                                {!isPatchApplied && (
                                  <span className="text-[10px] px-1 bg-[#4B1113] text-[#F48771] rounded font-bold border border-[#F48771]/30">
                                    1
                                  </span>
                                )}
                              </div>

                              {/* database_utils.js */}
                              <div
                                onClick={() => handleOpenFile('database_utils.js')}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer ${
                                  activeFile === 'database_utils.js' ? 'bg-[#37373D] text-white font-medium' : 'hover:bg-[#2A2D2E]'
                                }`}
                              >
                                <FileCode className="w-3.5 h-3.5 text-[#F1E05A]" />
                                <span>database_utils.js</span>
                              </div>

                              {/* rate_limiter.ts */}
                              <div
                                onClick={() => handleOpenFile('rate_limiter.ts')}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer ${
                                  activeFile === 'rate_limiter.ts' ? 'bg-[#37373D] text-white font-medium' : 'hover:bg-[#2A2D2E]'
                                }`}
                              >
                                <FileCode className="w-3.5 h-3.5 text-[#3178C6]" />
                                <span>rate_limiter.ts</span>
                              </div>
                            </div>
                          )}

                          {/* app folder */}
                          <div 
                            onClick={() => toggleFolder('app')}
                            className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#2A2D2E] cursor-pointer"
                          >
                            {openFolders['app'] ? <ChevronDown className="w-3.5 h-3.5 text-[#858585]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#858585]" />}
                            <Folder className="w-3.5 h-3.5 text-[#DCB67A]" />
                            <span>app</span>
                          </div>

                          {openFolders['app'] && (
                            <div className="pl-4">
                              <div
                                onClick={() => handleOpenFile('api_gateway.go')}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer ${
                                  activeFile === 'api_gateway.go' ? 'bg-[#37373D] text-white font-medium' : 'hover:bg-[#2A2D2E]'
                                }`}
                              >
                                <FileCode className="w-3.5 h-3.5 text-[#00ADD8]" />
                                <span>api_gateway.go</span>
                              </div>
                            </div>
                          )}

                        </div>
                      )}
                    </div>

                    {/* Root files */}
                    <div 
                      onClick={() => handleOpenFile('Dockerfile')}
                      className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#2A2D2E] cursor-pointer"
                    >
                      <FileCode className="w-3.5 h-3.5 text-[#2496ED]" />
                      <span>Dockerfile</span>
                    </div>

                    <div 
                      onClick={() => handleOpenFile('requirements.txt')}
                      className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#2A2D2E] cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#3572A5]" />
                      <span>requirements.txt</span>
                    </div>

                    <div 
                      onClick={() => handleOpenFile('README.md')}
                      className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#2A2D2E] cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#42A5F5]" />
                      <span>README.md</span>
                    </div>

                  </div>

                </div>
              )}

              {/* TAB: SEARCH */}
              {activeActivityTab === 'search' && (
                <div className="p-3 space-y-3">
                  <input
                    type="text"
                    defaultValue="session[0]"
                    placeholder="Search in files..."
                    className="w-full bg-[#3C3C3C] border border-[#3C3C3C] focus:border-[#007ACC] text-white px-2 py-1.5 rounded text-xs focus:outline-none"
                  />
                  <div className="text-[11px] text-[#858585]">
                    1 result in 1 file
                  </div>
                  <div className="p-2 bg-[#1E1E1E] rounded border border-[#333333]">
                    <div className="font-bold text-white flex items-center gap-1">
                      <FileCode className="w-3 h-3 text-[#3572A5]" />
                      <span>auth_service.py</span>
                    </div>
                    <div className="text-[11px] text-[#858585] mt-1 pl-2 border-l border-[#007ACC]">
                      Line 6: user_id = <strong className="text-amber-400">session[0]</strong>.get('id')
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: GIT */}
              {activeActivityTab === 'git' && (
                <div className="p-3 space-y-3">
                  <div className="text-[11px] font-bold text-[#BBBBBB]">STAGED / WORKING TREE</div>
                  <div className="p-2 bg-[#1E1E1E] rounded border border-[#333333] space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-[#F48771]">auth_service.py</span>
                      <span className="text-[10px] font-bold text-[#CCA700]">M</span>
                    </div>
                    <div className="text-[10px] text-[#858585] font-mono">+4 -1 lines</div>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Commit message (Ctrl+Enter to commit)"
                    defaultValue="fix(auth): prevent IndexError on empty session tuple"
                    className="w-full bg-[#3C3C3C] text-white p-2 rounded text-xs border border-[#3C3C3C] focus:border-[#007ACC] focus:outline-none font-mono"
                  />
                  <button className="w-full bg-[#007ACC] hover:bg-[#0062A3] text-white py-1.5 rounded text-xs font-semibold">
                    Commit & Push to origin/main
                  </button>
                </div>
              )}

              {/* TAB: COPILOT CHAT */}
              {activeActivityTab === 'copilot' && (
                <div className="flex flex-col h-full p-2 space-y-2 text-xs">
                  <div className="p-2 bg-[#1E1E1E] rounded border border-[#333333] flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-white">Engine: {activeModel}</span>
                    <button 
                      onClick={onOpenModelSelector}
                      className="text-[10px] text-[#388BFD] hover:underline"
                    >
                      Change
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 max-h-[360px] pr-1">
                    {copilotMessages.map((msg, i) => (
                      <div 
                        key={i} 
                        className={`p-2.5 rounded-lg border ${
                          msg.sender === 'ai' 
                            ? 'bg-[#1E1E1E] border-[#388BFD]/30 text-[#CCCCCC]' 
                            : 'bg-[#007ACC]/20 border-[#007ACC]/40 text-white ml-2'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1 text-[10px] text-[#858585]">
                          <span className="font-bold">{msg.sender === 'ai' ? `BugFixer (${activeModel})` : 'You'}</span>
                          <span>{msg.time}</span>
                        </div>
                        <div className="text-xs leading-relaxed">{msg.text}</div>
                      </div>
                    ))}
                    <div ref={copilotEndRef} />
                  </div>

                  <form onSubmit={handleCopilotSubmit} className="pt-2 border-t border-[#333333] flex gap-1">
                    <input
                      type="text"
                      placeholder="Ask copilot about this bug..."
                      value={copilotInput}
                      onChange={(e) => setCopilotInput(e.target.value)}
                      className="flex-1 bg-[#3C3C3C] text-white px-2.5 py-1.5 rounded text-xs focus:outline-none focus:border-[#007ACC]"
                    />
                    <button type="submit" className="bg-[#007ACC] text-white px-2.5 py-1.5 rounded hover:bg-[#0062A3]">
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              )}

            </div>

          </div>
        )}

        {/* 3. VS CODE MAIN EDITOR AREA */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#1E1E1E] min-w-0">
          
          {/* VS Code Editor Tabs Bar */}
          <div className="flex items-center justify-between bg-[#252526] border-b border-[#191919] overflow-x-auto text-xs">
            
            {/* Open Tabs */}
            <div className="flex items-center overflow-x-auto">
              {openFiles.map(file => {
                const isActive = activeFile === file;
                return (
                  <div
                    key={file}
                    onClick={() => setActiveFile(file)}
                    className={`flex items-center gap-2 px-3 py-2 border-r border-[#191919] cursor-pointer transition-colors ${
                      isActive 
                        ? 'bg-[#1E1E1E] text-white border-t-2 border-t-[#007ACC]' 
                        : 'bg-[#2D2D2D] text-[#969696] hover:bg-[#2A2A2A] hover:text-[#CCCCCC]'
                    }`}
                  >
                    <FileCode className={`w-3.5 h-3.5 ${file.endsWith('.py') ? 'text-[#3572A5]' : file.endsWith('.js') ? 'text-[#F1E05A]' : 'text-[#00ADD8]'}`} />
                    <span className="font-mono text-xs">{file}</span>
                    {file === 'auth_service.py' && !isPatchApplied && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F48771]" />
                    )}
                    <button 
                      onClick={(e) => handleCloseFile(file, e)}
                      className="hover:bg-[#3C3C3C] p-0.5 rounded text-[#858585] hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Editor Action Buttons (Top Right) */}
            <div className="flex items-center gap-1.5 px-3 shrink-0 text-[#858585]">
              
              {/* Diff Toggle */}
              <button
                onClick={() => setIsDiffMode(!isDiffMode)}
                className={`p-1.5 rounded hover:text-white hover:bg-[#3C3C3C] flex items-center gap-1 text-xs cursor-pointer ${
                  isDiffMode ? 'text-[#007ACC] bg-[#3C3C3C]' : ''
                }`}
                title="Toggle Side-by-Side Unified Diff View"
              >
                <Columns className="w-3.5 h-3.5" />
                <span className="text-[11px] font-mono hidden md:inline">Diff</span>
              </button>

              {/* Run Test/Debug Button */}
              <button
                onClick={() => {
                  setBottomTab('terminal');
                  setIsBottomPanelOpen(true);
                  handleTerminalSubmit({ preventDefault: () => {} } as any);
                }}
                className="p-1.5 rounded hover:text-white hover:bg-[#3C3C3C] text-green-400 flex items-center gap-1 text-xs cursor-pointer"
                title="Run in Python Interactive Terminal (Ctrl+F5)"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>

              {/* Quick AI Auto-Fix */}
              {!isPatchApplied ? (
                <button
                  onClick={handleApplyFix}
                  className="flex items-center gap-1.5 bg-[#007ACC] hover:bg-[#0062A3] text-white px-2.5 py-1 rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  title={`Apply AI Patch with ${activeModel}`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auto-Fix</span>
                </button>
              ) : (
                <button
                  onClick={handleRevertFix}
                  className="flex items-center gap-1 bg-[#3C3C3C] hover:bg-[#4C4C4C] text-gray-300 px-2.5 py-1 rounded text-xs font-medium cursor-pointer"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Revert</span>
                </button>
              )}

              <button className="p-1 hover:text-white"><MoreHorizontal className="w-4 h-4" /></button>
            </div>

          </div>

          {/* VS Code Breadcrumbs Bar */}
          <div className="flex items-center gap-1.5 px-4 py-1 bg-[#1E1E1E] border-b border-[#2D2D2D] text-[11px] text-[#858585] font-mono">
            <span>nexus-v3</span>
            <ChevronRight className="w-3 h-3" />
            <span>src</span>
            <ChevronRight className="w-3 h-3" />
            <span>services</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#CCCCCC] flex items-center gap-1 font-semibold">
              <FileCode className="w-3 h-3 text-[#3572A5]" />
              {activeFile}
            </span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#9CDCFE]">validate_session(token)</span>
          </div>

          {/* VS Code Editor Canvas (Line Numbers + Syntax Highlighted Code + In-line Squiggly Error) */}
          <div className="flex-1 overflow-auto bg-[#1E1E1E] text-xs md:text-sm font-mono flex relative">
            
            {/* Gutter: Breakpoints + Line Numbers */}
            <div className="w-14 bg-[#1E1E1E] border-r border-[#2D2D2D] flex flex-col py-3 select-none text-[#858585] text-right pr-3 shrink-0">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(line => {
                const hasBreakpoint = breakpoints.includes(line);
                const isErrorLine = line === 6;

                return (
                  <div
                    key={line}
                    onClick={() => toggleBreakpoint(line)}
                    className="h-6 flex items-center justify-end gap-1.5 group cursor-pointer"
                  >
                    {/* Breakpoint red circle */}
                    <span className={`w-2.5 h-2.5 rounded-full transition-opacity ${
                      hasBreakpoint ? 'bg-[#E51400] opacity-100' : 'bg-[#E51400]/40 opacity-0 group-hover:opacity-100'
                    }`} />
                    
                    {/* Line number */}
                    <span className={`${isErrorLine ? 'text-[#F48771] font-bold' : 'text-[#858585]'}`}>
                      {line}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Code Body Area */}
            <div className="flex-1 py-3 px-4 leading-6 overflow-x-auto text-[#D4D4D4]">
              
              {/* Line 1 */}
              <div>
                <span className="text-[#569CD6]">import</span> <span className="text-[#4EC9B0]">os</span>, <span className="text-[#4EC9B0]">jwt</span>
              </div>

              {/* Line 2 */}
              <div>
                <span className="text-[#569CD6]">def</span> <span className="text-[#DCDCAA]">validate_session</span>(<span className="text-[#9CDCFE]">token</span>: <span className="text-[#4EC9B0]">str</span>) -&gt; <span className="text-[#4EC9B0]">bool</span>:
              </div>

              {/* Line 3 */}
              <div className="pl-4">
                <span className="text-[#569CD6]">if</span> <span className="text-[#569CD6]">not</span> <span className="text-[#9CDCFE]">token</span>:
              </div>

              {/* Line 4 */}
              <div className="pl-8">
                <span className="text-[#569CD6]">return</span> <span className="text-[#569CD6]">False</span>
              </div>

              {/* Line 5 */}
              <div className="pl-4">
                <span className="text-[#9CDCFE]">session</span> = <span className="text-[#9CDCFE]">db</span>.<span className="text-[#DCDCAA]">query</span>(<span className="text-[#CE9178]">"SELECT * FROM sessions WHERE token = %s"</span>, <span className="text-[#9CDCFE]">token</span>)
              </div>

              {/* Line 6: BUG LINE with SQUIGGLY RED UNDERLINE / VS Code Diagnostics */}
              <div className="relative group">
                {!isPatchApplied ? (
                  <div className="pl-4 bg-[#4B1113]/30 -mx-4 px-4 py-0.5 border-l-2 border-[#F48771] my-0.5">
                    <span className="text-[#9CDCFE]">user_id</span> = <span className="text-[#9CDCFE]">session</span>[<span className="text-[#B5CEA8]">0</span>].<span className="text-[#DCDCAA]">get</span>(<span className="text-[#CE9178]">'id'</span>)
                    
                    {/* VS Code Red Wave Squiggly Marker */}
                    <div className="h-0.5 w-44 bg-repeat-x" style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 6 3' width='6' height='3'%3E%3Cpath d='M0 0 Q 1.5 2, 3 0 T 6 0' fill='none' stroke='%23F48771' stroke-width='1'/%3E%3C/svg%3E")`
                    }} />

                    {/* VS CODE HOVER WIDGET (Classic VS Code Error Diagnostics Popup) */}
                    {showErrorHover && (
                      <div className="absolute left-10 top-7 z-30 w-full max-w-lg bg-[#252526] border border-[#454545] rounded-md shadow-2xl p-3 text-xs font-sans text-[#CCCCCC] space-y-2 animate-in fade-in duration-150">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-[#F48771] shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-white">
                              IndexError: tuple index out of range (BUG-001)
                            </div>
                            <div className="text-[#858585] text-[11px] mt-0.5">
                              <code className="text-[#9CDCFE]">session[0]</code> will raise an unhandled exception if the database query returns 0 rows.
                            </div>
                          </div>
                        </div>

                        {/* Suggested Code Preview */}
                        <div className="bg-[#1E1E1E] p-2 rounded font-mono text-[11px] text-[#4EC9B0] border border-[#333333]">
                          + if session and len(session) &gt; 0:<br/>
                          + &nbsp;&nbsp;&nbsp;&nbsp;user_id = session[0].get('id')
                        </div>

                        {/* Quick Fix Buttons */}
                        <div className="flex items-center gap-2 pt-1 border-t border-[#333333]">
                          <button
                            onClick={handleApplyFix}
                            className="bg-[#007ACC] hover:bg-[#0062A3] text-white px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Apply Fix with {activeModel}</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              setBottomTab('problems');
                              setIsBottomPanelOpen(true);
                            }}
                            className="bg-[#3C3C3C] hover:bg-[#4C4C4C] text-[#CCCCCC] px-2 py-1 rounded text-xs"
                          >
                            Peek Problem
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                ) : (
                  /* Applied Patch Code Line */
                  <div className="pl-4 bg-[#113B11]/30 -mx-4 px-4 py-0.5 border-l-2 border-[#4EC9B0] my-0.5 space-y-0.5 text-[#4EC9B0]">
                    <div>
                      <span className="text-[#569CD6]">if</span> <span className="text-[#9CDCFE]">session</span> <span className="text-[#569CD6]">and</span> <span className="text-[#DCDCAA]">len</span>(<span className="text-[#9CDCFE]">session</span>) &gt; <span className="text-[#B5CEA8]">0</span>:
                    </div>
                    <div className="pl-4">
                      <span className="text-[#9CDCFE]">user_id</span> = <span className="text-[#9CDCFE]">session</span>[<span className="text-[#B5CEA8]">0</span>].<span className="text-[#DCDCAA]">get</span>(<span className="text-[#CE9178]">'id'</span>)
                    </div>
                    <div>
                      <span className="text-[#569CD6]">else</span>:
                    </div>
                    <div className="pl-4">
                      <span className="text-[#569CD6]">return</span> <span className="text-[#569CD6]">False</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Line 7 */}
              <div className="pl-4">
                <span className="text-[#569CD6]">return</span> <span className="text-[#9CDCFE]">user_id</span> <span className="text-[#569CD6]">is</span> <span className="text-[#569CD6]">not</span> <span className="text-[#569CD6]">None</span>
              </div>

              {/* Line 8 */}
              <div></div>

              {/* Line 9 */}
              <div>
                <span className="text-[#6A9955]"># Verified by BugFixer AI Sandbox Runner</span>
              </div>

            </div>

          </div>

          {/* 4. VS CODE INTEGRATED BOTTOM PANEL (Terminal / Problems / Output) */}
          {isBottomPanelOpen && (
            <div className={`border-t border-[#333333] bg-[#1E1E1E] flex flex-col shrink-0 ${
              isBottomPanelMaximized ? 'h-96' : 'h-52'
            }`}>
              
              {/* Panel Tabs Header */}
              <div className="flex items-center justify-between px-4 bg-[#252526] border-b border-[#191919] text-xs">
                <div className="flex items-center gap-4">
                  
                  {/* PROBLEMS */}
                  <button
                    onClick={() => setBottomTab('problems')}
                    className={`py-2 font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5 transition-colors ${
                      bottomTab === 'problems' 
                        ? 'text-white border-b-2 border-b-[#007ACC]' 
                        : 'text-[#858585] hover:text-[#CCCCCC]'
                    }`}
                  >
                    <span>PROBLEMS</span>
                    {!isPatchApplied && (
                      <span className="px-1.5 py-0.2 rounded-full bg-[#E51400] text-white text-[9px] font-bold">
                        1
                      </span>
                    )}
                  </button>

                  {/* OUTPUT */}
                  <button
                    onClick={() => setBottomTab('output')}
                    className={`py-2 font-semibold uppercase tracking-wider text-[11px] transition-colors ${
                      bottomTab === 'output' 
                        ? 'text-white border-b-2 border-b-[#007ACC]' 
                        : 'text-[#858585] hover:text-[#CCCCCC]'
                    }`}
                  >
                    OUTPUT
                  </button>

                  {/* DEBUG CONSOLE */}
                  <button
                    onClick={() => setBottomTab('debug')}
                    className={`py-2 font-semibold uppercase tracking-wider text-[11px] transition-colors ${
                      bottomTab === 'debug' 
                        ? 'text-white border-b-2 border-b-[#007ACC]' 
                        : 'text-[#858585] hover:text-[#CCCCCC]'
                    }`}
                  >
                    DEBUG CONSOLE
                  </button>

                  {/* TERMINAL */}
                  <button
                    onClick={() => setBottomTab('terminal')}
                    className={`py-2 font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5 transition-colors ${
                      bottomTab === 'terminal' 
                        ? 'text-white border-b-2 border-b-[#007ACC]' 
                        : 'text-[#858585] hover:text-[#CCCCCC]'
                    }`}
                  >
                    <TerminalIcon className="w-3 h-3 text-[#388BFD]" />
                    <span>TERMINAL</span>
                  </button>

                  {/* AI COPILOT */}
                  <button
                    onClick={() => setBottomTab('copilot')}
                    className={`py-2 font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5 transition-colors ${
                      bottomTab === 'copilot' 
                        ? 'text-white border-b-2 border-b-[#007ACC]' 
                        : 'text-[#858585] hover:text-[#CCCCCC]'
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span>AI COPILOT</span>
                  </button>

                </div>

                {/* Panel Window Controls */}
                <div className="flex items-center gap-2 text-[#858585]">
                  <button 
                    onClick={() => setIsBottomPanelMaximized(!isBottomPanelMaximized)}
                    className="hover:text-white p-1"
                    title={isBottomPanelMaximized ? "Restore Panel Size" : "Maximize Panel Size"}
                  >
                    {isBottomPanelMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </button>
                  <button 
                    onClick={() => setIsBottomPanelOpen(false)}
                    className="hover:text-white p-1"
                    title="Close Panel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Panel Content Box */}
              <div className="flex-1 overflow-y-auto p-3 font-mono text-xs">
                
                {/* 1. PROBLEMS TAB */}
                {bottomTab === 'problems' && (
                  <div className="space-y-2">
                    {!isPatchApplied ? (
                      <div 
                        onClick={() => setSelectedLine(6)}
                        className="flex items-start gap-2.5 p-2 rounded bg-[#252526] hover:bg-[#2A2D2E] border border-[#333333] cursor-pointer"
                      >
                        <AlertCircle className="w-4 h-4 text-[#F48771] shrink-0 mt-0.5" />
                        <div>
                          <div className="text-white font-semibold flex items-center gap-2">
                            <span>IndexError: tuple index out of range</span>
                            <span className="text-[#858585] text-[11px]">auth_service.py [6, 17]</span>
                            <span className="text-[10px] bg-[#4B1113] text-[#F48771] px-1.5 py-0.2 rounded border border-[#F48771]/30">
                              high-severity
                            </span>
                          </div>
                          <p className="text-[#CCCCCC] text-[11px] mt-0.5 font-sans">
                            Direct dereference of `session[0]` without asserting non-empty tuple query response.
                          </p>
                          <div className="mt-1.5 flex items-center gap-2">
                            <button
                              onClick={handleApplyFix}
                              className="px-2 py-0.5 rounded bg-[#007ACC] hover:bg-[#0062A3] text-white text-[11px] font-sans font-semibold flex items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>Quick Fix ({activeModel})</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-green-400 p-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>No problems have been detected in the workspace.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. OUTPUT TAB */}
                {bottomTab === 'output' && (
                  <div className="text-[#858585] space-y-1 text-[11px]">
                    <div>[BugFixer.ai Extension Host] Initialized v3.4.1</div>
                    <div>[Model Router] Attached to active provider: {activeModel}</div>
                    <div>[Diagnostics] AST scan parsed 14 files in 42ms</div>
                    <div>[Sandbox] Docker container isolated: python-3.11-slim (PID 4092)</div>
                  </div>
                )}

                {/* 3. DEBUG CONSOLE */}
                {bottomTab === 'debug' && (
                  <div className="text-[#D4D4D4] space-y-1">
                    <div className="text-[#858585]">&gt; session = db.query("SELECT * FROM sessions WHERE token = 'bad_token'")</div>
                    <div className="text-amber-300">&lt; session = ()</div>
                    <div className="text-[#858585]">&gt; session[0]</div>
                    <div className="text-[#F48771]">&lt; IndexError: tuple index out of range</div>
                  </div>
                )}

                {/* 4. TERMINAL TAB (Interactive Command Shell) */}
                {bottomTab === 'terminal' && (
                  <div className="flex flex-col h-full justify-between">
                    <div className="space-y-1 overflow-y-auto leading-relaxed">
                      {terminalHistory.map((line, idx) => (
                        <div key={idx} className={line.includes('FAILED') || line.includes('IndexError') ? 'text-[#F48771]' : line.includes('PASSED') ? 'text-[#4EC9B0]' : 'text-[#CCCCCC]'}>
                          {line}
                        </div>
                      ))}
                      <div ref={terminalEndRef} />
                    </div>

                    <form onSubmit={handleTerminalSubmit} className="flex items-center gap-2 pt-2 border-t border-[#333333] mt-2">
                      <span className="text-[#4EC9B0] font-bold">➜ nexus-v3 git:(main)</span>
                      <input
                        type="text"
                        value={terminalInput}
                        onChange={(e) => setTerminalInput(e.target.value)}
                        placeholder="type command (e.g. pytest, fix, git diff, clear)..."
                        className="flex-1 bg-transparent text-white focus:outline-none font-mono text-xs"
                      />
                    </form>
                  </div>
                )}

                {/* 5. AI COPILOT TAB */}
                {bottomTab === 'copilot' && (
                  <div className="space-y-2">
                    <div className="text-[11px] text-gray-400">
                      Chatting with <strong className="text-indigo-400">{activeModel}</strong> inside VS Code context.
                    </div>
                    {copilotMessages.slice(-2).map((m, i) => (
                      <div key={i} className="p-2 bg-[#252526] rounded border border-[#333333] text-xs">
                        <div className="font-bold text-white mb-1">{m.sender === 'ai' ? `BugFixer (${activeModel})` : 'You'}</div>
                        <div className="text-gray-300">{m.text}</div>
                      </div>
                    ))}
                  </div>
                )}

              </div>

            </div>
          )}

        </div>

      </div>

      {/* 5. VS CODE STATUS BAR (Bottom 24px) */}
      <footer className="h-6 bg-[#007ACC] flex items-center justify-between px-3 text-[11px] text-white shrink-0 select-none font-sans z-30">
        
        {/* Left Status Bar Items */}
        <div className="flex items-center gap-3">
          
          {/* Git branch */}
          <button 
            onClick={() => setActiveActivityTab('git')}
            className="flex items-center gap-1 hover:bg-[#0062A3] px-1.5 py-0.5 rounded cursor-pointer"
          >
            <GitBranch className="w-3 h-3" />
            <span>main*</span>
          </button>

          {/* Sync */}
          <button className="flex items-center gap-1 hover:bg-[#0062A3] px-1.5 py-0.5 rounded cursor-pointer">
            <RefreshCw className="w-2.5 h-2.5" />
            <span>0↓ 1↑</span>
          </button>

          {/* Errors & Warnings */}
          <button 
            onClick={() => {
              setBottomTab('problems');
              setIsBottomPanelOpen(true);
            }}
            className="flex items-center gap-1.5 hover:bg-[#0062A3] px-1.5 py-0.5 rounded cursor-pointer"
          >
            <div className="flex items-center gap-0.5">
              <X className="w-3 h-3" />
              <span>{!isPatchApplied ? '1' : '0'}</span>
            </div>
            <div className="flex items-center gap-0.5">
              <AlertCircle className="w-3 h-3" />
              <span>0</span>
            </div>
          </button>

          {/* Active AI Model Pill in Status Bar */}
          <button
            onClick={onOpenModelSelector}
            className="flex items-center gap-1.5 bg-[#005A9E] hover:bg-[#004F8A] px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer"
            title="Click to change active AI model"
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>AI Model: {activeModel}</span>
          </button>

        </div>

        {/* Right Status Bar Items */}
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span className="hidden sm:inline">Ln 6, Col 17</span>
          <span className="hidden sm:inline">Spaces: 4</span>
          <span className="hidden md:inline">UTF-8</span>
          <span className="hidden md:inline">LF</span>
          <span className="flex items-center gap-1 font-sans">
            <FileCode className="w-3 h-3 text-amber-300" />
            <span>Python 3.11</span>
          </span>
          <span className="hidden lg:inline">Prettier ✓</span>
        </div>

      </footer>

    </div>
  );
};
