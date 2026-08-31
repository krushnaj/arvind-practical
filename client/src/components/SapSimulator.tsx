import React, { useState } from 'react';
import { Radio, Send, Copy, Check, Terminal, CheckCircle2, AlertCircle, RefreshCw, FileCode } from 'lucide-react';
import { api } from '../api/client';
import { SapWebhookPayload } from '../types';
import { useToast } from '../contexts/ToastContext';

const SAMPLE_SAP_TEMPLATES: Array<{ label: string; payload: SapWebhookPayload }> = [
  {
    label: 'SAP QM: Airjet Loom Warp Streak (Critical)',
    payload: {
      NotificationNumber: `QM-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      Plant: '1001',
      PlantName: 'Plant Floor',
      WorkCenter: 'Airjet Loom AJ-31',
      DefectCode: 'WEAV01',
      DefectType: 'Weave Defect',
      DefectDescription: 'Warp tension drop causing loose ends and repeated reed marks in 100% cotton satin weave.',
      Severity: 'Critical',
      ReportedBy: 'SAP_QM_LOOM_SENSOR_GATEWAY',
      BatchNumber: 'LOT-SATIN-8891',
      Timestamp: new Date().toISOString(),
    },
  },
  {
    label: 'SAP QM: Continuous Dyeing Shade Shift (Major)',
    payload: {
      NotificationNumber: `QM-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      Plant: '1001',
      PlantName: 'Plant Floor',
      WorkCenter: 'Indigo Slasher Dyeing IS-02',
      DefectCode: 'SHAD02',
      DefectType: 'Shade Variation',
      DefectDescription: 'Spectrophotometer reading Delta E = 2.1 vs master swatch on dark indigo denim shade.',
      Severity: 'Major',
      ReportedBy: 'ONLINE_COLOR_MONITOR',
      BatchNumber: 'DNM-INDIGO-4402',
      Timestamp: new Date().toISOString(),
    },
  },
  {
    label: 'SAP PM: Stenter Pin Rail Misalignment (Critical)',
    payload: {
      NotificationNumber: `PM-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      Plant: '1001',
      PlantName: 'Plant Floor',
      WorkCenter: 'Stenter ST-05',
      DefectCode: 'HOLE03',
      DefectType: 'Hole/Tear',
      DefectDescription: 'Pin chain plate jump causing recurring hole punctures along left selvedge.',
      Severity: 'Critical',
      ReportedBy: 'STENTER_PLC_ALARM',
      Timestamp: new Date().toISOString(),
    },
  },
  {
    label: 'SAP QM: Spinning Count Deviation (Major)',
    payload: {
      NotificationNumber: `QM-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      Plant: '1001',
      PlantName: 'Plant Floor',
      WorkCenter: 'Ring Spinning Frame RF-14',
      DefectCode: 'CNT04',
      DefectType: 'Count Deviation',
      DefectDescription: 'Auto-leveler alert: Count drifted to 38.6s Ne against 40s Ne order spec.',
      Severity: 'Major',
      ReportedBy: 'USTER_TESTER_6',
      BatchNumber: 'YARN-LOT-9921',
      Timestamp: new Date().toISOString(),
    },
  },
];

