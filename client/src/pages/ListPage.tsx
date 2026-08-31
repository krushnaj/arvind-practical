import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Plus, 
  Layers, 
  AlertOctagon, 
  CheckCircle2, 
  SlidersHorizontal,
  X,
  Calendar,
  Sparkles
} from 'lucide-react';
import { Inspection, InspectionFilterParams } from '../types';
import { InspectionCard } from '../components/InspectionCard';
import { FilterDrawer } from '../components/FilterDrawer';
import { api } from '../api/client';

interface ListPageProps {
  inspections: Inspection[];
  isLoading: boolean;
  filters: InspectionFilterParams;
  onUpdateFilters: (newFilters: InspectionFilterParams) => void;
  onRefresh: () => void;
  onResolveClick: (inspection: Inspection) => void;
  onSelectInspection: (inspection: Inspection) => void;
  onNavigateToLog: () => void;
}

export const ListPage: React.FC<ListPageProps> = ({
  inspections,
  isLoading,
  filters,
  onUpdateFilters,
  onRefresh,
  onResolveClick,
  onSelectInspection,
  onNavigateToLog,
}) => {
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);
  const [searchInput, setSearchInput] = useState<string>(filters.search || '');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateFilters({ ...filters, search: searchInput.trim() || undefined });
  };

  const handleQuickStatus = (status: 'all' | 'Open' | 'Resolved') => {
    onUpdateFilters({
      ...filters,
      status: status === 'all' ? undefined : status,
    });
  };

  const handleQuickSeverity = (sev: 'Critical') => {
    if (filters.severity?.toLowerCase() === 'critical') {
      // Toggle off
      onUpdateFilters({ ...filters, severity: undefined });
    } else {
      onUpdateFilters({ ...filters, severity: 'Critical' });
    }
  };

  const handleClearFilter = (key: keyof InspectionFilterParams) => {
    const updated = { ...filters };
    delete updated[key];
    onUpdateFilters(updated);
    if (key === 'search') setSearchInput('');
  };

  const hasActiveFilters = Boolean(
    filters.status ||
    filters.severity ||
    filters.defect_type ||
    filters.plant ||
    filters.start_date ||
    filters.end_date ||
    filters.search
  );

  const openCount = inspections.filter(i => i.status?.toLowerCase() === 'open').length;
  const criticalCount = inspections.filter(i => i.severity === 'Critical' && i.status?.toLowerCase() === 'open').length;

  return (
    <div className="space-y-3 pb-24 max-w-2xl mx-auto">
      {/* 1. Search Bar & Action Buttons */}
      <div className="flex items-center gap-2">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onBlur={() => onUpdateFilters({ ...filters, search: searchInput.trim() || undefined })}
            placeholder="Search machine, remarks, note..."
            className="w-full pl-9 pr-8 py-2.5 bg-white text-xs sm:text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-arvind-500 font-medium placeholder:text-slate-400 shadow-sm"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                handleClearFilter('search');
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        {/* Filter Drawer Trigger Button */}
        <button
          onClick={() => setIsFilterDrawerOpen(true)}
          className={`p-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all touch-press shrink-0 shadow-sm ${
            hasActiveFilters
              ? 'bg-arvind-900 text-white border-arvind-900'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
          }`}
          title="Open Filter Drawer"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden xs:inline">Filter</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          )}
        </button>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          className="p-2.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors shadow-sm shrink-0"
          title="Refresh List"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-arvind-600' : ''}`} />
        </button>

        {/* CSV Export Button */}
        <a
          href={api.getExportUrl()}
          download
          className="p-2.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors shadow-sm shrink-0 hidden sm:flex"
          title="Export CSV"
        >
          <Download className="w-4 h-4" />
        </a>
      </div>

      {/* 2. Quick Filter Segmented Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
        {/* All */}
        <button
          onClick={() => handleQuickStatus('all')}
          className={`px-3 py-1.5 rounded-full border whitespace-nowrap transition-all touch-press ${
            !filters.status || filters.status === 'all'
              ? 'bg-arvind-900 text-white border-arvind-900 font-bold shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          All ({inspections.length})
        </button>

        {/* Open */}
        <button
          onClick={() => handleQuickStatus('Open')}
          className={`px-3 py-1.5 rounded-full border whitespace-nowrap transition-all touch-press flex items-center gap-1.5 ${
            filters.status?.toLowerCase() === 'open'
              ? 'bg-amber-500 text-arvind-950 border-amber-500 font-bold shadow-sm'
              : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
          <span>Open ({openCount})</span>
        </button>

        {/* Critical Only */}
        <button
          onClick={() => handleQuickSeverity('Critical')}
          className={`px-3 py-1.5 rounded-full border whitespace-nowrap transition-all touch-press flex items-center gap-1.5 ${
            filters.severity?.toLowerCase() === 'critical'
              ? 'bg-rose-600 text-white border-rose-600 font-bold shadow-sm'
              : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
          }`}
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>Critical {criticalCount > 0 && `(${criticalCount})`}</span>
        </button>

        {/* Resolved */}
        <button
          onClick={() => handleQuickStatus('Resolved')}
          className={`px-3 py-1.5 rounded-full border whitespace-nowrap transition-all touch-press flex items-center gap-1.5 ${
            filters.status?.toLowerCase() === 'resolved'
              ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-sm'
              : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Resolved</span>
        </button>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1.5 flex-wrap text-[11px] pt-0.5">
          <span className="text-slate-400 font-medium">Active:</span>

          {filters.severity && (
            <span className="inline-flex items-center gap-1 bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md font-semibold">
              Severity: {filters.severity}
              <button onClick={() => handleClearFilter('severity')}><X className="w-3 h-3" /></button>
            </span>
          )}

          {filters.defect_type && (
            <span className="inline-flex items-center gap-1 bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md font-semibold">
              Defect: {filters.defect_type}
              <button onClick={() => handleClearFilter('defect_type')}><X className="w-3 h-3" /></button>
            </span>
          )}

          {filters.start_date && (
            <span className="inline-flex items-center gap-1 bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md font-semibold">
              From: {filters.start_date}
              <button onClick={() => handleClearFilter('start_date')}><X className="w-3 h-3" /></button>
            </span>
          )}

          {filters.end_date && (
            <span className="inline-flex items-center gap-1 bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md font-semibold">
              To: {filters.end_date}
              <button onClick={() => handleClearFilter('end_date')}><X className="w-3 h-3" /></button>
            </span>
          )}

          <button
            onClick={() => onUpdateFilters({})}
            className="text-rose-600 hover:underline font-semibold ml-auto"
          >
            Clear all
          </button>
        </div>
      )}

      {/* 3. Inspections Feed List */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse pt-2">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-28 bg-white border border-slate-200 rounded-xl" />
          ))}
        </div>
      ) : inspections.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 mt-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">No Inspections Found</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
              {hasActiveFilters
                ? 'No defect logs match your active filter criteria. Try adjusting or clearing filters.'
                : 'No defect records have been logged yet for this shift.'}
            </p>
          </div>
          {hasActiveFilters ? (
            <button
              onClick={() => onUpdateFilters({})}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              Reset Filters
            </button>
          ) : (
            <button
              onClick={onNavigateToLog}
              className="px-5 py-2.5 bg-arvind-900 hover:bg-arvind-800 text-white text-xs font-bold rounded-xl shadow-md transition-all touch-press inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Log First Inspection</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5 pt-1">
          {inspections.map((inspection) => (
            <InspectionCard
              key={inspection.id || inspection.client_sync_id}
              inspection={inspection}
              onResolve={onResolveClick}
              onSelect={onSelectInspection}
            />
          ))}
        </div>
      )}

      {/* Filter Drawer Component */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onApplyFilters={onUpdateFilters}
        onResetFilters={() => onUpdateFilters({})}
      />
    </div>
  );
};

