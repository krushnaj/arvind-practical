import { Inspection, InspectionFilterParams, SummaryMatrixData, SapWebhookPayload, User } from '../types';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('arvind_auth_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Authentication
  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to login');
    }
    return res.json();
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error('Unauthorized');
    }
    return res.json();
  },

  async getDemoUsers(): Promise<{ users: User[] }> {
    const res = await fetch(`${API_BASE}/auth/demo-users`);
    if (!res.ok) throw new Error('Failed to fetch demo users');
    return res.json();
  },

  // Inspections List & Filtering
  async getInspections(params: InspectionFilterParams = {}): Promise<{ total: number; inspections: Inspection[] }> {
    const searchParams = new URLSearchParams();
    if (params.status && params.status !== 'all') searchParams.append('status', params.status);
    if (params.severity && params.severity !== 'all') searchParams.append('severity', params.severity);
    if (params.defect_type && params.defect_type !== 'all') searchParams.append('defect_type', params.defect_type);
    if (params.plant && params.plant !== 'all') searchParams.append('plant', params.plant);
    if (params.search) searchParams.append('search', params.search);
    if (params.start_date) searchParams.append('start_date', params.start_date);
    if (params.end_date) searchParams.append('end_date', params.end_date);
    if (params.sort_by) searchParams.append('sort_by', params.sort_by);
    if (params.sort_order) searchParams.append('sort_order', params.sort_order);

    const res = await fetch(`${API_BASE}/inspections?${searchParams.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to load inspections');
    }
    return res.json();
  },

  async getInspectionById(id: string): Promise<{ inspection: Inspection }> {
    const res = await fetch(`${API_BASE}/inspections/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load inspection details');
    return res.json();
  },

  // Create Inspection
  async createInspection(data: Partial<Inspection>): Promise<{ inspection: Inspection }> {
    const res = await fetch(`${API_BASE}/inspections`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create inspection');
    }
    return res.json();
  },

  // Mark as Resolved (Mandatory resolution note)
  async resolveInspection(id: string, resolution_note: string, resolved_by?: string): Promise<{ inspection: Inspection }> {
    const res = await fetch(`${API_BASE}/inspections/${id}/resolve`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ resolution_note, resolved_by }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to resolve inspection');
    }
    return res.json();
  },

  // Batch Offline Sync
  async batchSync(inspections: any[]): Promise<any> {
    const res = await fetch(`${API_BASE}/inspections/batch-sync`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ inspections }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Batch sync failed');
    }
    return res.json();
  },

  // Summary Matrix & KPIs
  async getSummary(params: { plant?: string; start_date?: string; end_date?: string } = {}): Promise<SummaryMatrixData> {
    const searchParams = new URLSearchParams();
    if (params.plant && params.plant !== 'all') searchParams.append('plant', params.plant);
    if (params.start_date) searchParams.append('start_date', params.start_date);
    if (params.end_date) searchParams.append('end_date', params.end_date);

    const res = await fetch(`${API_BASE}/inspections/summary?${searchParams.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to load summary');
    }
    return res.json();
  },

  // Photo Upload
  async uploadPhoto(file: File): Promise<{ photoUrl: string }> {
    const formData = new FormData();
    formData.append('photo', file);
    const token = localStorage.getItem('arvind_auth_token');

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to upload photo');
    }
    return res.json();
  },

  // Mock SAP QM Integration
  async sendSapWebhook(payload: SapWebhookPayload): Promise<any> {
    const res = await fetch(`${API_BASE}/sap-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'SAP Webhook call failed');
    }
    return data;
  },

  async getSapLogs(): Promise<{ logs: any[] }> {
    const res = await fetch(`${API_BASE}/sap-logs`);
    if (!res.ok) throw new Error('Failed to load SAP logs');
    return res.json();
  },

  // Export CSV download URL
  getExportUrl(): string {
    return `${API_BASE}/inspections/export`;
  },
};