export const SapSimulator: React.FC<{ onInspectionCreated?: () => void }> = ({ onInspectionCreated }) => {
  const { showToast } = useToast();
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number>(0);
  const [jsonText, setJsonText] = useState<string>(
    JSON.stringify(SAMPLE_SAP_TEMPLATES[0].payload, null, 2)
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [responseResult, setResponseResult] = useState<any>(null);
  const [errorResult, setErrorResult] = useState<string | null>(null);
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);

  const handleSelectTemplate = (idx: number) => {
    setSelectedTemplateIndex(idx);
    const updatedPayload = {
      ...SAMPLE_SAP_TEMPLATES[idx].payload,
      NotificationNumber: `QM-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      Timestamp: new Date().toISOString(),
    };
    setJsonText(JSON.stringify(updatedPayload, null, 2));
    setResponseResult(null);
    setErrorResult(null);
  };

  const handleSendWebhook = async () => {
    setIsLoading(true);
    setErrorResult(null);
    setResponseResult(null);

    try {
      const parsed = JSON.parse(jsonText);
      const res = await api.sendSapWebhook(parsed);
      setResponseResult(res);
      showToast(`SAP Notification ${parsed.NotificationNumber || ''} ingested successfully!`, 'success');
      if (onInspectionCreated) onInspectionCreated();
    } catch (err: any) {
      setErrorResult(err.message || 'Failed to trigger SAP webhook');
      showToast('Failed to trigger SAP webhook', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const generateCurlCommand = () => {
    try {
      const host = window.location.origin;
      return `curl -X POST "${host}/api/sap-webhook" \\
  -H "Content-Type: application/json" \\
  -d '${jsonText.replace(/'/g, "'\\''")}'`;
    } catch {
      return '';
    }
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(generateCurlCommand());
    setCopiedCurl(true);
    showToast('cURL command copied to clipboard', 'info');
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header Banner */}
      <div className="bg-arvind-900 text-white p-4 rounded-xl shadow-sm border border-arvind-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-400 text-arvind-950 flex items-center justify-center font-bold">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm sm:text-base">SAP QM / PM Webhook Simulator</h2>
            <p className="text-xs text-arvind-200">
              Test automated defect creation from ERP / PLC systems via <code className="text-amber-300">POST /api/sap-webhook</code>
            </p>
          </div>
        </div>
      </div>

      {/* Preset Templates Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
          Select SAP Quality Notification Template
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SAMPLE_SAP_TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectTemplate(idx)}
              className={`p-2.5 rounded-xl text-left text-xs font-medium border transition-all touch-press ${
                selectedTemplateIndex === idx
                  ? 'bg-arvind-50 border-arvind-500 text-arvind-900 font-bold shadow-sm ring-1 ring-arvind-400'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {tmpl.label}
            </button>
          ))}
        </div>
      </div>

      {/* JSON Payload Editor & Trigger */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <FileCode className="w-4 h-4 text-arvind-600" />
            <span>SAP JSON Payload</span>
          </div>
          <button
            onClick={handleCopyCurl}
            className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 font-semibold bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md transition-colors"
          >
            {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCurl ? 'Copied cURL!' : 'Copy cURL'}</span>
          </button>
        </div>

        <textarea
          rows={11}
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          className="w-full font-mono text-[11px] sm:text-xs p-3 bg-slate-900 text-amber-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-400 leading-relaxed border border-slate-800 resize-y"
          spellCheck={false}
        />

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-500">
            Target Endpoint: <code className="text-arvind-700 font-bold">/api/sap-webhook</code>
          </span>

          <button
            onClick={handleSendWebhook}
            disabled={isLoading}
            className="px-5 py-2.5 bg-arvind-900 hover:bg-arvind-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 touch-press transition-all"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                <span>Posting Webhook...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-amber-400" />
                <span>Send SAP Notification</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Response Preview */}
      {responseResult && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>SAP Notification Accepted (HTTP 201 Created)</span>
          </div>
          <div className="bg-white p-3 rounded-lg border border-emerald-200 text-xs font-mono text-emerald-950 overflow-x-auto">
            <pre>{JSON.stringify(responseResult, null, 2)}</pre>
          </div>
          <p className="text-[11px] text-emerald-800">
            A new inspection record <b>{responseResult.inspection?.id}</b> was successfully created in the database and linked to SAP notification <b>{responseResult.sapAcknowledgment?.notificationNumber}</b>.
          </p>
        </div>
      )}

      {errorResult && (
        <div className="bg-rose-50 border border-rose-300 rounded-xl p-4 space-y-1 text-xs text-rose-900 animate-in fade-in flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Webhook Ingestion Error</div>
            <div>{errorResult}</div>
          </div>
        </div>
      )}
    </div>
  );
};

