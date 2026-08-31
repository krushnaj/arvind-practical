import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Wrench, Send, Loader2 } from 'lucide-react';
import { Inspection } from '../types';
import { api } from '../api/client';
import { syncQueue } from '../api/syncQueue';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface ResolveModalProps {
  inspection: Inspection | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedInspection: Inspection) => void;
}

const COMMON_REMEDY_TEMPLATES = [
  'Replaced broken needles/droppers and recalibrated yarn tension.',
  'Cleaned reed, aligned air nozzles, and inspected next 50 meters with zero defects.',
  'Flushed caustic dosing lines, recalibrated pH sensor, and verified lab swatch.',
  'Adjusted draft gear ratio, re-checked roving bobbin weight, and verified Ne count.',
  'Isolated defective fabric roll #MR-42, marked cutting boundary, and notified shift lead.',
];

export const ResolveModal: React.FC<ResolveModalProps> = ({
  inspection,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [resolutionNote, setResolutionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear modal state whenever the modal opens or target inspection changes
  useEffect(() => {
    if (isOpen) {
      setResolutionNote('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, inspection?.id]);

  const handleClose = () => {
    setResolutionNote('');
    setError(null);
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen || !inspection) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionNote.trim()) {
      setError('A resolution note is strictly mandatory to mark an inspection as Resolved.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const resolverName = user?.name || 'Shop-Floor Supervisor';

    try {
      if (!syncQueue.isOnline() || inspection.isPendingSync || inspection.id.startsWith('LOCAL-')) {
        // Enqueue offline resolution
        syncQueue.enqueueResolve(inspection.id, resolutionNote.trim(), resolverName);
        
        const updatedOffline: Inspection = {
          ...inspection,
          status: 'Resolved',
          resolution_note: resolutionNote.trim(),
          resolved_by: resolverName,
          resolved_at: new Date().toISOString(),
          isPendingSync: true,
        };

        showToast(`Resolution queued offline for ${inspection.machine_id}`, 'warning');
        setResolutionNote('');
        setError(null);
        onSuccess(updatedOffline);
        onClose();
      } else {
        // Online API call
        const res = await api.resolveInspection(inspection.id, resolutionNote.trim(), resolverName);
        showToast(`Inspection ${inspection.id} marked Resolved (${inspection.machine_id})`, 'success');
        setResolutionNote('');
        setError(null);
        onSuccess(res.inspection);
        onClose();
      }
    } catch (err: any) {
      console.error('Resolution error:', err);
      setError(err.message || 'Failed to submit resolution note');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div 
        className="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="bg-arvind-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base leading-tight">
                Mark Inspection Resolved
              </h2>
              <p className="text-xs text-arvind-200">
                Machine: <span className="font-semibold text-white">{inspection.machine_id}</span> • {inspection.defect_type}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full text-arvind-300 hover:text-white hover:bg-arvind-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* Defect Summary Card */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-700">
            <div className="flex items-center justify-between font-semibold">
              <span>Severity: <span className="font-bold text-slate-900">{inspection.severity}</span></span>
              <span>Type: <span className="font-bold text-slate-900">{inspection.defect_type}</span></span>
            </div>
            {inspection.remarks && (
              <p className="text-slate-600 bg-white p-2 rounded border border-slate-200/60 text-[11px] italic">
                "{inspection.remarks}"
              </p>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Mandatory Resolution Note */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="resolutionNote" className="block text-xs font-bold text-slate-800">
                Resolution Note <span className="text-rose-600">* (Mandatory)</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                {resolutionNote.length} characters
              </span>
            </div>

            <textarea
              id="resolutionNote"
              rows={4}
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="Describe corrective actions taken (e.g. root cause fix, parts replaced, tension recalibrated, shift lead informed)..."
              className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400 leading-relaxed resize-none"
              required
            />
          </div>

          {/* Quick Remedy Templates */}
          <div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
              <Wrench className="w-3 h-3 text-slate-500" />
              <span>Quick Action Remediation Templates</span>
            </div>
            <div className="space-y-1.5">
              {COMMON_REMEDY_TEMPLATES.map((tmpl, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setResolutionNote(tmpl)}
                  className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-300 text-[11px] text-slate-700 hover:text-emerald-900 transition-colors flex items-start gap-1.5"
                >
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>{tmpl}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !resolutionNote.trim()}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-md transition-all touch-press ${
                !resolutionNote.trim() || isSubmitting
                  ? 'bg-slate-400 cursor-not-allowed opacity-70'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Confirm Resolution</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
