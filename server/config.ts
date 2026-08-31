import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const projectRoot = process.cwd();

export const CONFIG = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'arvind-fabrics-secret-quality-key-2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  DB_PATH: process.env.DB_PATH || path.resolve(projectRoot, 'data/inspections.db'),
  UPLOAD_DIR: process.env.UPLOAD_DIR || path.resolve(projectRoot, 'uploads'),
  PLANTS: ['Plant Floor'] as const,
  DEFAULT_PLANT: 'Plant Floor',
  DEFECT_TYPES: [
    'Weave Defect',
    'Shade Variation',
    'Hole/Tear',
    'Count Deviation',
    'Other',
  ] as const,
  SEVERITIES: ['Critical', 'Major', 'Minor'] as const,
  STATUSES: ['Open', 'Resolved'] as const,
};

