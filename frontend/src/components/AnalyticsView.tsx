import React, { useEffect, useState } from "react";
import {
  BarChart3,
  Clock,
  Cpu,
  CheckCircle2,
  Zap,
  Activity,
  Loader2,
  AlertCircle,
} from "lucide-react";
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
  Cell,
} from "recharts";
import { AnalyticsResponse, fetchAnalytics } from "../api/analytics";
import { ApiError } from "../api/client";

interface AnalyticsViewProps {
  projectId: string | null;
}

const SLICE_COLORS = ["#6366f1", "#06b6d4", "#f59e0b", "#10b981", "#f43f5e", "#a855f7", "#ec4899", "#84cc16"];

function formatMttr(minutes: number): string {
  if (minutes < 60) {
    return minutes + " mins";
  }
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem ? hours + "h " + rem + "m" : hours + "h";
}

function formatCost(costTracked: boolean, cost: number | null): string {
  if (!costTracked) {
    return "Not tracked";
  }
  const value = cost === null ? 0 : cost;
  return "$" + value.toFixed(2);
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ projectId }) => {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAnalytics(projectId)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load analytics.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const rootCauseSlices = data
    ? Object.entries(data.rootCauses)
        .sort((a, b) => b[1] - a[1])
        .map((entry, i) => ({ name: entry[0], value: entry[1], color: SLICE_COLORS[i % SLICE_COLORS.length] }))
    : [];
  const rootCauseTotal = rootCauseSlices.reduce((s, c) => s + c.value, 0);
  const hasRootCauses = rootCauseTotal > 0;
  const pieData = hasRootCauses ? rootCauseSlices : [{ name: "No data yet", value: 1, color: "#30363D" }];

  const hasTrend = !!data && data.mttrTrend.length > 0;
  const trendData = hasTrend
    ? data!.mttrTrend
    : Array.from({ length: 5 }, (_, i) => {
        const weeksAgo = 4 - i;
        const d = new Date();
        d.setDate(d.getDate() - weeksAgo * 7);
        return { week: "Wk " + (d.getMonth() + 1) + "/" + d.getDate(), avgResolutionHours: 0, resolvedCount: 0 };
      });

  return (
    <div id="analytics-view" className="flex-1 overflow-y-auto bg-[#0B0E14] p-6 lg:p-8 space-y-6 text-[#E2E8F0]">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white shadow-md">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
              Engineering Diagnostics and Analytics
            </h1>
            <p className="text-xs text-gray-400">
              AI repair velocity, MTTR reductions, and defect trends, computed from this project's real bugs and fixes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#0D1117] border border-[#30363D] text-xs font-semibold text-gray-300">
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
          ) : (
            <Activity className="w-3.5 h-3.5 text-green-400" />
          )}
          <span>{loading ? "Loading" : "Live from backend"}</span>
        </div>
      </div>

      {!projectId && (
        <div className="rounded-lg bg-[#0D1117] border border-[#30363D] p-6 text-sm text-gray-400">
          No project loaded yet. Analytics need a project to compute against.
        </div>
      )}

      {projectId && error && (
        <div className="rounded-lg bg-[#2A1215] border border-red-500/30 p-4 flex items-start gap-2 text-sm text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {projectId && !error && (loading || data) && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg bg-[#0D1117] border border-[#30363D] p-4 space-y-1 shadow-sm">
              <div className="flex items-center justify-between text-indigo-400">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-white">
                {loading ? "-" : formatMttr(data!.mttrMinutes)}
              </div>
              <div className="text-xs text-gray-400 font-medium">Mean Time to Repair (MTTR)</div>
            </div>

            <div className="rounded-lg bg-[#0D1117] border border-[#30363D] p-4 space-y-1 shadow-sm">
              <div className="flex items-center justify-between text-indigo-400">
                <Zap className="w-4 h-4" />
                {!loading && (
                  <span className="text-[11px] font-bold text-indigo-400">{data!.bugsDetected} detected</span>
                )}
              </div>
              <div className="text-2xl font-bold text-white">{loading ? "-" : data!.aiRepairedBugs + " Bugs"}</div>
              <div className="text-xs text-gray-400 font-medium">Auto-Repaired by AI</div>
            </div>

            <div className="rounded-lg bg-[#0D1117] border border-[#30363D] p-4 space-y-1 shadow-sm">
              <div className="flex items-center justify-between text-green-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-green-400">{loading ? "-" : data!.testPassRate + "%"}</div>
              <div className="text-xs text-gray-400 font-medium">Docker Test Pass Rate</div>
            </div>

            <div className="rounded-lg bg-[#0D1117] border border-[#30363D] p-4 space-y-1 shadow-sm">
              <div className="flex items-center justify-between text-amber-400">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-white">
                {loading ? "-" : formatCost(data!.costTracked, data!.aiComputeCost)}
              </div>
              <div className="text-xs text-gray-400 font-medium">Est. AI Compute Cost</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <div className="lg:col-span-2 rounded-lg bg-[#0D1117] border border-[#30363D] p-5 space-y-4 shadow-sm">
              <div>
                <h2 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Resolution Time Trend</h2>
                <p className="text-[11px] text-gray-400">
                  Average hours from bug logged to fixed or closed, per week. No manual-triage baseline is tracked in this system, so only the real AI-assisted trend is shown.
                </p>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262D" vertical={false} />
                    <XAxis dataKey="week" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit="h" domain={hasTrend ? undefined : [0, 4]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#161B22", borderColor: "#30363D", borderRadius: "8px", fontSize: "12px" }}
                      itemStyle={{ color: "#e2e8f0" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="avgResolutionHours"
                      name="Avg resolution (h)"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#aiGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {!hasTrend && !loading && (
                <p className="text-[11px] text-gray-500 -mt-2">
                  Sitting at 0h. No bugs marked Fixed or Closed yet. This line will move as real fixes land.
                </p>
              )}
            </div>

            <div className="rounded-lg bg-[#0D1117] border border-[#30363D] p-5 space-y-4 flex flex-col justify-between shadow-sm">
              <div>
                <h2 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Root Cause Distribution</h2>
                <p className="text-[11px] text-gray-400">By component, across all bugs logged in this project</p>
              </div>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={hasRootCauses ? 4 : 0}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={"cell-" + index} fill={entry.color} />
                      ))}
                    </Pie>
                    {hasRootCauses && (
                      <Tooltip
                        contentStyle={{ backgroundColor: "#161B22", borderColor: "#30363D", borderRadius: "8px", fontSize: "12px" }}
                      />
                    )}
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 text-xs">
                {hasRootCauses ? (
                  rootCauseSlices.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-gray-300 truncate">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="truncate">{cat.name}</span>
                      </span>
                      <span className="font-semibold text-gray-400 shrink-0">
                        {Math.round((cat.value / rootCauseTotal) * 100)}%
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">{loading ? "Loading" : "No bugs logged yet. This fills in as bugs are found."}</p>
                )}
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
};