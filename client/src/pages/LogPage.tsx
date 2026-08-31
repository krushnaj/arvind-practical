import React, { useState } from 'react';
import { 
  PlusCircle, 
  Cpu, 
  Layers, 
  Palette, 
  Scissors, 
  Scale, 
  HelpCircle, 
  AlertOctagon, 
  AlertTriangle, 
  Info, 
  Camera, 
  CheckCircle2, 
  RotateCcw, 
  Send,
  CloudOff
} from 'lucide-react';
import { DefectType, Severity, Inspection } from '../types';
import { api } from '../api/client';
import { syncQueue } from '../api/syncQueue';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface LogPageProps {
  onSuccess: (newInspection: Inspection) => void;
  onNavigateToList: () => void;
}

const DEFECT_TYPES: Array<{ type: DefectType; icon: React.ReactNode; desc: string }> = [
  { type: 'Weave Defect', icon: <Layers className="w-4 h-4" />, desc: 'Warp/weft break, slub, reed mark' },
  { type: 'Shade Variation', icon: <Palette className="w-4 h-4" />, desc: 'Delta E shift, selvedge-to-center' },
  { type: 'Hole/Tear', icon: <Scissors className="w-4 h-4" />, desc: 'Pin tears, needle holes, cuts' },
  { type: 'Count Deviation', icon: <Scale className="w-4 h-4" />, desc: 'Ne count shift, roving tension' },
  { type: 'Other', icon: <HelpCircle className="w-4 h-4" />, desc: 'Oil stains, contamination, rust' },
];

const SEVERITIES: Array<{ level: Severity; icon: React.ReactNode; color: string; desc: string }> = [
  { 
    level: 'Critical', 
    icon: <AlertOctagon className="w-4 h-4" />, 
    color: 'bg-rose-50 border-rose-300 text-rose-800 ring-rose-500', 
    desc: 'Line stop / Unusable roll' 
  },
  { 
    level: 'Major', 
    icon: <AlertTriangle className="w-4 h-4" />, 
    color: 'bg-amber-50 border-amber-300 text-amber-900 ring-amber-500', 
    desc: 'Noticeable defect / Downgrade' 
  },
  { 
    level: 'Minor', 
    icon: <Info className="w-4 h-4" />, 
    color: 'bg-sky-50 border-sky-300 text-sky-800 ring-sky-500', 
    desc: 'Slight deviation / Pass with note' 
  },
];

const RECENT_MACHINES = [
  'Airjet Loom AJ-14',
  'Stenter ST-03',
  'Indigo Dye Range IDR-02',
  'Ring Frame RF-08',
  'Sulzer Rapier R-11',
  'Sanforizing SF-01',
];

