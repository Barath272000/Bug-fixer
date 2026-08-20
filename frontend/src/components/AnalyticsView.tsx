import React from 'react';
import { 
  BarChart3, 
  Clock, 
  Cpu, 
  CheckCircle2, 
  Zap,
  Activity
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

const mttrData = [
  { week: 'Wk 28', manualHours: 18.5, aiHours: 2.1 },
  { week: 'Wk 29', manualHours: 16.2, aiHours: 1.8 },
  { week: 'Wk 30', manualHours: 19.4, aiHours: 1.4 },
  { week: 'Wk 31', manualHours: 15.0, aiHours: 1.1 },
  { week: 'Wk 32', manualHours: 14.2, aiHours: 0.8 },
];

const categoryDistribution = [
  { name: 'Auth & JWT', value: 35, color: '#6366f1' },
  { name: 'Rate Limiting', value: 25, color: '#06b6d4' },
  { name: 'Memory Leaks', value: 20, color: '#f59e0b' },
  { name: 'DB / SQL', value: 15, color: '#10b981' },
  { name: 'Docker / Infra', value: 5, color: '#f43f5e' },
];

export const AnalyticsView: React.FC = () => {
  return (
    <div id="analytics-view" className="flex-1 overflow-y-auto bg-[#0B0E14] p-6 lg:p-8 space-y-6 text-[#E2E8F0]">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white shadow-md">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
              Engineering Diagnostics & Analytics
            </h1>
            <p className="text-xs text-gray-400">
              AI repair velocity, MTTR reductions, token usage, and defect trends.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#0D1117] border border-[#30363D] text-xs font-semibold text-gray-300">
          <Activity className="w-3.5 h-3.5 text-green-400 animate-pulse" />
          <span>Real-Time Telemetry Active</span>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg bg-[#0D1117] border border-[#30363D] p-4 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-indigo-400">
            <Clock className="w-4 h-4" />
            <span className="text-[11px] font-bold text-green-400">-89%</span>
          </div>
          <div className="text-2xl font-bold text-white">48 mins</div>
          <div className="text-xs text-gray-400 font-medium">Mean Time to Repair (MTTR)</div>
        </div>

        <div className="rounded-lg bg-[#0D1117] border border-[#30363D] p-4 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-indigo-400">
            <Zap className="w-4 h-4" />
            <span className="text-[11px] font-bold text-indigo-400">94.2%</span>
          </div>
          <div className="text-2xl font-bold text-white">92 Bugs</div>
          <div className="text-xs text-gray-400 font-medium">Auto-Repaired by AI</div>
        </div>

        <div className="rounded-lg bg-[#0D1117] border border-[#30363D] p-4 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-green-400">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-[11px] font-bold text-green-400">0 regr.</span>
          </div>
          <div className="text-2xl font-bold text-green-400">100%</div>
          <div className="text-xs text-gray-400 font-medium">Docker Test Pass Rate</div>
        </div>

        <div className="rounded-lg bg-[#0D1117] border border-[#30363D] p-4 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-amber-400">
            <Cpu className="w-4 h-4" />
            <span className="text-[11px] font-bold text-gray-400">42.1k</span>
          </div>
          <div className="text-2xl font-bold text-white">$14.20</div>
          <div className="text-xs text-gray-400 font-medium">Est. AI Compute Cost</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* MTTR Reduction Chart (2 cols) */}
        <div className="lg:col-span-2 rounded-lg bg-[#0D1117] border border-[#30363D] p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Mean Time to Resolution (MTTR in Hours)</h2>
              <p className="text-[11px] text-gray-400">Manual triage vs AI-assisted automated patch delivery</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-gray-400">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-600" /> Manual
              </span>
              <span className="flex items-center gap-1.5 text-indigo-400">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> BugFixAI
              </span>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mttrData}>
                <defs>
                  <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262D" vertical={false} />
                <XAxis dataKey="week" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit="h" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#161B22', borderColor: '#30363D', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="manualHours" stroke="#475569" strokeWidth={2} fill="transparent" />
                <Area type="monotone" dataKey="aiHours" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#aiGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bug Category Breakdown (1 col) */}
        <div className="rounded-lg bg-[#0D1117] border border-[#30363D] p-5 space-y-4 flex flex-col justify-between shadow-sm">
          <div>
            <h2 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Root Cause Distribution</h2>
            <p className="text-[11px] text-gray-400">Classification of bugs discovered in codebase</p>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#161B22', borderColor: '#30363D', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs">
            {categoryDistribution.map(cat => (
              <div key={cat.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-gray-300">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span>{cat.name}</span>
                </span>
                <span className="font-semibold text-gray-400">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
