export type DefectType = 
  | 'Weave Defect'
  | 'Shade Variation'
  | 'Hole/Tear'
  | 'Count Deviation'
  | 'Other';

export type Severity = 'Critical' | 'Major' | 'Minor';

export type InspectionStatus = 'Open' | 'Resolved';

export interface Inspection {
  id: string;
  date: string;
  plant: string;
  machine_id: string;
  defect_type: DefectType;
  severity: Severity;
  status: InspectionStatus;
  remarks?: string | null;
  photo_url?: string | null;
  source: 'MANUAL' | 'SAP_QM' | 'OFFLINE_SYNC';
  sap_notification_id?: string | null;
  logged_by: string;
  resolution_note?: string | null;
  resolved_by?: string | null;
  resolved_at?: string | null;
  client_sync_id?: string;
  created_at: string;
  updated_at: string;
  isPendingSync?: boolean; // For local offline drafts
}

export interface SummaryMatrixData {
  matrix: {
    Critical: { open: number; resolved: number; total: number };
    Major: { open: number; resolved: number; total: number };
    Minor: { open: number; resolved: number; total: number };
  };
  totals: {
    open: number;
    resolved: number;
    grandTotal: number;
    todayCount: number;
    criticalOpen: number;
    resolutionRate: number;
  };
  defectBreakdown: Array<{ defect_type: string; count: number }>;
  plantBreakdown: Array<{ plant: string; open_count: number; resolved_count: number; total_count: number }>;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'supervisor' | 'manager' | 'admin';
  plant: string;
}

export interface InspectionFilterParams {
  status?: string;
  severity?: string;
  defect_type?: string;
  plant?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: 'date' | 'severity' | 'machine_id' | 'status';
  sort_order?: 'asc' | 'desc';
}

export interface SapWebhookPayload {
  NotificationNumber: string;
  Plant?: string;
  PlantName?: string;
  WorkCenter: string;
  DefectCode?: string;
  DefectType?: DefectType;
  DefectDescription?: string;
  Severity?: Severity | number | string;
  ReportedBy?: string;
  BatchNumber?: string;
  Timestamp?: string;
}

