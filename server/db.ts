import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { CONFIG } from './config.js';

// Ensure data directory exists
const dataDir = path.dirname(CONFIG.DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize SQLite database connection
export const db = new Database(CONFIG.DB_PATH);

// Enable WAL mode and foreign keys for high performance & integrity
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  // 1. Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'supervisor',
      plant TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // 2. Inspections Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS inspections (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      plant TEXT NOT NULL,
      machine_id TEXT NOT NULL,
      defect_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Open',
      remarks TEXT,
      photo_url TEXT,
      source TEXT NOT NULL DEFAULT 'MANUAL',
      sap_notification_id TEXT,
      logged_by TEXT NOT NULL,
      resolution_note TEXT,
      resolved_by TEXT,
      resolved_at TEXT,
      client_sync_id TEXT UNIQUE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);
    CREATE INDEX IF NOT EXISTS idx_inspections_severity ON inspections(severity);
    CREATE INDEX IF NOT EXISTS idx_inspections_date ON inspections(date);
    CREATE INDEX IF NOT EXISTS idx_inspections_plant ON inspections(plant);
    CREATE INDEX IF NOT EXISTS idx_inspections_defect ON inspections(defect_type);
    CREATE INDEX IF NOT EXISTS idx_inspections_sync ON inspections(client_sync_id);
  `);

  // 3. SAP Integration Audit Logs Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sap_logs (
      id TEXT PRIMARY KEY,
      notification_number TEXT NOT NULL,
      plant TEXT,
      work_center TEXT,
      raw_payload TEXT NOT NULL,
      status TEXT NOT NULL,
      inspection_id TEXT,
      created_at TEXT NOT NULL
    );
  `);

  console.log('✅ Database tables initialized successfully at:', CONFIG.DB_PATH);
}

