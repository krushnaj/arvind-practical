import bcrypt from 'bcryptjs';
import { db, initDatabase } from './db.js';
import { CONFIG } from './config.js';

export function seedData() {
  initDatabase();

  // Clear existing data for fresh seed
  db.exec('DELETE FROM users');
  db.exec('DELETE FROM inspections');
  db.exec('DELETE FROM sap_logs');

  console.log('🌱 Seeding users...');
  const passwordHash = bcrypt.hashSync('arvind123', 10);

  const insertUser = db.prepare(`
    INSERT INTO users (id, username, password_hash, name, role, plant, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const users = [
    {
      id: 'usr_001',
      username: 'supervisor',
      name: 'Shop-Floor Supervisor',
      role: 'supervisor',
      plant: 'Plant Floor',
    },
    {
      id: 'usr_002',
      username: 'manager',
      name: 'Quality Manager',
      role: 'manager',
      plant: 'Plant Floor',
    },
    {
      id: 'usr_003',
      username: 'admin',
      name: 'Plant Admin',
      role: 'admin',
      plant: 'Plant Floor',
    },
  ];

  const now = new Date();
  for (const u of users) {
    insertUser.run(u.id, u.username, passwordHash, u.name, u.role, u.plant, now.toISOString());
  }

  console.log('🌱 Seeding sample quality inspections...');

  const insertInspection = db.prepare(`
    INSERT INTO inspections (
      id, date, plant, machine_id, defect_type, severity, status,
      remarks, photo_url, source, sap_notification_id, logged_by,
      resolution_note, resolved_by, resolved_at, client_sync_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sampleInspections = [
    {
      id: 'INS-2026-001',
      date: new Date(now.getTime() - 1000 * 60 * 35).toISOString(), // 35 mins ago
      plant: 'Plant Floor',
      machine_id: 'Airjet Loom AJ-14',
      defect_type: 'Weave Defect',
      severity: 'Critical',
      status: 'Open',
      remarks: 'Severe warp breakage leading to double pick & reed streak on 120m cotton twill roll. Loom stopped for realignment.',
      photo_url: null,
      source: 'MANUAL',
      sap_notification_id: null,
      logged_by: 'Shop-Floor Supervisor',
      resolution_note: null,
      resolved_by: null,
      resolved_at: null,
      client_sync_id: 'sync-001',
    },
    {
      id: 'INS-2026-002',
      date: new Date(now.getTime() - 1000 * 60 * 120).toISOString(), // 2 hours ago
      plant: 'Plant Floor',
      machine_id: 'Indigo Dye Range IDR-02',
      defect_type: 'Shade Variation',
      severity: 'Major',
      status: 'Open',
      remarks: 'Selvedge-to-center shade difference (Delta E = 1.95) exceeding 1.2 threshold in lot #DNM-882.',
      photo_url: null,
      source: 'MANUAL',
      sap_notification_id: null,
      logged_by: 'Quality Manager',
      resolution_note: null,
      resolved_by: null,
      resolved_at: null,
      client_sync_id: 'sync-002',
    },
    {
      id: 'INS-2026-003',
      date: new Date(now.getTime() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
      plant: 'Plant Floor',
      machine_id: 'Stenter ST-03',
      defect_type: 'Hole/Tear',
      severity: 'Critical',
      status: 'Resolved',
      remarks: 'Pin bar tear along right selvedge across 45 meters during heat-setting pass.',
      photo_url: null,
      source: 'MANUAL',
      sap_notification_id: null,
      logged_by: 'Shop-Floor Supervisor',
      resolution_note: 'Replaced damaged pin plates on left rail #3, recalibrated overfeed angle to 15%, and re-inspected 350m lot. Zero tears observed.',
      resolved_by: 'Shop-Floor Supervisor',
      resolved_at: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
      client_sync_id: 'sync-003',
    },
    {
      id: 'INS-2026-004',
      date: new Date(now.getTime() - 1000 * 60 * 60 * 18).toISOString(), // Yesterday
      plant: 'Plant Floor',
      machine_id: 'Ring Frame RF-08',
      defect_type: 'Count Deviation',
      severity: 'Major',
      status: 'Resolved',
      remarks: 'Yarn count tested 27.4s Ne against target 30s Ne (deviation > 8%).',
      photo_url: null,
      source: 'MANUAL',
      sap_notification_id: null,
      logged_by: 'Shop-Floor Supervisor',
      resolution_note: 'Adjusted draft gear ratio on RF-08 from 38T to 41T and verified roving bobbin tension. Subsequent QA lab testing confirmed 30.1s Ne.',
      resolved_by: 'Quality Manager',
      resolved_at: new Date(now.getTime() - 1000 * 60 * 60 * 12).toISOString(),
      client_sync_id: 'sync-004',
    },
    {
      id: 'INS-2026-005',
      date: new Date(now.getTime() - 1000 * 60 * 60 * 26).toISOString(), // Yesterday
      plant: 'Plant Floor',
      machine_id: 'Inspection Table IT-04',
      defect_type: 'Other',
      severity: 'Minor',
      status: 'Open',
      remarks: 'Minor oil spots caused by overhead pneumatic line lubricant leak over cutting table.',
      photo_url: null,
      source: 'MANUAL',
      sap_notification_id: null,
      logged_by: 'Plant Admin',
      resolution_note: null,
      resolved_by: null,
      resolved_at: null,
      client_sync_id: 'sync-005',
    },
    {
      id: 'INS-2026-006',
      date: new Date(now.getTime() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
      plant: 'Plant Floor',
      machine_id: 'Sulzer Rapier R-11',
      defect_type: 'Weave Defect',
      severity: 'Major',
      status: 'Resolved',
      remarks: 'Slub defect and weft mispick detected every 4 meters on fine voile cloth.',
      photo_url: null,
      source: 'MANUAL',
      sap_notification_id: null,
      logged_by: 'Shop-Floor Supervisor',
      resolution_note: 'Cleaned yarn gripper teeth, adjusted accumulator tension, and replaced defective yarn sensor on channel 2.',
      resolved_by: 'Shop-Floor Supervisor',
      resolved_at: new Date(now.getTime() - 1000 * 60 * 60 * 40).toISOString(),
      client_sync_id: 'sync-006',
    },
    {
      id: 'INS-2026-007',
      date: new Date(now.getTime() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
      plant: 'Plant Floor',
      machine_id: 'Sanforizing Machine SF-01',
      defect_type: 'Hole/Tear',
      severity: 'Minor',
      status: 'Open',
      remarks: 'Small selvedge fraying and hairline tear at 180m mark due to rubber blanket tension.',
      photo_url: null,
      source: 'MANUAL',
      sap_notification_id: null,
      logged_by: 'Shop-Floor Supervisor',
      resolution_note: null,
      resolved_by: null,
      resolved_at: null,
      client_sync_id: 'sync-007',
    },
    {
      id: 'INS-2026-008',
      date: new Date(now.getTime() - 1000 * 60 * 60 * 96).toISOString(), // 4 days ago
      plant: 'Plant Floor',
      machine_id: 'Warp Mercerizer WM-02',
      defect_type: 'Shade Variation',
      severity: 'Critical',
      status: 'Resolved',
      remarks: 'Caustic soda concentration fluctuation causing patchy dye uptake in Batch #MR-202.',
      photo_url: null,
      source: 'SAP_QM',
      sap_notification_id: 'QM-2026-90411',
      logged_by: 'SAP QM (SAP_QM_AUTO_INTERFACE)',
      resolution_note: 'Recalibrated automatic caustic dosing valve controller and flushed dosing lines. Re-tested Baumé degree at 28° Bé. Passed audit.',
      resolved_by: 'Quality Manager',
      resolved_at: new Date(now.getTime() - 1000 * 60 * 60 * 80).toISOString(),
      client_sync_id: 'sync-008',
    },
  ];

  for (const item of sampleInspections) {
    insertInspection.run(
      item.id,
      item.date,
      item.plant,
      item.machine_id,
      item.defect_type,
      item.severity,
      item.status,
      item.remarks,
      item.photo_url,
      item.source,
      item.sap_notification_id,
      item.logged_by,
      item.resolution_note,
      item.resolved_by,
      item.resolved_at,
      item.client_sync_id,
      item.date,
      item.resolved_at || item.date
    );
  }

  console.log(`✅ Seeded ${users.length} users and ${sampleInspections.length} inspections successfully.`);
}

// If run directly via tsx
if (process.argv[1]?.endsWith('seed.ts')) {
  seedData();
  process.exit(0);
}

