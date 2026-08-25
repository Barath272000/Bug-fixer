import React, { useState } from 'react';
import { 
  History, 
  Zap, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  ArrowUpDown, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell, 
  CartesianGrid 
} from 'recharts';
import { initialFixHistory } from '../data/mockData';
import { AIFixHistoryItem } from '../types';

const timelineData = [
  { date: '07-30', generated: 2, applied: 2 },
  { date: '08-01', generated: 1, applied: 1 },
  { date: '08-02', generated: 2, applied: 0 },
  { date: '08-04', generated: 4, applied: 3 },
  { date: '08-05', generated: 2, applied: 2 },
  { date: '08-07', generated: 3, applied: 2 },
  { date: '08-08', generated: 2, applied: 1 },
  { date: '08-10', generated: 2, applied: 1 },
  { date: '08-11', generated: 4, applied: 2 },
  { date: '08-12', generated: 3, applied: 1 },
];

const severityData = [
  { severity: 'Critical', rate: 52, color: '#ef4444' },
  { severity: 'High', rate: 60, color: '#f97316' },
  { severity: 'Medium', rate: 67, color: '#f59e0b' },
  { severity: 'Low', rate: 71, color: '#22c55e' },
];

interface AIFixHistoryViewProps {
  onInspectFix: (item: AIFixHistoryItem) => void;
}

