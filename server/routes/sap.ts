import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { CONFIG } from '../config.js';

export const sapRouter = Router();

/**
 * Expected SAP QM Webhook Payload Specification:
 * {
 *   "NotificationNumber": "QM-2026-98432",   // SAP QM Notification / PM Order No
 *   "Plant": "1001",                         // SAP Plant Code (e.g. 1001: Santej, 1002: Naroda, 1003: Khatraj, 1004: Kolhapur)
 *   "PlantName": "Santej Unit 1",            // Optional Human Readable Plant
 *   "WorkCenter": "LOOM-AIRJET-014",         // Machine / Work Center ID
 *   "DefectCode": "WEAV01",                  // SAP Defect Code (WEAV01, SHAD02, HOLE03, CNT04, OTH99)
 *   "DefectDescription": "Broken warp end creating warp streak",
 *   "DefectType": "Weave Defect",            // Optional explicit defect type
 *   "Severity": "Critical",                  // Critical | Major | Minor or 1 | 2 | 3
 *   "ReportedBy": "SAP_QM_AUTO_INTERFACE",
 *   "BatchNumber": "LOT-CTN-202608-44",      // Optional Fabric/Yarn Batch
 *   "Timestamp": "2026-08-31T06:30:00Z"      // ISO 8601 Timestamp
 * }
 */

// Mapping SAP Defect Codes to Internal Defect Types
function mapSapDefectType(defectCode?: string, explicitType?: string): typeof CONFIG.DEFECT_TYPES[number] {
  if (explicitType && (CONFIG.DEFECT_TYPES as readonly string[]).includes(explicitType)) {
    return explicitType as typeof CONFIG.DEFECT_TYPES[number];
  }

  const code = (defectCode || '').toUpperCase().trim();
  if (code.includes('WEAV') || code === 'DEF_01' || code === 'QM_WV') return 'Weave Defect';
  if (code.includes('SHAD') || code.includes('DYE') || code.includes('COLOR') || code === 'DEF_02') return 'Shade Variation';
  if (code.includes('HOLE') || code.includes('TEAR') || code.includes('CUT') || code === 'DEF_03') return 'Hole/Tear';
  if (code.includes('CNT') || code.includes('COUNT') || code.includes('GSM') || code === 'DEF_04') return 'Count Deviation';
  return 'Other';
}

// Mapping SAP Severity to Internal Severity
function mapSapSeverity(severity?: string | number): typeof CONFIG.SEVERITIES[number] {
  if (typeof severity === 'number') {
    if (severity === 1) return 'Critical';
    if (severity === 2) return 'Major';
    return 'Minor';
  }

  const sev = (severity || '').toUpperCase().trim();
  if (sev.startsWith('CRIT') || sev === '1' || sev === 'HIGH') return 'Critical';
  if (sev.startsWith('MAJ') || sev === '2' || sev === 'MED') return 'Major';
  return 'Minor';
}

// Mapping SAP Plant Codes (Single local plant)
function mapSapPlant(plantCode?: string, plantName?: string): string {
  return CONFIG.DEFAULT_PLANT || 'Plant Floor';
}

