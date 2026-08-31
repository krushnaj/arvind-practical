import React from 'react';
import { X, Filter, RotateCcw, Calendar, AlertCircle } from 'lucide-react';
import { InspectionFilterParams } from '../types';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: InspectionFilterParams;
  onApplyFilters: (newFilters: InspectionFilterParams) => void;
  onResetFilters: () => void;
}

const DEFECT_TYPES = [
  'All',
  'Weave Defect',
  'Shade Variation',
  'Hole/Tear',
  'Count Deviation',
  'Other',
];

const SEVERITIES = ['all', 'Critical', 'Major', 'Minor'];
const STATUSES = ['all', 'Open', 'Resolved'];

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  onResetFilters,
}) => {
  const [localFilters, setLocalFilters] = React.useState<InspectionFilterParams>(filters);

  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters, isOpen]);

  if (!isOpen) return null;

  const setDatePreset = (preset: string) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (preset === 'today') {
      setLocalFilters(prev => ({ ...prev, start_date: todayStr, end_date: todayStr }));
    } else if (preset === 'yesterday') {
      const y = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setLocalFilters(prev => ({ ...prev, start_date: y, end_date: y }));
    } else if (preset === 'week') {
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setLocalFilters(prev => ({ ...prev, start_date: lastWeek, end_date: todayStr }));
    } else if (preset === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      setLocalFilters(prev => ({ ...prev, start_date: monthStart, end_date: todayStr }));
    } else if (preset === 'all') {
      setLocalFilters(prev => ({ ...prev, start_date: undefined, end_date: undefined }));
    }
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    onResetFilters();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-arvind-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-amber-400" />
            <h2 className="font-extrabold text-sm sm:text-base">Filter & Sort Inspections</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-arvind-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs sm:text-sm">
          {/* 1. Status Filter */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[11px] tracking-wider">
              Status
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {STATUSES.map(s => {
                const isSelected = (localFilters.status || 'all').toLowerCase() === s.toLowerCase();
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setLocalFilters(prev => ({ ...prev, status: s === 'all' ? undefined : s }))}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all text-xs touch-press ${
                      isSelected
                        ? 'bg-arvind-900 text-white border-arvind-900 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {s === 'all' ? 'All Status' : s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Severity Filter */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[11px] tracking-wider">
              Severity
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {SEVERITIES.map(sev => {
                const isSelected = (localFilters.severity || 'all').toLowerCase() === sev.toLowerCase();
                return (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setLocalFilters(prev => ({ ...prev, severity: sev === 'all' ? undefined : sev }))}
                    className={`py-2 px-2 rounded-xl font-bold border transition-all text-xs touch-press text-center ${
                      isSelected
                        ? 'bg-arvind-900 text-white border-arvind-900 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {sev === 'all' ? 'All' : sev}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Defect Type */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[11px] tracking-wider">
              Defect Type
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DEFECT_TYPES.map(dtype => {
                const isSelected = dtype === 'All' 
                  ? !localFilters.defect_type || localFilters.defect_type === 'all'
                  : localFilters.defect_type === dtype;
                return (
                  <button
                    key={dtype}
                    type="button"
                    onClick={() => setLocalFilters(prev => ({ ...prev, defect_type: dtype === 'All' ? undefined : dtype }))}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-colors ${
                      isSelected
                        ? 'bg-arvind-700 text-white border-arvind-700'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {dtype}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Date Range Quick Presets & Custom Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-bold text-slate-700 uppercase text-[11px] tracking-wider">
                Date Range Filter
              </label>
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <div className="flex flex-wrap gap-1.5 mb-2">
              <button
                type="button"
                onClick={() => setDatePreset('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                  !localFilters.start_date && !localFilters.end_date
                    ? 'bg-arvind-100 text-arvind-900 border-arvind-300 font-bold'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                All Time
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('today')}
                className="px-2.5 py-1 rounded-md text-xs font-medium border bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('yesterday')}
                className="px-2.5 py-1 rounded-md text-xs font-medium border bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('week')}
                className="px-2.5 py-1 rounded-md text-xs font-medium border bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('month')}
                className="px-2.5 py-1 rounded-md text-xs font-medium border bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
              >
                This Month
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-500 font-semibold mb-0.5 block">From Date</span>
                <input
                  type="date"
                  value={localFilters.start_date || ''}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, start_date: e.target.value || undefined }))}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-arvind-500 bg-white"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold mb-0.5 block">To Date</span>
                <input
                  type="date"
                  value={localFilters.end_date || ''}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, end_date: e.target.value || undefined }))}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-arvind-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* 5. Sort Ordering */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[11px] tracking-wider">
              Sort By
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={localFilters.sort_by || 'date'}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, sort_by: e.target.value as any }))}
                className="text-xs p-2.5 border border-slate-300 rounded-lg outline-none bg-white font-semibold"
              >
                <option value="date">Date & Time</option>
                <option value="severity">Severity (Critical First)</option>
                <option value="machine_id">Machine ID</option>
                <option value="status">Status</option>
              </select>

              <select
                value={localFilters.sort_order || 'desc'}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, sort_order: e.target.value as any }))}
                className="text-xs p-2.5 border border-slate-300 rounded-lg outline-none bg-white font-semibold"
              >
                <option value="desc">Descending (Newest / High)</option>
                <option value="asc">Ascending (Oldest / Low)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 rounded-xl bg-arvind-900 hover:bg-arvind-800 text-white text-xs font-bold shadow-md transition-all touch-press"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