export const AIFixHistoryView: React.FC<AIFixHistoryViewProps> = ({ onInspectFix }) => {
  const totalFixes = historyItems.length;
  const appliedFixes = historyItems.filter(i => i.status === 'Applied').length;
  const avgConfidence = totalFixes > 0
    ? (historyItems.reduce((sum, i) => sum + i.confidence, 0) / totalFixes).toFixed(1)
    : '0';
  const totalMinutesSaved = historyItems.reduce((sum, i) => sum + parseInt(i.estTime, 10), 0);
  const hoursSaved = (totalMinutesSaved / 60).toFixed(1);

  const [searchQuery, setSearchQuery] = useState('');
  const [historyItems] = useState<AIFixHistoryItem[]>(initialFixHistory);

  const filteredItems = historyItems.filter(item => 
    item.bugId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.bugTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.patchSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="ai-fix-history-view" className="flex-1 overflow-y-auto bg-[#0B0E14] p-6 lg:p-8 space-y-6 text-[#E2E8F0]">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center shadow-md">
            <History className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
              AI Fix History & Synthesis Logs
            </h1>
            <p className="text-xs text-gray-400">
              All AI-generated unified patches — acceptance rates, model confidence scores, and AST diffs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400 bg-[#0D1117] border border-[#30363D] px-3 py-1.5 rounded-md font-mono">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span>Last sync: 2026-08-12 10:29</span>
        </div>
      </div>

      {/* 6 Metrics KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="rounded-lg bg-[#0D1117] border border-[#30363D] p-3.5 space-y-1 shadow-sm">
          <div className="text-indigo-400"><Zap className="w-4 h-4" /></div>
          <div className="text-xl font-bold text-white">9</div>
          <div className="text-[10px] text-gray-400 uppercase font-semibold">Suggestions</div>
        </div>

        <div className="rounded-lg bg-[#0D1117] border border-[#30363D] p-3.5 space-y-1 shadow-sm">
          <div className="text-green-400"><TrendingUp className="w-4 h-4" /></div>
          <div className="text-xl font-bold text-white">44%</div>
          <div className="text-[10px] text-green-400 font-semibold">+4% vs last week</div>
        </div>

        <div className="rounded-lg bg-[#0D1117] border border-[#30363D] p-3.5 space-y-1 shadow-sm">
          <div className="text-indigo-400"><CheckCircle2 className="w-4 h-4" /></div>
          <div className="text-xl font-bold text-white">93%</div>
          <div className="text-[10px] text-gray-400 uppercase font-semibold">Avg Confidence</div>
        </div>

        <div className="rounded-lg bg-[#0D1117] border border-[#30363D] p-3.5 space-y-1 shadow-sm">
          <div className="text-green-400"><CheckCircle2 className="w-4 h-4" /></div>
          <div className="text-xl font-bold text-green-400">4</div>
          <div className="text-[10px] text-gray-400 uppercase font-semibold">Applied This Wk</div>
        </div>

        <div className="rounded-lg bg-[#0D1117] border border-[#30363D] p-3.5 space-y-1 shadow-sm">
          <div className="text-red-400"><XCircle className="w-4 h-4" /></div>
          <div className="text-xl font-bold text-white">0</div>
          <div className="text-[10px] text-gray-400 uppercase font-semibold">Rejected</div>
        </div>

        <div className="rounded-lg bg-[#0D1117] border border-[#30363D] p-3.5 space-y-1 shadow-sm">
          <div className="text-amber-400"><Clock className="w-4 h-4" /></div>
          <div className="text-xl font-bold text-amber-400">4</div>
          <div className="text-[10px] text-amber-300 font-semibold">Pending Review</div>
        </div>
      </div>

      {/* 2 Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg bg-[#0D1117] border border-[#30363D] p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
                Suggestions Over Time
              </h2>
              <p className="text-[11px] text-gray-400">Daily AI suggestions generated vs applied</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-indigo-400">
                <span className="w-2 h-2 rounded-full bg-indigo-500" /> Generated
              </span>
              <span className="flex items-center gap-1 text-green-400">
                <span className="w-2 h-2 rounded-full bg-green-500" /> Applied
              </span>
            </div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262D" vertical={false} />
                <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 10 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#161B22', borderColor: '#30363D', borderRadius: '6px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="generated" stroke="#6366f1" strokeWidth={2} fill="#6366f1" fillOpacity={0.2} />
                <Area type="monotone" dataKey="applied" stroke="#22c55e" strokeWidth={2} fill="#22c55e" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg bg-[#0D1117] border border-[#30363D] p-5 space-y-3 shadow-sm">
          <div>
            <h2 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
              Acceptance Rate by Severity
            </h2>
            <p className="text-[11px] text-gray-400">% of AI suggestions accepted per bug severity</p>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262D" vertical={false} />
                <XAxis dataKey="severity" stroke="#6b7280" tick={{ fontSize: 10 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: '#161B22', borderColor: '#30363D', borderRadius: '6px', fontSize: '11px' }} />
                <Bar dataKey="rate" radius={[4, 4, 0, 0]} barSize={32}>
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg bg-[#0D1117] border border-[#30363D] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#30363D] bg-[#161B22] text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">BUG ID</th>
                <th className="py-3 px-4 min-w-[260px]">BUG TITLE</th>
                <th className="py-3 px-4">DATE</th>
                <th className="py-3 px-4">MODEL</th>
                <th className="py-3 px-4">CONFIDENCE</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#21262D]">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-[#161B22] transition-colors">
                  <td className="py-3 px-4 font-mono text-gray-300">{item.bugId}</td>
                  <td className="py-3 px-4">
                    <div 
                      className="font-medium text-gray-100 hover:text-indigo-400 cursor-pointer"
                      onClick={() => onInspectFix(item)}
                    >
                      {item.bugTitle}
                    </div>
                    <div className="text-[11px] text-gray-400">{item.patchSummary}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-gray-500 text-xs">{item.date}</td>
                  <td className="py-3 px-4 font-mono text-indigo-300 text-xs">{item.model}</td>
                  <td className="py-3 px-4 font-mono text-green-400 font-semibold">{item.confidence}%</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      item.status === 'Applied' 
                        ? 'bg-green-500/10 text-green-300 border-green-500/30' 
                        : item.status === 'Ready'
                        ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                        : 'bg-gray-800 text-gray-400 border-gray-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onInspectFix(item)}
                      className="px-2.5 py-1 rounded bg-[#161B22] hover:bg-indigo-600 hover:text-white text-gray-300 border border-[#30363D] transition-colors text-xs"
                    >
                      Inspect Diff
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
