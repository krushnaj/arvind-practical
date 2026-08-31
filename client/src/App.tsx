import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { BottomNav, ActiveTab } from './components/BottomNav';
import { ListPage } from './pages/ListPage';
import { LogPage } from './pages/LogPage';
import { SummaryPage } from './pages/SummaryPage';
import { SapSimulatorPage } from './pages/SapSimulatorPage';
import { ResolveModal } from './components/ResolveModal';
import { InspectionDetailsModal } from './components/InspectionDetailsModal';
import { Inspection, InspectionFilterParams } from './types';
import { api } from './api/client';
import { syncQueue } from './api/syncQueue';
import { useAuth } from './contexts/AuthContext';

export const App: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('list');
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<InspectionFilterParams>({});

  // Modals state
  const [resolvingInspection, setResolvingInspection] = useState<Inspection | null>(null);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);

  // Fetch Inspections from backend & combine with local offline queue
  const fetchInspections = useCallback(async () => {
    setIsLoading(true);
    try {
      let serverItems: Inspection[] = [];
      if (syncQueue.isOnline()) {
        try {
          const res = await api.getInspections(filters);
          serverItems = res.inspections;
        } catch (e) {
          console.warn('Backend fetch failed, falling back to local store:', e);
        }
      }

      // Merge with pending local items
      const offlineQueue = syncQueue.getQueue();
      const localPendingInspections: Inspection[] = [];

      for (const q of offlineQueue) {
        if (q.type === 'CREATE_INSPECTION') {
          localPendingInspections.push(q.data);
        } else if (q.type === 'RESOLVE_INSPECTION') {
          // Update resolved state in local representation
          const target = serverItems.find(i => i.id === q.data.id);
          if (target) {
            target.status = 'Resolved';
            target.resolution_note = q.data.resolution_note;
            target.resolved_by = q.data.resolved_by;
            target.resolved_at = q.data.resolved_at;
          }
        }
      }

      // Combine local pending drafts at top
      const merged = [...localPendingInspections, ...serverItems.filter(s => !localPendingInspections.some(l => l.client_sync_id === s.client_sync_id))];
      setInspections(merged);
    } catch (err) {
      console.error('Failed to load inspections:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchInspections();
  }, [fetchInspections]);

  // Subscribe to sync queue state
  useEffect(() => {
    const unsub = syncQueue.subscribe((online, count, syncing) => {
      if (!syncing && count === 0) {
        fetchInspections();
      }
    });
    return unsub;
  }, [fetchInspections]);

  // Handle successful inspection creation
  const handleInspectionCreated = (newInspection: Inspection) => {
    setInspections(prev => [newInspection, ...prev]);
  };

  // Handle resolution update
  const handleInspectionResolved = (updatedInspection: Inspection) => {
    setInspections(prev =>
      prev.map(i => (i.id === updatedInspection.id ? updatedInspection : i))
    );
    if (selectedInspection?.id === updatedInspection.id) {
      setSelectedInspection(updatedInspection);
    }
  };

  const openDefectsCount = inspections.filter(i => i.status?.toLowerCase() === 'open').length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* 1. Header Bar */}
      <Header onRefreshData={fetchInspections} />

      {/* 2. Main Page Content (Responsive Mobile Container 390px - 768px) */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-3.5 pt-3.5 pb-20">
        {activeTab === 'list' && (
          <ListPage
            inspections={inspections}
            isLoading={isLoading}
            filters={filters}
            onUpdateFilters={setFilters}
            onRefresh={fetchInspections}
            onResolveClick={(item) => setResolvingInspection(item)}
            onSelectInspection={(item) => setSelectedInspection(item)}
            onNavigateToLog={() => setActiveTab('log')}
          />
        )}

        {activeTab === 'log' && (
          <LogPage
            onSuccess={handleInspectionCreated}
            onNavigateToList={() => setActiveTab('list')}
          />
        )}

        {activeTab === 'summary' && <SummaryPage />}

        {activeTab === 'sap' && (
          <SapSimulatorPage
            onInspectionCreated={() => {
              fetchInspections();
              setActiveTab('list');
            }}
          />
        )}
      </main>

      {/* 3. Bottom Mobile Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openDefectsCount={openDefectsCount}
      />

      {/* 4. Resolve Inspection Bottom Drawer / Modal */}
      <ResolveModal
        inspection={resolvingInspection}
        isOpen={Boolean(resolvingInspection)}
        onClose={() => setResolvingInspection(null)}
        onSuccess={handleInspectionResolved}
      />

      {/* 5. Inspection Details Modal */}
      <InspectionDetailsModal
        inspection={selectedInspection}
        isOpen={Boolean(selectedInspection)}
        onClose={() => setSelectedInspection(null)}
        onResolve={(item) => {
          setSelectedInspection(null);
          setResolvingInspection(item);
        }}
      />
    </div>
  );
};