export const LogPage: React.FC<LogPageProps> = ({ onSuccess, onNavigateToList }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Form State
  const [date, setDate] = useState<string>(() => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  });
  const [machineId, setMachineId] = useState<string>('');
  const [defectType, setDefectType] = useState<DefectType>('Weave Defect');
  const [severity, setSeverity] = useState<Severity>('Major');
  const [remarks, setRemarks] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCreated, setLastCreated] = useState<Inspection | null>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const clearFormInputs = () => {
    const now = new Date();
    setDate(new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    setMachineId('');
    setDefectType('Weave Defect');
    setSeverity('Major');
    setRemarks('');
    setPhotoFile(null);
    setPhotoPreview(null);
    setError(null);
  };

  const handleReset = () => {
    clearFormInputs();
    setLastCreated(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineId.trim()) {
      setError('Machine / Line ID is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let uploadedPhotoUrl: string | null = null;
      if (photoFile && syncQueue.isOnline()) {
        try {
          const uploadRes = await api.uploadPhoto(photoFile);
          uploadedPhotoUrl = uploadRes.photoUrl;
        } catch {
          console.warn('Photo upload failed, proceeding with defect data');
        }
      }

      const currentMachine = machineId.trim();
      const currentDefect = defectType;

      const inspectionPayload: Partial<Inspection> = {
        date,
        plant: 'Plant Floor',
        machine_id: currentMachine,
        defect_type: currentDefect,
        severity,
        remarks: remarks.trim() || null,
        photo_url: uploadedPhotoUrl || photoPreview || null,
        logged_by: user?.name || 'Shop-Floor Supervisor',
      };

      if (!syncQueue.isOnline()) {
        // Log in offline mode
        const offlineRecord = syncQueue.enqueueCreate(inspectionPayload);
        setLastCreated(offlineRecord);
        clearFormInputs();
        showToast(`Defect saved offline for ${currentMachine} (${currentDefect})`, 'warning');
        onSuccess(offlineRecord);
      } else {
        // Online mode
        const res = await api.createInspection(inspectionPayload);
        setLastCreated(res.inspection);
        clearFormInputs();
        showToast(`Inspection ${res.inspection.id} saved (${currentMachine})`, 'success');
        onSuccess(res.inspection);
      }
    } catch (err: any) {
      console.error('Error logging inspection:', err);
      setError(err.message || 'Failed to submit inspection record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-24 max-w-lg mx-auto">
      {/* Top Banner */}
      <div className="bg-arvind-900 text-white p-4 rounded-xl shadow-sm border border-arvind-800 flex items-center justify-between">
        <div>
          <h2 className="font-extrabold text-sm sm:text-base">Log Quality Inspection</h2>
          <p className="text-xs text-arvind-200">Shop-Floor Real-Time Defect Entry</p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-amber-400 text-arvind-950 flex items-center justify-center font-bold">
          <PlusCircle className="w-5 h-5" />
        </div>
      </div>

      {/* Success Notification Banner */}
      {lastCreated && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 space-y-3 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-xs sm:text-sm text-emerald-950">
                Inspection Logged Successfully!
              </div>
              <p className="text-xs text-emerald-800 mt-0.5">
                Record <span className="font-mono font-bold">{lastCreated.id}</span> ({lastCreated.machine_id}) was saved.
                {lastCreated.isPendingSync && (
                  <span className="block mt-1 font-semibold text-amber-800 flex items-center gap-1">
                    <CloudOff className="w-3 h-3" /> Queued locally for offline sync.
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors text-center"
            >
              + Log Another Defect
            </button>
            <button
              type="button"
              onClick={onNavigateToList}
              className="py-2 px-3 bg-white border border-emerald-300 text-emerald-900 text-xs font-bold rounded-xl shadow-sm hover:bg-emerald-50 transition-colors"
            >
              View in Feed →
            </button>
          </div>
        </div>
      )}

      {/* Form Error Banner */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Log Defect Form */}
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        {/* 1. Date & Time Picker */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Inspection Date & Time <span className="text-rose-600">*</span>
            </label>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                setDate(new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
              }}
              className="text-[11px] text-arvind-700 font-semibold hover:underline"
            >
              Set to Now
            </button>
          </div>
          <div className="relative">
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-arvind-500 bg-slate-50/50 font-medium"
              required
            />
          </div>
        </div>

        {/* 2. Machine / Line ID (Free Text + Suggestions) */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
            Machine / Line ID <span className="text-rose-600">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Cpu className="w-4 h-4" />
            </div>
            <input
              type="text"
              id="machineId"
              value={machineId}
              onChange={(e) => setMachineId(e.target.value)}
              placeholder="e.g. Loom-14, Stenter-02, Frame-08..."
              className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-arvind-500 font-medium bg-slate-50/50"
              required
            />
          </div>

          {/* Quick Suggestions Chips */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-medium mr-1">Quick:</span>
            {RECENT_MACHINES.slice(0, 4).map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => setMachineId(m)}
                className={`text-[11px] px-2 py-1 rounded-lg border transition-all ${
                  machineId === m
                    ? 'bg-arvind-900 text-white border-arvind-900 font-semibold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Defect Type Picker */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
            Defect Type <span className="text-rose-600">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DEFECT_TYPES.map((dt) => {
              const isSelected = defectType === dt.type;
              return (
                <button
                  type="button"
                  key={dt.type}
                  onClick={() => setDefectType(dt.type)}
                  className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                    isSelected
                      ? 'border-arvind-600 bg-arvind-50/60 ring-2 ring-arvind-500 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      isSelected ? 'bg-arvind-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {dt.icon}
                  </div>
                  <div className="min-w-0">
                    <div className={`font-bold text-xs ${isSelected ? 'text-arvind-950' : 'text-slate-800'}`}>
                      {dt.type}
                    </div>
                    <div className="text-[11px] text-slate-500 leading-tight truncate">
                      {dt.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Severity Picker */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
            Defect Severity <span className="text-rose-600">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {SEVERITIES.map((sev) => {
              const isSelected = severity === sev.level;
              return (
                <button
                  type="button"
                  key={sev.level}
                  onClick={() => setSeverity(sev.level)}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                    isSelected
                      ? `${sev.color} ring-2 font-bold shadow-sm scale-[1.02]`
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {sev.icon}
                    <span className="text-xs font-bold">{sev.level}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 leading-tight line-clamp-1">
                    {sev.desc.split('/')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Remarks */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
            Supervisor Remarks <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <textarea
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Additional observations, roll meter mark, lot details, technician notes..."
            className="w-full p-3 text-xs sm:text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-arvind-500 bg-slate-50/50 placeholder:text-slate-400 leading-relaxed resize-none"
          />
        </div>

        {/* 6. Photo Upload Attachment */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
            Defect Photo <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          
          {photoPreview ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900/5 p-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={photoPreview}
                  alt="Defect Preview"
                  className="w-14 h-14 object-cover rounded-lg border border-slate-200"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">{photoFile?.name || 'Attached Photo'}</div>
                  <div className="text-[10px] text-slate-500">
                    {photoFile ? `${Math.round(photoFile.size / 1024)} KB` : 'Ready to upload'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPhotoFile(null);
                  setPhotoPreview(null);
                }}
                className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold"
              >
                Remove
              </button>
            </div>
          ) : (
            <label className="border-2 border-dashed border-slate-300 hover:border-arvind-500 rounded-xl p-4 flex flex-col items-center justify-center gap-1 cursor-pointer bg-slate-50/60 hover:bg-arvind-50/30 transition-colors">
              <Camera className="w-6 h-6 text-arvind-600" />
              <span className="text-xs font-bold text-slate-700">Take Photo or Upload Image</span>
              <span className="text-[10px] text-slate-400">JPEG, PNG up to 10MB</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Form Actions */}
        <div className="pt-2 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="submit"
            disabled={isSubmitting || !machineId.trim()}
            className={`flex-1 py-3 px-5 rounded-xl font-bold text-xs sm:text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-all touch-press ${
              !machineId.trim() || isSubmitting
                ? 'bg-slate-400 cursor-not-allowed opacity-70'
                : 'bg-arvind-900 hover:bg-arvind-800 shadow-arvind-900/20'
            }`}
          >
            <Send className="w-4 h-4 text-amber-400" />
            <span>{isSubmitting ? 'Submitting...' : 'Save Inspection Record'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
