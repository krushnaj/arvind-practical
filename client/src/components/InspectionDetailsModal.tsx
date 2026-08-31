import React from 'react';
import { 
  X, 
  Cpu, 
  Calendar, 
  User, 
  AlertTriangle, 
  CheckCircle2, 
  Radio, 
  CloudOff, 
  FileText, 
  Check, 
  Share2,
  Camera
} from 'lucide-react';
import { Inspection } from '../types';
import { getDefectIcon, getSeverityBadgeClass, formatInspectionDate } from './InspectionCard';

interface InspectionDetailsModalProps {
  inspection: Inspection | null;
  isOpen: boolean;
  onClose: () => void;
  onResolve: (inspection: Inspection) => void;
}

export const InspectionDetailsModal: React.FC<InspectionDetailsModalProps> = ({
  inspection,
  isOpen,
  onClose,
  onResolve,
}) => {
  if (!isOpen || !inspection) return null;

  const isResolved = inspection.status?.toLowerCase() === 'resolved';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-arvind-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-arvind-800 text-amber-400 flex items-center justify-center font-bold text-sm">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-sm sm:text-base leading-tight">
                  {inspection.machine_id}
                </h2>
                <span className="text-[10px] text-arvind-300 font-mono bg-arvind-950/60 px-1.5 py-0.5 rounded">
                  {inspection.id}
                </span>
              </div>
              <p className="text-xs text-arvind-200">{inspection.defect_type}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-arvind-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs sm:text-sm">
          {/* Status & Severity Pill Row */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Severity Level</span>
              <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${getSeverityBadgeClass(inspection.severity)}`}>
                {inspection.severity}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Current Status</span>
              <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                isResolved
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {isResolved ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Resolved
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Open Defect
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Defect Classification */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Defect Classification
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-arvind-50 text-arvind-700 flex items-center justify-center">
                  {getDefectIcon(inspection.defect_type)}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{inspection.defect_type}</div>
                  <div className="text-[11px] text-slate-500">Standard Textile Quality Category</div>
                </div>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Supervisor Remarks
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs leading-relaxed">
              {inspection.remarks ? inspection.remarks : <span className="italic text-slate-400">No additional remarks logged</span>}
            </div>
          </div>

          {/* Defect Photo Attachment */}
          {inspection.photo_url && (
            <div className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Camera className="w-3.5 h-3.5" /> Defect Photo
              </div>
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-h-56">
                <img
                  src={inspection.photo_url}
                  alt="Defect visual"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Resolution Details */}
          {isResolved && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                <span>Corrective Action & Resolution</span>
              </div>
              <p className="text-emerald-800 text-xs leading-relaxed bg-white/70 p-2.5 rounded-lg border border-emerald-200/60">
                {inspection.resolution_note}
              </p>
              <div className="text-[10px] text-emerald-700 flex items-center justify-between pt-1">
                <span>Resolved by: <b>{inspection.resolved_by || 'Supervisor'}</b></span>
                <span>{inspection.resolved_at ? formatInspectionDate(inspection.resolved_at) : ''}</span>
              </div>
            </div>
          )}

          {/* Audit Metadata Timeline */}
          <div className="border-t border-slate-200 pt-3 space-y-2 text-[11px] text-slate-500">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" /> Logged Date & Time
              </span>
              <span className="font-semibold text-slate-700">{formatInspectionDate(inspection.date)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" /> Logged By
              </span>
              <span className="font-semibold text-slate-700">{inspection.logged_by}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Radio className="w-3 h-3 text-slate-400" /> Data Source
              </span>
              <span className="font-semibold text-slate-700">
                {inspection.source === 'SAP_QM' ? 'SAP QM Interface' : inspection.source === 'OFFLINE_SYNC' ? 'Offline Synchronized' : 'Manual Shopfloor Entry'}
              </span>
            </div>

            {inspection.sap_notification_id && (
              <div className="flex items-center justify-between">
                <span>SAP QM Ref ID</span>
                <span className="font-mono font-bold text-indigo-700">{inspection.sap_notification_id}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-white transition-colors"
          >
            Close
          </button>

          {!isResolved && (
            <button
              onClick={() => {
                onClose();
                onResolve(inspection);
              }}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all touch-press"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Mark as Resolved</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

