import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Files,
  File as FileIcon,
  FileCode,
  FilePlus,
  Folder,
  FolderPlus,
  GitBranch,
  Loader2,
  Package,
  PanelBottom,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bug as BugType } from '../types';
import {
  fetchWorkspaceFile,
  fetchWorkspaceTree,
  saveWorkspaceFile,
  WorkspaceTreeNode,
} from '../api/workspace';
import { ApiError } from '../api/client';
import { AgentPanel } from './Agentpanel';

interface WorkspaceViewProps {
  initialSelectedBug?: BugType | null;
  activeModel?: string;
  onOpenModelSelector?: () => void;
  projectId?: string | null;
  bugs?: BugType[];
}

type ActivityView = 'explorer' | 'search' | 'git' | 'extensions' | 'none';
type BottomTab = 'problems' | 'output' | 'terminal';

interface OpenFile {
  path: string;
  content: string;
  savedContent: string;
}

function isDirty(file: OpenFile): boolean {
  return file.content !== file.savedContent;
}

function fileIconColor(name: string): string {
  if (name.endsWith('.py')) return 'text-[#3572A5]';
  if (name.endsWith('.js') || name.endsWith('.jsx')) return 'text-[#F1E05A]';
  if (name.endsWith('.ts') || name.endsWith('.tsx')) return 'text-[#3178C6]';
  if (name.endsWith('.go')) return 'text-[#00ADD8]';
  if (name.endsWith('.md')) return 'text-[#42A5F5]';
  if (name.endsWith('.json')) return 'text-[#CBCB41]';
  return 'text-[#9CDCFE]';
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  initialSelectedBug,
  activeModel = 'GPT-4-Turbo',
  onOpenModelSelector,
  projectId = null,
  bugs = [],
}) => {
  void initialSelectedBug; // TODO: wire this up to pre-select a file relevant to the bug

  // --- Activity bar / panel layout state ---
  const [activityView, setActivityView] = useState<ActivityView>('explorer');
  const [agentPanelOpen, setAgentPanelOpen] = useState(true);
  const [bottomPanelOpen, setBottomPanelOpen] = useState(true);
  const [bottomTab, setBottomTab] = useState<BottomTab>('problems');

  // --- Tree state ---
  const [tree, setTree] = useState<WorkspaceTreeNode[]>([]);
  const [treeLoading, setTreeLoading] = useState(true);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});

  // --- Open files / editor state ---
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // --- New file UI ---
  const [creatingPath, setCreatingPath] = useState<string | null>(null); // parent folder path, '' for root
  const [newFileName, setNewFileName] = useState('');
  const newFileInputRef = useRef<HTMLInputElement>(null);

  const activeFile = openFiles.find(f => f.path === activePath) ?? null;

  const loadTree = useCallback(async () => {
    setTreeLoading(true);
    setTreeError(null);
        try {
      const nodes = await fetchWorkspaceTree();
      setTree(Array.isArray(nodes) ? nodes : []);
    } catch (err) {
      if (err instanceof ApiError) {
        setTreeError(err.message);
      } else {
        setTreeError('Failed to load workspace files.');
      }
    } finally {
      setTreeLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTree();
  }, [loadTree]);

  useEffect(() => {
    if (creatingPath !== null) {
      newFileInputRef.current?.focus();
    }
  }, [creatingPath]);

  const toggleFolder = (path: string) => {
    setOpenFolders(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const openFile = async (path: string) => {
    setActivePath(path);
    setFileError(null);

    const existing = openFiles.find(f => f.path === path);
    if (existing) return;

    setFileLoading(true);
    try {
      const result = await fetchWorkspaceFile(path);
      setOpenFiles(prev => [
        ...prev,
        { path, content: result.content, savedContent: result.content },
      ]);
    } catch (err) {
      setFileError(err instanceof ApiError ? err.message : 'Failed to open file.');
    } finally {
      setFileLoading(false);
    }
  };

  const closeFile = (path: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const file = openFiles.find(f => f.path === path);
    if (file && isDirty(file)) {
      const ok = window.confirm(`${path} has unsaved changes. Close without saving?`);
      if (!ok) return;
    }
    setOpenFiles(prev => prev.filter(f => f.path !== path));
    if (activePath === path) {
      const remaining = openFiles.filter(f => f.path !== path);
      setActivePath(remaining.length > 0 ? remaining[remaining.length - 1].path : null);
    }
  };

  const updateContent = (path: string, content: string) => {
    setOpenFiles(prev => prev.map(f => (f.path === path ? { ...f, content } : f)));
  };

  const saveFile = useCallback(async (path: string) => {
    const file = openFiles.find(f => f.path === path);
    if (!file) return;
    setSaving(true);
    setFileError(null);
    try {
      await saveWorkspaceFile(path, file.content);
      setOpenFiles(prev =>
        prev.map(f => (f.path === path ? { ...f, savedContent: f.content } : f))
      );
      setStatusMessage(`Saved ${path}`);
      setTimeout(() => setStatusMessage(null), 2500);
      // A save can create a brand-new file; refresh the tree so it shows up.
      void loadTree();
    } catch (err) {
      setFileError(err instanceof ApiError ? err.message : 'Failed to save file.');
    } finally {
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openFiles, loadTree]);

  // Ctrl/Cmd+S saves the active file.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (activePath) void saveFile(activePath);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activePath, saveFile]);

  const startCreateFile = (parentPath: string) => {
    setCreatingPath(parentPath);
    setNewFileName('');
  };

  const confirmCreateFile = async () => {
    if (!creatingPath && creatingPath !== '') return;
    const trimmed = newFileName.trim();
    if (!trimmed) {
      setCreatingPath(null);
      return;
    }
    const fullPath = creatingPath ? `${creatingPath}/${trimmed}` : trimmed;
    setCreatingPath(null);

    setSaving(true);
    setFileError(null);
    try {
      await saveWorkspaceFile(fullPath, '');
      setOpenFiles(prev => [...prev, { path: fullPath, content: '', savedContent: '' }]);
      setActivePath(fullPath);
      await loadTree();
    } catch (err) {
      setFileError(err instanceof ApiError ? err.message : 'Failed to create file.');
    } finally {
      setSaving(false);
    }
  };

  const renderTree = (nodes: WorkspaceTreeNode[], depth = 0) => {
    return nodes.map(node => {
      if (node.type === 'folder') {
        const isOpen = openFolders[node.path] ?? depth === 0;
        return (
          <div key={node.path}>
            <div
              className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#2A2D2E] cursor-pointer group"
              style={{ paddingLeft: `${8 + depth * 14}px` }}
              onClick={() => toggleFolder(node.path)}
            >
              {isOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-[#858585] shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-[#858585] shrink-0" />
              )}
              <Folder className="w-3.5 h-3.5 text-[#DCB67A] shrink-0" />
              <span className="truncate">{node.name}</span>
              <button
                onClick={e => {
                  e.stopPropagation();
                  setOpenFolders(prev => ({ ...prev, [node.path]: true }));
                  startCreateFile(node.path);
                }}
                className="ml-auto opacity-0 group-hover:opacity-100 hover:text-white text-[#858585] p-0.5"
                title="New file in this folder"
              >
                <FilePlus className="w-3 h-3" />
              </button>
            </div>
            {isOpen && node.children && renderTree(node.children, depth + 1)}
            {isOpen && creatingPath === node.path && (
              <div
                className="flex items-center gap-1.5 px-2 py-1"
                style={{ paddingLeft: `${8 + (depth + 1) * 14}px` }}
              >
                <FileIcon className="w-3.5 h-3.5 text-[#9CDCFE] shrink-0" />
                <input
                  ref={newFileInputRef}
                  value={newFileName}
                  onChange={e => setNewFileName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') void confirmCreateFile();
                    if (e.key === 'Escape') setCreatingPath(null);
                  }}
                  onBlur={() => void confirmCreateFile()}
                  placeholder="filename.ext"
                  className="flex-1 bg-[#3C3C3C] text-white text-xs px-1 py-0.5 rounded outline-none border border-[#007ACC]"
                />
              </div>
            )}
          </div>
        );
      }

      const isActive = activePath === node.path;
      const openFile_ = openFiles.find(f => f.path === node.path);
      return (
        <div
          key={node.path}
          onClick={() => void openFile(node.path)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer ${
            isActive ? 'bg-[#37373D] text-white' : 'hover:bg-[#2A2D2E]'
          }`}
          style={{ paddingLeft: `${8 + depth * 14 + 18}px` }}
        >
          <FileCode className={`w-3.5 h-3.5 shrink-0 ${fileIconColor(node.name)}`} />
          <span className="truncate">{node.name}</span>
          {openFile_ && isDirty(openFile_) && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white shrink-0" />
          )}
        </div>
      );
    });
  };

  const openProblemFile = (path: string) => {
    setActivityView('explorer');
    void openFile(path);
  };

  const openProblems = bugs.filter(b => b.status === 'Open' || b.status === 'In Review' || b.status === 'AI Suggested');

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#1E1E1E] text-[#CCCCCC] font-sans select-none">
      <div className="flex-1 flex overflow-hidden">
        {/* ACTIVITY BAR */}
        <div className="w-11 bg-[#333333] border-r border-[#191919] flex flex-col items-center justify-between py-2 shrink-0">
          <div className="flex flex-col items-center gap-1">
            {([
              { id: 'explorer' as const, icon: Files, title: 'Explorer' },
              { id: 'search' as const, icon: Search, title: 'Search' },
              { id: 'git' as const, icon: GitBranch, title: 'Source Control' },
              { id: 'extensions' as const, icon: Package, title: 'Extensions' },
            ]).map(({ id, icon: Icon, title }) => (
              <button
                key={id}
                onClick={() => setActivityView(prev => (prev === id ? 'none' : id))}
                title={title}
                className={`relative w-11 h-9 flex items-center justify-center ${
                  activityView === id ? 'text-white' : 'text-[#858585] hover:text-white'
                }`}
              >
                {activityView === id && (
                  <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-white rounded-full" />
                )}
                <Icon className="w-5 h-5" />
                {id === 'git' && openProblems.length > 0 && (
                  <span className="absolute -bottom-0.5 -right-0.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-[#007ACC] text-white text-[8px] flex items-center justify-center font-semibold">
                    {openProblems.length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => setAgentPanelOpen(o => !o)}
              title="Toggle Agent"
              className={`w-11 h-9 flex items-center justify-center ${agentPanelOpen ? 'text-white' : 'text-[#858585] hover:text-white'}`}
            >
              <Sparkles className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SIDEBAR: EXPLORER / SEARCH / GIT / EXTENSIONS */}
        {activityView === 'explorer' && (
          <div className="w-64 bg-[#252526] border-r border-[#191919] flex flex-col shrink-0 text-xs text-[#CCCCCC]">
          <div className="px-3 py-2.5 flex items-center justify-between text-[11px] font-bold tracking-wider uppercase text-[#BBBBBB] border-b border-[#333333]">
            <span>Explorer</span>
            <div className="flex items-center gap-1 text-[#858585]">
              <button
                onClick={() => startCreateFile('')}
                className="hover:text-white p-1"
                title="New file at workspace root"
              >
                <FilePlus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => void loadTree()}
                className="hover:text-white p-1"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${treeLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setActivityView('none')}
                className="hover:text-white p-1"
                title="Minimize Explorer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-1">
            {treeLoading && tree.length === 0 && (
              <div className="flex items-center gap-2 px-3 py-3 text-[#858585]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Loading workspace...</span>
              </div>
            )}

            {treeError && (
              <div className="mx-2 my-2 p-2 rounded bg-[#4B1113]/30 border border-[#F48771]/40 text-[#F48771] text-[11px] space-y-1.5">
                <div className="flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{treeError}</span>
                </div>
                <button
                  onClick={() => void loadTree()}
                  className="text-[#CCCCCC] underline hover:text-white"
                >
                  Retry
                </button>
              </div>
            )}

            {!treeLoading && !treeError && tree.length === 0 && creatingPath === null && (
              <div className="px-3 py-3 text-[#858585] space-y-2">
                <FolderPlus className="w-5 h-5" />
                <p>This workspace is empty.</p>
                <button
                  onClick={() => startCreateFile('')}
                  className="text-[#4FC1FF] hover:underline"
                >
                  Create your first file
                </button>
              </div>
            )}

            {creatingPath === '' && (
              <div className="flex items-center gap-1.5 px-2 py-1">
                <FileIcon className="w-3.5 h-3.5 text-[#9CDCFE] shrink-0" />
                <input
                  ref={newFileInputRef}
                  value={newFileName}
                  onChange={e => setNewFileName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') void confirmCreateFile();
                    if (e.key === 'Escape') setCreatingPath(null);
                  }}
                  onBlur={() => void confirmCreateFile()}
                  placeholder="filename.ext"
                  className="flex-1 bg-[#3C3C3C] text-white text-xs px-1 py-0.5 rounded outline-none border border-[#007ACC]"
                />
              </div>
            )}

            {renderTree(tree)}
          </div>
          </div>
        )}

        {activityView === 'search' && (
          <div className="w-64 bg-[#252526] border-r border-[#191919] shrink-0 flex flex-col text-xs">
            <div className="px-3 py-2.5 text-[11px] font-bold tracking-wider uppercase text-[#BBBBBB] border-b border-[#333333]">
              Search
            </div>
            <div className="p-3 text-[#858585] leading-relaxed">
              In-workspace search isn't wired up yet — it needs a search endpoint on the backend. Not built yet.
            </div>
          </div>
        )}

        {activityView === 'git' && (
          <div className="w-64 bg-[#252526] border-r border-[#191919] shrink-0 flex flex-col text-xs">
            <div className="px-3 py-2.5 text-[11px] font-bold tracking-wider uppercase text-[#BBBBBB] border-b border-[#333333]">
              Source Control
            </div>
            <div className="p-3 text-[#858585] leading-relaxed">
              There's a git.service.ts on the backend for repo integrations, but it isn't exposed as a diffable source-control panel here yet. Not built yet.
            </div>
          </div>
        )}

        {activityView === 'extensions' && (
          <div className="w-64 bg-[#252526] border-r border-[#191919] shrink-0 flex flex-col text-xs">
            <div className="px-3 py-2.5 text-[11px] font-bold tracking-wider uppercase text-[#BBBBBB] border-b border-[#333333]">
              Extensions
            </div>
            <div className="p-3 text-[#858585] leading-relaxed">
              No extension system exists in this app — this is just a placeholder tab to match the IDE layout.
            </div>
          </div>
        )}

        {/* MAIN EDITOR + BOTTOM PANEL (stacked vertically) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#1E1E1E] min-w-0">
          <div className="flex-1 flex flex-col overflow-hidden bg-[#1E1E1E] min-w-0 min-h-0">
          {/* Tabs */}
          <div className="flex items-center justify-between bg-[#252526] border-b border-[#191919] overflow-x-auto text-xs shrink-0">
            <div className="flex items-center overflow-x-auto"></div>
            <div className="flex items-center overflow-x-auto">
              {openFiles.map(file => {
                const active = activePath === file.path;
                const dirty = isDirty(file);
                const name = file.path.split('/').pop() ?? file.path;
                return (
                  <div
                    key={file.path}
                    onClick={() => setActivePath(file.path)}
                    className={`flex items-center gap-2 px-3 py-2 border-r border-[#191919] cursor-pointer transition-colors ${
                      active
                        ? 'bg-[#1E1E1E] text-white border-t-2 border-t-[#007ACC]'
                        : 'bg-[#2D2D2D] text-[#969696] hover:bg-[#2A2A2A] hover:text-[#CCCCCC]'
                    }`}
                    title={file.path}
                  >
                    <FileCode className={`w-3.5 h-3.5 ${fileIconColor(name)}`} />
                    <span className="font-mono text-xs">{name}</span>
                    {dirty && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    <button
                      onClick={e => closeFile(file.path, e)}
                      className="hover:bg-[#3C3C3C] p-0.5 rounded text-[#858585] hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {activeFile && (
              <div className="flex items-center gap-2 px-3 shrink-0 text-[#858585]">
                {statusMessage && (
                  <span className="text-[11px] text-[#4EC9B0]">{statusMessage}</span>
                )}
                <button
                  onClick={() => void saveFile(activeFile.path)}
                  disabled={saving || !isDirty(activeFile)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                    isDirty(activeFile)
                      ? 'bg-[#007ACC] hover:bg-[#0062A3] text-white'
                      : 'bg-[#3C3C3C] text-[#858585] cursor-default'
                  }`}
                  title="Save (Ctrl+S)"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Save</span>
                </button>
              </div>
            )}
          </div>

          {/* Breadcrumb */}
          {activeFile && (
            <div className="flex items-center gap-1.5 px-4 py-1 bg-[#1E1E1E] border-b border-[#2D2D2D] text-[11px] text-[#858585] font-mono shrink-0">
              {activeFile.path.split('/').map((part, i, arr) => (
                <React.Fragment key={i}>
                  {i > 0 && <ChevronRight className="w-3 h-3" />}
                  <span className={i === arr.length - 1 ? 'text-[#CCCCCC] font-semibold' : ''}>
                    {part}
                  </span>
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Editor body */}
          <div className="flex-1 overflow-auto bg-[#1E1E1E] relative">
            {!activeFile && !fileLoading && (
              <div className="h-full flex flex-col items-center justify-center text-[#5A5A5A] gap-2">
                <FileCode className="w-10 h-10" />
                <p className="text-sm">Select a file from the explorer to start editing</p>
              </div>
            )}

            {fileLoading && (
              <div className="h-full flex items-center justify-center text-[#858585] gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading file...</span>
              </div>
            )}

            {fileError && (
              <div className="m-4 p-3 rounded bg-[#4B1113]/30 border border-[#F48771]/40 text-[#F48771] text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{fileError}</span>
              </div>
            )}

            {activeFile && !fileLoading && (
              <textarea
                key={activeFile.path}
                value={activeFile.content}
                onChange={e => updateContent(activeFile.path, e.target.value)}
                spellCheck={false}
                className="w-full h-full min-h-full resize-none bg-[#1E1E1E] text-[#D4D4D4] font-mono text-sm p-4 outline-none leading-6"
                style={{ tabSize: 2 }}
              />
            )}
          </div>
          </div>

        {bottomPanelOpen && (
          <div className="h-44 shrink-0 bg-[#1E1E1E] border-t border-[#2D2D2D] flex flex-col text-xs">
            <div className="flex items-center justify-between border-b border-[#2D2D2D] px-2 shrink-0">
              <div className="flex items-center">
                {([
                  { id: 'problems' as const, label: `Problems${openProblems.length ? ` (${openProblems.length})` : ''}` },
                  { id: 'output' as const, label: 'Output' },
                  { id: 'terminal' as const, label: 'Terminal' },
                ]).map(t => (
                  <button
                    key={t.id}
                    onClick={() => setBottomTab(t.id)}
                    className={`px-3 py-1.5 border-b-2 transition-colors ${
                      bottomTab === t.id
                        ? 'border-[#007ACC] text-white'
                        : 'border-transparent text-[#858585] hover:text-[#CCCCCC]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setBottomPanelOpen(false)}
                className="p-1 text-[#858585] hover:text-white"
                title="Close panel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5">
              {bottomTab === 'problems' && (
                openProblems.length === 0 ? (
                  <p className="text-[#858585]">No problems have been detected in the workspace.</p>
                ) : (
                  <div className="space-y-1">
                    {openProblems.map(bug => (
                      <button
                        key={bug.id}
                        onClick={() => bug.filePath && openProblemFile(bug.filePath)}
                        disabled={!bug.filePath}
                        className="w-full flex items-center gap-2 px-1.5 py-1 rounded hover:bg-[#2A2D2E] text-left disabled:cursor-default disabled:hover:bg-transparent"
                      >
                        {bug.severity === 'Critical' || bug.severity === 'High' ? (
                          <AlertCircle className="w-3.5 h-3.5 text-[#F48771] shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-[#CCA700] shrink-0" />
                        )}
                        <span className="text-[#CCCCCC]">{bug.title}</span>
                        {bug.filePath && (
                          <span className="text-[#858585] font-mono text-[11px]">
                            {bug.filePath}{bug.lineNumber ? `:${bug.lineNumber}` : ''}
                          </span>
                        )}
                        <span className="ml-auto text-[10px] uppercase tracking-wide text-[#6A6A6A]">{bug.status}</span>
                      </button>
                    ))}
                  </div>
                )
              )}

              {bottomTab === 'output' && (
                <p className="text-[#858585]">
                  Output streaming isn't wired into this panel yet — the live pipeline logs currently show on the Dashboard tab. Not built yet.
                </p>
              )}

              {bottomTab === 'terminal' && (
                <p className="text-[#858585]">
                  There's no real terminal/shell backend wired up here yet — this is a placeholder to match the IDE layout. Not built yet.
                </p>
              )}
            </div>
          </div>
        )}

        {!bottomPanelOpen && (
          <button
            onClick={() => setBottomPanelOpen(true)}
            className="h-6 shrink-0 bg-[#1E1E1E] border-t border-[#2D2D2D] flex items-center gap-1.5 px-3 text-[10px] text-[#858585] hover:text-white"
          >
            <PanelBottom className="w-3 h-3" />
            {openProblems.length > 0 ? `${openProblems.length} problem(s)` : 'Problems / Output / Terminal'}
          </button>
        )}
        </div>

                {agentPanelOpen && (
          <AgentPanel
            projectId={projectId}
            activeModel={activeModel}
            onCollapse={() => setAgentPanelOpen(false)}
            onFileWritten={(path) => {
              // Refresh the file if it's currently open, and always refresh the tree
              // (the fix may have created or touched files).
              setOpenFiles(prev => prev.map(f => (f.path === path ? { ...f } : f)));
              void loadTree();
              if (openFiles.some(f => f.path === path)) {
                void fetchWorkspaceFile(path).then(result => {
                  setOpenFiles(prev => prev.map(f => (f.path === path ? { path, content: result.content, savedContent: result.content } : f)));
                });
              }
            }}
          />
        )}

        {!agentPanelOpen && (
          <button
            onClick={() => setAgentPanelOpen(true)}
            className="w-6 shrink-0 bg-[#181818] border-l border-[#2D2D2D] flex flex-col items-center justify-center gap-2 text-[#858585] hover:text-white"
            title="Expand Agent panel"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* STATUS BAR */}
      <footer className="h-6 bg-[#007ACC] flex items-center justify-between px-3 text-[11px] text-white shrink-0 select-none font-sans z-30">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            {activeFile ? (
              isDirty(activeFile) ? (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  Unsaved changes
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Saved
                </span>
              )
            ) : (
              'No file open'
            )}
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <button
            onClick={onOpenModelSelector}
            className="flex items-center gap-1.5 hover:bg-[#0062A3] px-2 py-0.5 rounded transition-colors cursor-pointer"
            title="Click to change active AI model"
          >
            <span>AI Model: {activeModel}</span>
          </button>
          <span className="hidden sm:inline">UTF-8</span>
        </div>
      </footer>
    </div>
  );
};