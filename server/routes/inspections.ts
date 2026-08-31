import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { CONFIG } from '../config.js';

export const inspectionsRouter = Router();

// 1. GET /api/inspections - Filterable & sortable list
inspectionsRouter.get('/', (req: Request, res: Response) => {
  try {
    const {
      status,
      severity,
      defect_type,
      plant,
      search,
      start_date,
      end_date,
      sort_by = 'date',
      sort_order = 'desc',
    } = req.query as Record<string, string | undefined>;

    let sql = 'SELECT * FROM inspections WHERE 1=1';
    const params: any[] = [];

    // Filter by Status (Open / Resolved)
    if (status && status !== 'all') {
      sql += ' AND LOWER(status) = LOWER(?)';
      params.push(status);
    }

    // Filter by Severity (Critical / Major / Minor)
    if (severity && severity !== 'all') {
      sql += ' AND LOWER(severity) = LOWER(?)';
      params.push(severity);
    }

    // Filter by Defect Type
    if (defect_type && defect_type !== 'all') {
      sql += ' AND LOWER(defect_type) = LOWER(?)';
      params.push(defect_type);
    }

    // Filter by Plant
    if (plant && plant !== 'all') {
      sql += ' AND plant = ?';
      params.push(plant);
    }

    // Filter by Date Range
    if (start_date) {
      sql += ' AND date(date) >= date(?)';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND date(date) <= date(?)';
      params.push(end_date);
    }

    // Free text search across machine ID, remarks, and resolution note
    if (search && search.trim() !== '') {
      sql += ' AND (machine_id LIKE ? OR remarks LIKE ? OR resolution_note LIKE ? OR logged_by LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    // Sorting
    let orderByClause = '';
    const validOrder = sort_order && sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    if (sort_by === 'severity') {
      // Custom severity ordering (Critical -> Major -> Minor)
      if (validOrder === 'ASC') {
        orderByClause = `ORDER BY CASE severity WHEN 'Minor' THEN 1 WHEN 'Major' THEN 2 WHEN 'Critical' THEN 3 ELSE 4 END ASC, created_at DESC`;
      } else {
        orderByClause = `ORDER BY CASE severity WHEN 'Critical' THEN 1 WHEN 'Major' THEN 2 WHEN 'Minor' THEN 3 ELSE 4 END ASC, created_at DESC`;
      }
    } else if (sort_by === 'machine_id') {
      orderByClause = `ORDER BY machine_id ${validOrder}, created_at DESC`;
    } else if (sort_by === 'status') {
      orderByClause = `ORDER BY status ${validOrder}, created_at DESC`;
    } else {
      // Default: sort by inspection date / created_at
      orderByClause = `ORDER BY date ${validOrder}, created_at ${validOrder}`;
    }

    sql += ` ${orderByClause}`;

    const items = db.prepare(sql).all(...params);
    res.json({
      total: items.length,
      inspections: items,
    });
  } catch (err: any) {
    console.error('Error fetching inspections:', err);
    res.status(500).json({ error: 'Failed to fetch inspections: ' + err.message });
  }
});

// 2. GET /api/inspections/summary - Summary count matrix and KPI metrics
inspectionsRouter.get('/summary', (req: Request, res: Response) => {
  try {
    const { plant, start_date, end_date } = req.query as Record<string, string | undefined>;

    let filterSql = 'WHERE 1=1';
    const params: any[] = [];

    if (plant && plant !== 'all') {
      filterSql += ' AND plant = ?';
      params.push(plant);
    }
    if (start_date) {
      filterSql += ' AND date(date) >= date(?)';
      params.push(start_date);
    }
    if (end_date) {
      filterSql += ' AND date(date) <= date(?)';
      params.push(end_date);
    }

    // 1. Matrix: Count of Open and Resolved inspections by severity
    const matrixSql = `
      SELECT 
        severity,
        status,
        COUNT(*) as count
      FROM inspections
      ${filterSql}
      GROUP BY severity, status
    `;
    const rawMatrix = db.prepare(matrixSql).all(...params) as { severity: string; status: string; count: number }[];

    // Structure into a standardized format
    const severities = ['Critical', 'Major', 'Minor'] as const;
    const matrix: Record<string, { open: number; resolved: number; total: number }> = {
      Critical: { open: 0, resolved: 0, total: 0 },
      Major: { open: 0, resolved: 0, total: 0 },
      Minor: { open: 0, resolved: 0, total: 0 },
    };

    let totalOpen = 0;
    let totalResolved = 0;
    let grandTotal = 0;

    rawMatrix.forEach(row => {
      const sev = row.severity as 'Critical' | 'Major' | 'Minor';
      if (matrix[sev]) {
        if (row.status.toLowerCase() === 'open') {
          matrix[sev].open += row.count;
          totalOpen += row.count;
        } else if (row.status.toLowerCase() === 'resolved') {
          matrix[sev].resolved += row.count;
          totalResolved += row.count;
        }
        matrix[sev].total += row.count;
        grandTotal += row.count;
      }
    });

    // 2. Today's count
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySql = `SELECT COUNT(*) as count FROM inspections WHERE date(date) = date(?)`;
    const todayRow = db.prepare(todaySql).get(todayStr) as { count: number };

    // 3. Breakdown by defect type
    const defectSql = `
      SELECT defect_type, COUNT(*) as count 
      FROM inspections 
      ${filterSql}
      GROUP BY defect_type 
      ORDER BY count DESC
    `;
    const defectBreakdown = db.prepare(defectSql).all(...params);

    // 4. Breakdown by Plant
    const plantSql = `
      SELECT plant, 
        SUM(CASE WHEN LOWER(status) = 'open' THEN 1 ELSE 0 END) as open_count,
        SUM(CASE WHEN LOWER(status) = 'resolved' THEN 1 ELSE 0 END) as resolved_count,
        COUNT(*) as total_count
      FROM inspections 
      GROUP BY plant 
      ORDER BY total_count DESC
    `;
    const plantBreakdown = db.prepare(plantSql).all();

    const resolutionRate = grandTotal > 0 ? Math.round((totalResolved / grandTotal) * 100) : 0;

    res.json({
      matrix,
      totals: {
        open: totalOpen,
        resolved: totalResolved,
        grandTotal,
        todayCount: todayRow?.count || 0,
        criticalOpen: matrix.Critical.open,
        resolutionRate,
      },
      defectBreakdown,
      plantBreakdown,
    });
  } catch (err: any) {
    console.error('Error generating summary:', err);
    res.status(500).json({ error: 'Failed to generate summary: ' + err.message });
  }
});

// 3. GET /api/inspections/export - CSV export
inspectionsRouter.get('/export', (req: Request, res: Response) => {
  try {
    const inspections = db.prepare('SELECT * FROM inspections ORDER BY date DESC').all() as any[];

    const headers = [
      'ID',
      'Date',
      'Plant',
      'Machine ID',
      'Defect Type',
      'Severity',
      'Status',
      'Remarks',
      'Logged By',
      'Source',
      'Resolution Note',
      'Resolved By',
      'Resolved At',
      'Created At',
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = inspections.map(i => [
      escapeCsv(i.id),
      escapeCsv(i.date),
      escapeCsv(i.plant),
      escapeCsv(i.machine_id),
      escapeCsv(i.defect_type),
      escapeCsv(i.severity),
      escapeCsv(i.status),
      escapeCsv(i.remarks),
      escapeCsv(i.logged_by),
      escapeCsv(i.source),
      escapeCsv(i.resolution_note),
      escapeCsv(i.resolved_by),
      escapeCsv(i.resolved_at),
      escapeCsv(i.created_at),
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="arvind_inspections_${Date.now()}.csv"`);
    res.send(csvContent);
  } catch (err: any) {
    console.error('Error exporting CSV:', err);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// 4. GET /api/inspections/:id - Get single inspection
inspectionsRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const inspection = db.prepare('SELECT * FROM inspections WHERE id = ?').get(req.params.id);
    if (!inspection) {
      return res.status(404).json({ error: 'Inspection record not found' });
    }
    res.json({ inspection });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch inspection: ' + err.message });
  }
});

// 5. POST /api/inspections - Log a new inspection
inspectionsRouter.post('/', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const {
      date,
      plant,
      machine_id,
      defect_type,
      severity,
      remarks,
      photo_url,
      client_sync_id,
    } = req.body;

    // Validation
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    if (!machine_id || !machine_id.trim()) {
      return res.status(400).json({ error: 'Machine/Line ID is required' });
    }
    if (!defect_type || !CONFIG.DEFECT_TYPES.includes(defect_type)) {
      return res.status(400).json({
        error: `Defect type is required and must be one of: ${CONFIG.DEFECT_TYPES.join(', ')}`,
      });
    }
    if (!severity || !CONFIG.SEVERITIES.includes(severity)) {
      return res.status(400).json({
        error: `Severity is required and must be one of: ${CONFIG.SEVERITIES.join(', ')}`,
      });
    }

    // Check for duplicate client_sync_id if provided
    if (client_sync_id) {
      const existing = db.prepare('SELECT * FROM inspections WHERE client_sync_id = ?').get(client_sync_id);
      if (existing) {
        return res.status(200).json({
          message: 'Inspection already synced',
          inspection: existing,
          isDuplicate: true,
        });
      }
    }

    const id = `INS-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();
    const loggedBy = req.user?.name || req.body.logged_by || 'Shop-Floor Supervisor';
    const targetPlant = plant || req.user?.plant || CONFIG.PLANTS[0];

    const stmt = db.prepare(`
      INSERT INTO inspections (
        id, date, plant, machine_id, defect_type, severity, status,
        remarks, photo_url, source, logged_by, client_sync_id,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      date,
      targetPlant,
      machine_id.trim(),
      defect_type,
      severity,
      'Open',
      remarks ? remarks.trim() : null,
      photo_url || null,
      req.body.source || 'MANUAL',
      loggedBy,
      client_sync_id || uuidv4(),
      now,
      now
    );

    const created = db.prepare('SELECT * FROM inspections WHERE id = ?').get(id);

    res.status(201).json({
      message: 'Inspection logged successfully',
      inspection: created,
    });
  } catch (err: any) {
    console.error('Error logging inspection:', err);
    res.status(500).json({ error: 'Failed to log inspection: ' + err.message });
  }
});

// 6. PATCH /api/inspections/:id/resolve - Mark inspection as Resolved with mandatory resolution note
inspectionsRouter.patch('/:id/resolve', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { resolution_note, resolved_by } = req.body;

    // Strict validation: Mandatory resolution note
    if (!resolution_note || !resolution_note.trim()) {
      return res.status(400).json({
        error: 'A mandatory resolution note is required to mark an inspection as Resolved.',
      });
    }

    const inspection = db.prepare('SELECT * FROM inspections WHERE id = ?').get(id) as any;
    if (!inspection) {
      return res.status(404).json({ error: 'Inspection record not found' });
    }

    const now = new Date().toISOString();
    const resolver = resolved_by || req.user?.name || 'Shop-Floor Supervisor';

    const stmt = db.prepare(`
      UPDATE inspections 
      SET 
        status = 'Resolved',
        resolution_note = ?,
        resolved_by = ?,
        resolved_at = ?,
        updated_at = ?
      WHERE id = ?
    `);

    stmt.run(resolution_note.trim(), resolver, now, now, id);

    const updated = db.prepare('SELECT * FROM inspections WHERE id = ?').get(id);

    res.json({
      message: 'Inspection marked as Resolved successfully',
      inspection: updated,
    });
  } catch (err: any) {
    console.error('Error resolving inspection:', err);
    res.status(500).json({ error: 'Failed to resolve inspection: ' + err.message });
  }
});

// 7. POST /api/inspections/batch-sync - Offline batch sync endpoint
inspectionsRouter.post('/batch-sync', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { inspections } = req.body;

    if (!Array.isArray(inspections) || inspections.length === 0) {
      return res.status(400).json({ error: 'Expected a non-empty array of inspections' });
    }

    const syncedItems: any[] = [];
    const skippedItems: any[] = [];
    const errors: any[] = [];

    const insertStmt = db.prepare(`
      INSERT INTO inspections (
        id, date, plant, machine_id, defect_type, severity, status,
        remarks, photo_url, source, logged_by, resolution_note,
        resolved_by, resolved_at, client_sync_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const updateResolutionStmt = db.prepare(`
      UPDATE inspections
      SET status = 'Resolved', resolution_note = ?, resolved_by = ?, resolved_at = ?, updated_at = ?
      WHERE id = ? OR client_sync_id = ?
    `);

    const syncTransaction = db.transaction((items: any[]) => {
      for (const item of items) {
        try {
          // If this is an offline resolution update
          if (item.action === 'resolve' && (item.id || item.client_sync_id)) {
            if (item.resolution_note && item.resolution_note.trim()) {
              updateResolutionStmt.run(
                item.resolution_note.trim(),
                item.resolved_by || req.user?.name || 'Shop-Floor Supervisor',
                item.resolved_at || new Date().toISOString(),
                new Date().toISOString(),
                item.id || null,
                item.client_sync_id || null
              );
              syncedItems.push({ id: item.id, action: 'resolve', status: 'synced' });
            }
            continue;
          }

          // Otherwise it's a new inspection record
          const syncId = item.client_sync_id || uuidv4();
          const existing = db.prepare('SELECT id FROM inspections WHERE client_sync_id = ?').get(syncId);
          if (existing) {
            skippedItems.push({ client_sync_id: syncId, reason: 'Already synced' });
            continue;
          }

          const id = item.id || `INS-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
          const now = new Date().toISOString();
          const createdAt = item.created_at || now;

          insertStmt.run(
            id,
            item.date || now,
            item.plant || req.user?.plant || CONFIG.PLANTS[0],
            item.machine_id ? item.machine_id.trim() : 'Unknown Machine',
            item.defect_type || 'Other',
            item.severity || 'Minor',
            item.status || 'Open',
            item.remarks ? item.remarks.trim() : null,
            item.photo_url || null,
            'OFFLINE_SYNC',
            item.logged_by || req.user?.name || 'Shop-Floor Supervisor',
            item.resolution_note || null,
            item.resolved_by || null,
            item.resolved_at || null,
            syncId,
            createdAt,
            now
          );

          syncedItems.push({ id, client_sync_id: syncId, status: 'synced' });
        } catch (itemErr: any) {
          errors.push({ item, error: itemErr.message });
        }
      }
    });

    syncTransaction(inspections);

    res.json({
      message: 'Batch sync complete',
      syncedCount: syncedItems.length,
      skippedCount: skippedItems.length,
      errorCount: errors.length,
      syncedItems,
      skippedItems,
      errors,
    });
  } catch (err: any) {
    console.error('Error during batch sync:', err);
    res.status(500).json({ error: 'Batch sync failed: ' + err.message });
  }
});

// 8. DELETE /api/inspections/:id - Delete an inspection (Admin/Supervisor)
inspectionsRouter.delete('/:id', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT id FROM inspections WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    db.prepare('DELETE FROM inspections WHERE id = ?').run(id);
    res.json({ message: 'Inspection deleted successfully', id });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete inspection: ' + err.message });
  }
});

