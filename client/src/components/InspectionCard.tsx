import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Palette, 
  Scissors, 
  Scale, 
  HelpCircle, 
  Cpu, 
  CloudOff, 
  ChevronRight, 
  Camera,
  Check
} from 'lucide-react';
import { Inspection, DefectType, Severity } from '../types';

interface InspectionCardProps {
  inspection: Inspection;
  onResolve: (inspection: Inspection) => void;
  onSelect: (inspection: Inspection) => void;
}

export const getDefectIcon = (type: DefectType) => {
  switch (type) {
    case 'Weave Defect':
      return <Layers className="w-3.5 h-3.5" />;
    case 'Shade Variation':
      return <Palette className="w-3.5 h-3.5" />;
    case 'Hole/Tear':
      return <Scissors className="w-3.5 h-3.5" />;
    case 'Count Deviation':
      return <Scale className="w-3.5 h-3.5" />;
    default:
      return <HelpCircle className="w-3.5 h-3.5" />;
  }
};

export const getSeverityBadgeClass = (severity: Severity) => {
  switch (severity) {
    case 'Critical':
      return 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-300';
    case 'Major':
      return 'bg-amber-50 text-amber-800 border-amber-200 ring-1 ring-amber-300';
    case 'Minor':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

export const formatInspectionDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    if (isToday) {
      return `Today at ${timeStr}`;
    }
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} • ${timeStr}`;
  } catch {
    return dateStr;
  }
};

export const InspectionCard: React.FC<InspectionCardProps> = ({
  inspection,
  onResolve,
  onSelect,
}) => {
  const isResolved = inspection.status?.toLowerCase() === 'resolved';
  const isOfflineDraft = inspection.isPendingSync || inspection.id.startsWith('LOCAL-');

  return (
    <div 
      className={`bg-white rounded-xl border transition-all duration-200 shadow-sm hover:shadow-md overflow-hidden ${
        isResolved ? 'border-slate-200/80 bg-white' : 'border-slate-300/90'
      }`}
    >
      {/* Top Bar: Machine ID, Severity Badge, Status */}
      <div className="p-3.5 pb-2.5">
        <div className="flex items-start justify-between gap-2">
          {/* Machine ID and Defect Type */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-arvind-700 shrink-0" />
                <span className="truncate">{inspection.machine_id}</span>
              </span>

              {/* Source Pill (SAP QM or Offline) */}
              {inspection.source === 'SAP_QM' && (
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.2 rounded border border-indigo-200">
                  SAP QM
                </span>
              )}
              {isOfflineDraft && (
                <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded border border-amber-300 flex items-center gap-0.5">
                  <CloudOff className="w-2.5 h-2.5" /> Pending Sync
                </span>
              )}
            </div>

            {/* Defect Type Chip */}
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                {getDefectIcon(inspection.defect_type)}
                {inspection.defect_type}
              </span>
            </div>
          </div>

          {/* Severity & Status */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${getSeverityBadgeClass(inspection.severity)}`}>
              {inspection.severity === 'Critical' && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping inline-block" />
              )}
              {inspection.severity}
            </span>

            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
              isResolved 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}>
              {isResolved ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Resolved
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  Open
                </>
              )}
            </span>
          </div>
        </div>

        {/* Remarks / Details Snippet */}
        {inspection.remarks && (
          <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
            {inspection.remarks}
          </p>
        )}

        {/* Photo preview if present */}
        {inspection.photo_url && (
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-arvind-700 font-semibold">
            <Camera className="w-3.5 h-3.5" />
            <span>Defect photo attached</span>
          </div>
        )}

        {/* Resolved Note Banner */}
        {isResolved && inspection.resolution_note && (
          <div className="mt-2.5 p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs">
            <div className="flex items-center gap-1 font-bold text-emerald-900 text-[11px] mb-0.5">
              <Check className="w-3 h-3 text-emerald-600" />
              <span>Resolution Applied</span>
              {inspection.resolved_by && (
                <span className="text-emerald-700 font-normal ml-auto text-[10px]">
                  by {inspection.resolved_by.split('(')[0]}
                </span>
              )}
            </div>
            <p className="text-emerald-800 text-[11px] leading-relaxed line-clamp-2">
              "{inspection.resolution_note}"
            </p>
          </div>
        )}
      </div>

      {/* Footer bar: Date, Logged by, and Action */}
      <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate">
          <Clock className="w-3 h-3 shrink-0" />
          <span className="truncate">{formatInspectionDate(inspection.date)}</span>
          {inspection.logged_by && (
            <>
              <span className="mx-1 opacity-50">•</span>
              <span className="truncate text-slate-600 font-medium">{inspection.logged_by.split('(')[0]}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isResolved && (
            <button
              data-testid="card-resolve-btn"
              onClick={(e) => {
                e.stopPropagation();
                onResolve(inspection);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm touch-press transition-colors"
            >
              <Check className="w-3 h-3 stroke-[3]" />
              <span>Resolve</span>
            </button>
          )}

          <button
            onClick={() => onSelect(inspection)}
            className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
            title="View Details"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