// POST /api/sap-webhook
sapRouter.post('/sap-webhook', (req: Request, res: Response) => {
  const logId = `SAPLOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const receivedAt = new Date().toISOString();

  try {
    const payload = req.body;

    // Validate payload existence
    if (!payload || typeof payload !== 'object' || Object.keys(payload).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid SAP payload: Request body must be a non-empty JSON object.',
        expectedSchema: {
          NotificationNumber: 'string (required, e.g. QM-2026-00123)',
          WorkCenter: 'string (required, e.g. Loom-14 / Stenter-02)',
          DefectCode: 'string (optional, e.g. WEAV01, SHAD02, HOLE03, CNT04, OTH99)',
          DefectType: 'Weave Defect | Shade Variation | Hole/Tear | Count Deviation | Other',
          Severity: 'Critical | Major | Minor | 1 | 2 | 3',
          Plant: 'string (optional plant code, e.g. 1001, 1002)',
          DefectDescription: 'string (optional remarks / description)',
          ReportedBy: 'string (optional, defaults to SAP QM Interface)',
          Timestamp: 'ISO 8601 string (optional, defaults to current time)',
        },
      });
    }

    const notificationNumber = payload.NotificationNumber || payload.notification_number || payload.qmnum || `QM-${Date.now()}`;
    const workCenter = payload.WorkCenter || payload.work_center || payload.machine_id || payload.equipment || payload.arbpl;
    const defectDescription = payload.DefectDescription || payload.description || payload.defect_description || payload.remarks || '';
    const rawSeverity = payload.Severity || payload.severity || payload.priok;
    const rawDefectCode = payload.DefectCode || payload.defect_code || payload.fegrp;
    const rawDefectType = payload.DefectType || payload.defect_type;
    const plantCode = payload.Plant || payload.plant || payload.werks;
    const plantName = payload.PlantName || payload.plant_name;
    const reportedBy = payload.ReportedBy || payload.reported_by || 'SAP QM System Interface';
    const timestamp = payload.Timestamp || payload.timestamp || payload.erdat || receivedAt;

    if (!workCenter) {
      // Log failed attempt
      db.prepare(`
        INSERT INTO sap_logs (id, notification_number, plant, work_center, raw_payload, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(logId, notificationNumber, plantCode || null, null, JSON.stringify(payload), 'FAILED_VALIDATION', receivedAt);

      return res.status(422).json({
        success: false,
        error: 'Missing required WorkCenter / Machine ID in SAP QM payload.',
      });
    }

    // Map to normalized inspection record
    const internalDefectType = mapSapDefectType(rawDefectCode, rawDefectType);
    const internalSeverity = mapSapSeverity(rawSeverity);
    const targetPlant = mapSapPlant(plantCode, plantName);
    const inspectionId = `INS-SAP-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const remarksText = [
      defectDescription,
      payload.BatchNumber ? `Batch/Lot: ${payload.BatchNumber}` : '',
      `[SAP QM Ref: ${notificationNumber}]`,
    ].filter(Boolean).join(' | ');

    // Insert into inspections table
    const insertStmt = db.prepare(`
      INSERT INTO inspections (
        id, date, plant, machine_id, defect_type, severity, status,
        remarks, source, sap_notification_id, logged_by,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      inspectionId,
      timestamp,
      targetPlant,
      workCenter.toString().trim(),
      internalDefectType,
      internalSeverity,
      'Open',
      remarksText,
      'SAP_QM',
      notificationNumber,
      `SAP QM (${reportedBy})`,
      receivedAt,
      receivedAt
    );

    // Record audit log
    db.prepare(`
      INSERT INTO sap_logs (id, notification_number, plant, work_center, raw_payload, status, inspection_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(logId, notificationNumber, targetPlant, workCenter, JSON.stringify(payload), 'PROCESSED_SUCCESS', inspectionId, receivedAt);

    const createdRecord = db.prepare('SELECT * FROM inspections WHERE id = ?').get(inspectionId);

    res.status(201).json({
      success: true,
      message: 'SAP QM Notification received and inspection created successfully',
      sapAcknowledgment: {
        status: 'ACCEPTED',
        notificationNumber,
        inspectionId,
        receivedAt,
      },
      inspection: createdRecord,
    });
  } catch (err: any) {
    console.error('Error processing SAP Webhook:', err);

    db.prepare(`
      INSERT INTO sap_logs (id, notification_number, raw_payload, status, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(logId, 'UNKNOWN', JSON.stringify(req.body || {}), 'INTERNAL_ERROR', receivedAt);

    res.status(500).json({
      success: false,
      error: 'Failed to process SAP QM webhook: ' + err.message,
    });
  }
});

// GET /api/sap-logs - Retrieve SAP webhook incoming audit logs
sapRouter.get('/sap-logs', (req: Request, res: Response) => {
  try {
    const logs = db.prepare('SELECT * FROM sap_logs ORDER BY created_at DESC LIMIT 50').all();
    res.json({ logs });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch SAP audit logs' });
  }
});

