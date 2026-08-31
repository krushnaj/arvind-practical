import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { CONFIG } from './config.js';
import { initDatabase, db } from './db.js';
import { seedData } from './seed.js';
import { authRouter } from './routes/auth.js';
import { inspectionsRouter } from './routes/inspections.js';
import { sapRouter } from './routes/sap.js';
import { uploadRouter } from './routes/upload.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static uploads serving
if (!fs.existsSync(CONFIG.UPLOAD_DIR)) {
  fs.mkdirSync(CONFIG.UPLOAD_DIR, { recursive: true });
}
app.use('/uploads', express.static(CONFIG.UPLOAD_DIR));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    company: 'Arvind Limited - Fabric Manufacturing',
    app: 'Quality Inspection Tracker',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Mount API routes
app.use('/api/auth', authRouter);
app.use('/api/inspections', inspectionsRouter);
app.use('/api', sapRouter); // Provides /api/sap-webhook and /api/sap-logs
app.use('/api/upload', uploadRouter);

// Serve client in production build
const clientDistPath = path.resolve(process.cwd(), 'client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  // SPA fallback middleware (Express 5 compatible)
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      return res.sendFile(path.join(clientDistPath, 'index.html'));
    }
    next();
  });
}

// Error handling middleware
app.use(errorHandler);

// Database initialization and auto-seed if empty
initDatabase();
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
if (userCount.count === 0) {
  console.log('🔄 First run detected. Seeding initial Arvind plant data...');
  seedData();
}

// Start HTTP Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(CONFIG.PORT, '0.0.0.0', () => {
    console.log(`
  ======================================================
  🏭 ARVIND LIMITED | Quality Inspection Tracker API
  📍 Server running on: http://localhost:${CONFIG.PORT}
  📡 Mock SAP Webhook:  http://localhost:${CONFIG.PORT}/api/sap-webhook
  📊 SQLite Database:   ${CONFIG.DB_PATH}
  📱 Mobile UI Viewport: 390px Optimized
  ======================================================
    `);
  });
}

export { app };

