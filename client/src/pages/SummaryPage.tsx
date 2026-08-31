import React, { useState, useEffect } from 'react';
import { SummaryMatrix } from '../components/SummaryMatrix';
import { SummaryMatrixData } from '../types';
import { api } from '../api/client';
import { RefreshCw, Calendar } from 'lucide-react';

export const SummaryPage: React.FC = () => {
  const [data, setData] = useState<SummaryMatrixData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dateRange, setDateRange] = useState<string>('all');

  const loadSummary = async () => {
    setIsLoading(true);
    try {
      let start_date: string | undefined;
      let end_date: string | undefined;

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      if (dateRange === 'today') {
        start_date = todayStr;
        end_date = todayStr;
      } else if (dateRange === 'week') {
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        start_date = lastWeek;
        end_date = todayStr;
      } else if (dateRange === 'month') {
        start_date = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        end_date = todayStr;
      }

      const res = await api.getSummary({
        start_date,
        end_date,
      });
      setData(res);
    } catch (err) {
      console.error('Failed to load summary matrix:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [dateRange]);

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Top Banner */}
      <div className="bg-arvind-900 text-white p-4 rounded-xl shadow-sm border border-arvind-800 flex items-center justify-between">
        <div>
          <h2 className="font-extrabold text-sm sm:text-base">Quality Metrics & Summary</h2>
          <p className="text-xs text-arvind-200">Defect Resolution Performance Matrix</p>
        </div>
        <button
          onClick={loadSummary}
          className="p-2 bg-arvind-800 hover:bg-arvind-700 rounded-lg text-arvind-100 transition-colors"
          title="Refresh Summary"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Date Filter Timeline Selector */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1 text-xs font-semibold text-slate-600">
          <Calendar className="w-3.5 h-3.5 text-arvind-600" />
          <span>Timeline:</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {[
            { id: 'all', label: 'All-Time' },
            { id: 'today', label: 'Today' },
            { id: 'week', label: '7 Days' },
            { id: 'month', label: 'This Month' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDateRange(tab.id)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] ${
                dateRange === tab.id
                  ? 'bg-arvind-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Matrix Component */}
      <SummaryMatrix data={data} isLoading={isLoading} onRefresh={loadSummary} />
    </div>
  );
};
