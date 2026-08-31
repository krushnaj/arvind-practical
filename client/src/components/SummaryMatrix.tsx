import React from 'react';
import { 
  AlertOctagon, 
  AlertTriangle, 
  Layers, 
  BarChart, 
  TrendingUp, 
  Sparkles
} from 'lucide-react';
import { SummaryMatrixData } from '../types';

interface SummaryMatrixProps {
  data: SummaryMatrixData | null;
  isLoading: boolean;
  onRefresh?: () => void;
}

export const SummaryMatrix: React.FC<SummaryMatrixProps> = ({
  data,
  isLoading,
}) => {
  if (isLoading || !data) {
    return (
      <div className="space-y-4 animate-pulse p-4">
        <div className="h-24 bg-slate-200 rounded-xl" />
        <div className="h-48 bg-slate-200 rounded-xl" />
        <div className="h-48 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  const { matrix, totals, defectBreakdown } = data;

  return (
    <div className="space-y-4 pb-20">
      {/* 1. Quick KPI Highlight Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Total Logged */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Logged</span>
            <Layers className="w-3.5 h-3.5 text-arvind-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900">{totals.grandTotal}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{totals.todayCount} logged today</div>
        </div>

        {/* Total Open */}
        <div className="bg-white p-3 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50/50 to-white shadow-sm">
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Open Backlog</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-extrabold text-amber-900">{totals.open}</div>
          <div className="text-[10px] text-amber-700 mt-0.5">Require shopfloor action</div>
        </div>

        {/* Critical Open */}
        <div className={`p-3 rounded-xl border shadow-sm transition-all ${
          totals.criticalOpen > 0
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Critical Open</span>
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
          </div>
          <div className="text-xl font-extrabold text-rose-700">{totals.criticalOpen}</div>
          <div className="text-[10px] text-rose-600 mt-0.5">Immediate line stop risk</div>
        </div>

        {/* Resolution Rate */}
        <div className="bg-white p-3 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white shadow-sm">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Resolution Rate</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-extrabold text-emerald-800">{totals.resolutionRate}%</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">{totals.resolved} of {totals.grandTotal} closed</div>
        </div>
      </div>

      {/* 2. Core Matrix Table: Count of Open and Resolved by Severity */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-3.5 bg-arvind-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-xs sm:text-sm tracking-tight">
              Inspection Status Matrix by Severity
            </h3>
          </div>
          <span className="text-[10px] bg-arvind-800 text-arvind-200 px-2 py-0.5 rounded border border-arvind-700">
            Real-time Matrix
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Severity Level</th>
                <th className="py-2.5 px-3 text-center text-amber-700 bg-amber-50/60">Open</th>
                <th className="py-2.5 px-3 text-center text-emerald-700 bg-emerald-50/60">Resolved</th>
                <th className="py-2.5 px-3 text-center">Total</th>
                <th className="py-2.5 px-3 text-right">Fix Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {/* Critical Row */}
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-3 flex items-center gap-1.5 font-bold text-slate-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0" />
                  <span>Critical</span>
                </td>
                <td className="py-3 px-3 text-center font-bold text-rose-700 bg-amber-50/20">
                  {matrix.Critical.open}
                </td>
                <td className="py-3 px-3 text-center font-bold text-emerald-700 bg-emerald-50/20">
                  {matrix.Critical.resolved}
                </td>
                <td className="py-3 px-3 text-center font-bold text-slate-800">
                  {matrix.Critical.total}
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-600">
                  {matrix.Critical.total > 0
                    ? `${Math.round((matrix.Critical.resolved / matrix.Critical.total) * 100)}%`
                    : '—'}
                </td>
              </tr>

              {/* Major Row */}
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-3 flex items-center gap-1.5 font-bold text-slate-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span>Major</span>
                </td>
                <td className="py-3 px-3 text-center font-bold text-amber-700 bg-amber-50/20">
                  {matrix.Major.open}
                </td>
                <td className="py-3 px-3 text-center font-bold text-emerald-700 bg-emerald-50/20">
                  {matrix.Major.resolved}
                </td>
                <td className="py-3 px-3 text-center font-bold text-slate-800">
                  {matrix.Major.total}
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-600">
                  {matrix.Major.total > 0
                    ? `${Math.round((matrix.Major.resolved / matrix.Major.total) * 100)}%`
                    : '—'}
                </td>
              </tr>

              {/* Minor Row */}
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-3 flex items-center gap-1.5 font-bold text-slate-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
                  <span>Minor</span>
                </td>
                <td className="py-3 px-3 text-center font-bold text-slate-700 bg-amber-50/20">
                  {matrix.Minor.open}
                </td>
                <td className="py-3 px-3 text-center font-bold text-emerald-700 bg-emerald-50/20">
                  {matrix.Minor.resolved}
                </td>
                <td className="py-3 px-3 text-center font-bold text-slate-800">
                  {matrix.Minor.total}
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-600">
                  {matrix.Minor.total > 0
                    ? `${Math.round((matrix.Minor.resolved / matrix.Minor.total) * 100)}%`
                    : '—'}
                </td>
              </tr>

              {/* Total Summary Footer Row */}
              <tr className="bg-slate-100/80 font-black text-slate-900 border-t-2 border-slate-200">
                <td className="py-3 px-3 uppercase text-[11px] tracking-wider text-arvind-900">
                  Total Inspections
                </td>
                <td className="py-3 px-3 text-center text-amber-800 bg-amber-100/50">
                  {totals.open}
                </td>
                <td className="py-3 px-3 text-center text-emerald-800 bg-emerald-100/50">
                  {totals.resolved}
                </td>
                <td className="py-3 px-3 text-center text-arvind-900">
                  {totals.grandTotal}
                </td>
                <td className="py-3 px-3 text-right font-mono text-emerald-700">
                  {totals.resolutionRate}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Defect Category Distribution */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-arvind-600" />
            <span>Defect Category Distribution</span>
          </h3>
          <span className="text-[11px] text-slate-500 font-semibold">{defectBreakdown.length} Categories</span>
        </div>

        <div className="space-y-2.5">
          {defectBreakdown.map((item) => {
            const pct = totals.grandTotal > 0 ? Math.round((item.count / totals.grandTotal) * 100) : 0;
            return (
              <div key={item.defect_type} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>{item.defect_type}</span>
                  <span className="text-slate-500">{item.count} defects ({pct}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-arvind-600 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
