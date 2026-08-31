import React from 'react';
import { ClipboardList, PlusCircle, BarChart3, Radio } from 'lucide-react';

export type ActiveTab = 'list' | 'log' | 'summary' | 'sap';

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  openDefectsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  openDefectsCount = 0,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl safe-bottom max-w-lg mx-auto sm:max-w-xl md:max-w-2xl">
      <div className="grid grid-cols-4 h-16 items-center px-1">
        {/* 1. Feed / Inspections */}
        <button
          onClick={() => setActiveTab('list')}
          className={`flex flex-col items-center justify-center py-1 relative touch-press transition-colors ${
            activeTab === 'list' ? 'text-arvind-900 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <ClipboardList className={`w-5 h-5 ${activeTab === 'list' ? 'stroke-[2.5]' : ''}`} />
            {openDefectsCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[10px] font-black rounded-full h-4 min-w-4 px-1 flex items-center justify-center ring-2 ring-white">
                {openDefectsCount > 99 ? '99+' : openDefectsCount}
              </span>
            )}
          </div>
          <span className="text-[11px] mt-1 tracking-tight">Inspections</span>
          {activeTab === 'list' && (
            <span className="absolute bottom-1 w-6 h-0.5 bg-arvind-900 rounded-full" />
          )}
        </button>

        {/* 2. Log Defect (Prominent Action) */}
        <button
          onClick={() => setActiveTab('log')}
          className={`flex flex-col items-center justify-center py-1 relative touch-press transition-colors ${
            activeTab === 'log' ? 'text-arvind-900 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              activeTab === 'log'
                ? 'bg-amber-500 text-arvind-950 shadow-md shadow-amber-500/30'
                : 'bg-slate-100 text-slate-700'
            }`}>
              <PlusCircle className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <span className="text-[11px] mt-0.5 tracking-tight font-semibold">Log Defect</span>
          {activeTab === 'log' && (
            <span className="absolute bottom-1 w-6 h-0.5 bg-amber-500 rounded-full" />
          )}
        </button>

        {/* 3. Summary & Analytics */}
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex flex-col items-center justify-center py-1 relative touch-press transition-colors ${
            activeTab === 'summary' ? 'text-arvind-900 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className={`w-5 h-5 ${activeTab === 'summary' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px] mt-1 tracking-tight">Summary</span>
          {activeTab === 'summary' && (
            <span className="absolute bottom-1 w-6 h-0.5 bg-arvind-900 rounded-full" />
          )}
        </button>

        {/* 4. SAP QM Simulator */}
        <button
          onClick={() => setActiveTab('sap')}
          className={`flex flex-col items-center justify-center py-1 relative touch-press transition-colors ${
            activeTab === 'sap' ? 'text-arvind-900 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Radio className={`w-5 h-5 ${activeTab === 'sap' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px] mt-1 tracking-tight">SAP Sync</span>
          {activeTab === 'sap' && (
            <span className="absolute bottom-1 w-6 h-0.5 bg-arvind-900 rounded-full" />
          )}
        </button>
      </div>
    </nav>
  );
};

