import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import { seedData } from '../seed.js';

describe('Arvind Quality Inspection Tracker API Suite', () => {
  let authToken = '';

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    seedData();
  });

  // 1. Health check
  it('GET /api/health returns healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.company).toContain('Arvind Limited');
  });

  // 2. Authentication
  describe('Auth Routes', () => {
    it('POST /api/auth/login succeeds with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'supervisor', password: 'arvind123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.username).toBe('supervisor');
      expect(res.body.user.role).toBe('supervisor');
      authToken = res.body.token;
    });

    it('POST /api/auth/login fails with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'supervisor', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid username or password');
    });

    it('POST /api/auth/register creates a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'new_supervisor',
          password: 'password123',
          name: 'Line Supervisor B',
          role: 'supervisor',
          plant: 'Plant Floor',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.username).toBe('new_supervisor');
      expect(res.body.user.name).toBe('Line Supervisor B');
    });

    it('GET /api/auth/me returns current user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.username).toBe('supervisor');
    });
  });

  // 3. Inspections CRUD & Validation
  describe('Inspection Creation & Validation', () => {
    it('POST /api/inspections creates new inspection successfully', async () => {
      const newDefect = {
        date: new Date().toISOString(),
        plant: 'Plant Floor',
        machine_id: 'Airjet Loom AJ-99',
        defect_type: 'Weave Defect',
        severity: 'Critical',
        remarks: 'Warp end snapped causing visible streak on 80m fabric roll.',
      };

      const res = await request(app)
        .post('/api/inspections')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newDefect);

      expect(res.status).toBe(201);
      expect(res.body.inspection).toHaveProperty('id');
      expect(res.body.inspection.machine_id).toBe('Airjet Loom AJ-99');
      expect(res.body.inspection.status).toBe('Open');
      expect(res.body.inspection.severity).toBe('Critical');
      expect(res.body.inspection.defect_type).toBe('Weave Defect');
    });

    it('POST /api/inspections validates required fields', async () => {
      const invalid = {
        date: new Date().toISOString(),
        // machine_id missing
        defect_type: 'Weave Defect',
        severity: 'Critical',
      };

      const res = await request(app)
        .post('/api/inspections')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalid);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Machine/Line ID is required');
    });

    it('POST /api/inspections validates defect type enum', async () => {
      const invalid = {
        date: new Date().toISOString(),
        machine_id: 'Loom-01',
        defect_type: 'InvalidDefectType',
        severity: 'Critical',
      };

      const res = await request(app)
        .post('/api/inspections')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalid);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Defect type is required');
    });
  });

  // 4. Filterable & Sortable List
  describe('Inspection Querying & Filtering', () => {
    it('GET /api/inspections returns all inspections', async () => {
      const res = await request(app).get('/api/inspections');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('inspections');
      expect(Array.isArray(res.body.inspections)).toBe(true);
      expect(res.body.total).toBeGreaterThanOrEqual(8);
    });

    it('GET /api/inspections?status=Open filters by open status', async () => {
      const res = await request(app).get('/api/inspections?status=Open');
      expect(res.status).toBe(200);
      expect(res.body.inspections.every((i: any) => i.status.toLowerCase() === 'open')).toBe(true);
    });

    it('GET /api/inspections?severity=Critical filters by critical severity', async () => {
      const res = await request(app).get('/api/inspections?severity=Critical');
      expect(res.status).toBe(200);
      expect(res.body.inspections.every((i: any) => i.severity.toLowerCase() === 'critical')).toBe(true);
    });

    it('GET /api/inspections?search=Airjet performs text search', async () => {
      const res = await request(app).get('/api/inspections?search=Airjet');
      expect(res.status).toBe(200);
      expect(res.body.inspections.length).toBeGreaterThan(0);
      expect(res.body.inspections.some((i: any) => i.machine_id.includes('Airjet') || i.remarks?.includes('Airjet'))).toBe(true);
    });
  });

  // 5. Resolution & Mandatory Note Validation
  describe('Inspection Resolution Workflow', () => {
    it('PATCH /api/inspections/:id/resolve fails if resolution note is empty', async () => {
      const listRes = await request(app).get('/api/inspections?status=Open');
      const target = listRes.body.inspections[0];

      const res = await request(app)
        .patch(`/api/inspections/${target.id}/resolve`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ resolution_note: '   ' }); // Empty whitespace

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('mandatory resolution note');
    });

    it('PATCH /api/inspections/:id/resolve succeeds with valid resolution note', async () => {
      const listRes = await request(app).get('/api/inspections?status=Open');
      const target = listRes.body.inspections[0];

      const res = await request(app)
        .patch(`/api/inspections/${target.id}/resolve`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          resolution_note: 'Replaced broken dropper pin and tension calibrated. Re-inspected with zero defects.',
          resolved_by: 'Shop-Floor Supervisor',
        });

      expect(res.status).toBe(200);
      expect(res.body.inspection.status).toBe('Resolved');
      expect(res.body.inspection.resolution_note).toContain('Replaced broken dropper pin');
      expect(res.body.inspection.resolved_at).toBeTruthy();
      expect(res.body.inspection.resolved_by).toBe('Shop-Floor Supervisor');
    });
  });

  // 6. Summary Matrix & KPIs
  describe('Summary Matrix View', () => {
    it('GET /api/inspections/summary returns count matrix and KPIs', async () => {
      const res = await request(app).get('/api/inspections/summary');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('matrix');
      expect(res.body.matrix).toHaveProperty('Critical');
      expect(res.body.matrix).toHaveProperty('Major');
      expect(res.body.matrix).toHaveProperty('Minor');

      expect(res.body.matrix.Critical).toHaveProperty('open');
      expect(res.body.matrix.Critical).toHaveProperty('resolved');
      expect(res.body.matrix.Critical).toHaveProperty('total');

      expect(res.body).toHaveProperty('totals');
      expect(res.body.totals).toHaveProperty('grandTotal');
      expect(res.body.totals).toHaveProperty('resolutionRate');
      expect(res.body).toHaveProperty('defectBreakdown');
    });
  });

  // 7. Mock SAP QM Webhook Integration
  describe('Mock SAP QM Webhook (POST /api/sap-webhook)', () => {
    it('POST /api/sap-webhook successfully ingests SAP notification', async () => {
      const sapPayload = {
        NotificationNumber: 'QM-2026-TEST-991',
        Plant: '1001',
        WorkCenter: 'Loom-Airjet-55',
        DefectCode: 'WEAV01',
        DefectDescription: 'Reed mark streak observed on selvedge edge.',
        Severity: 'Critical',
        ReportedBy: 'SAP_QM_PLC_SENSOR',
      };

      const res = await request(app)
        .post('/api/sap-webhook')
        .send(sapPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.sapAcknowledgment.status).toBe('ACCEPTED');
      expect(res.body.sapAcknowledgment.notificationNumber).toBe('QM-2026-TEST-991');
      expect(res.body.inspection.machine_id).toBe('Loom-Airjet-55');
      expect(res.body.inspection.defect_type).toBe('Weave Defect');
      expect(res.body.inspection.severity).toBe('Critical');
      expect(res.body.inspection.source).toBe('SAP_QM');
    });

    it('POST /api/sap-webhook rejects invalid payload without work center', async () => {
      const invalidSap = {
        NotificationNumber: 'QM-2026-ERR',
        // WorkCenter missing
      };

      const res = await request(app)
        .post('/api/sap-webhook')
        .send(invalidSap);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Missing required WorkCenter');
    });
  });

  // 8. Offline Batch Sync
  describe('Offline Batch Synchronization', () => {
    it('POST /api/inspections/batch-sync syncs offline items idempotently', async () => {
      const batchPayload = [
        {
          id: 'LOCAL-TEST-001',
          client_sync_id: 'client-uuid-batch-001',
          date: new Date().toISOString(),
          plant: 'Plant Floor',
          machine_id: 'Stenter ST-09',
          defect_type: 'Hole/Tear',
          severity: 'Major',
          remarks: 'Offline recorded hole defect.',
        },
      ];

      const res = await request(app)
        .post('/api/inspections/batch-sync')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ inspections: batchPayload });

      expect(res.status).toBe(200);
      expect(res.body.syncedCount).toBe(1);

      // Verify idempotency on second call
      const res2 = await request(app)
        .post('/api/inspections/batch-sync')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ inspections: batchPayload });

      expect(res2.status).toBe(200);
      expect(res2.body.skippedCount).toBe(1);
    });
  });

  // 9. CSV Export
  describe('CSV Export', () => {
    it('GET /api/inspections/export returns CSV content', async () => {
      const res = await request(app).get('/api/inspections/export');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('ID,Date,Plant,Machine ID,Defect Type,Severity,Status');
    });
  });
});

