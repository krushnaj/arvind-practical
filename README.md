# Arvind Limited — Quality Inspection Tracker

> **Shop-Floor Quality Defect Logging, Tracking, and Resolution Web Application**

---

## Overview

This **Quality Inspection Tracker** is a mobile-first web application designed for shop-floor supervisors to log, track, and resolve textile manufacturing quality defects directly on mobile phone browsers (tested at 390px viewport width). It replaces physical paper registers with zero-latency digital logging, an offline auto-sync queue, a mock SAP QM/PM webhook ingestion pipeline, and a real-time status matrix by defect severity.

---

## Setup Steps (< 2 Minutes)

### Option 1: Run Locally via npm

#### Prerequisites
- Node.js 18+ and npm installed

```bash
# 1. Install root & client dependencies
npm install && npm --prefix client install

# 2. Seed database with initial shop-floor defect records
npm run seed

# 3. Start the application (Server on :3001, Vite Client on :5173 or :3001)
npm run dev
```

- **Mobile Web App**: Open [http://localhost:5173](http://localhost:5173) (or [http://localhost:3001](http://localhost:3001) for production build)
- **API Health Endpoint**: [http://localhost:3001/api/health](http://localhost:3001/api/health)

---

### Option 2: Run with Docker Compose

```bash
# Build and launch multi-stage container
docker compose up --build -d

# View live server logs
docker compose logs -f
```

Access the app at: **http://localhost:3001**

---

### Running Automated Tests

Run the complete Vitest + Supertest integration test suite (19 tests covering Auth, CRUD, Filtering, Mandatory Resolution Notes, SAP Webhook Ingestion, and Batch Sync):

```bash
npm test
```

## What I Would Do Differently With More Time

1. **Real-Time WebSocket / SSE Push Stream**:
   Replace the current client-side polling with Server-Sent Events (SSE) or WebSockets so newly triggered SAP QM machine alerts and supervisor resolutions appear on all connected mobile screens in real time without manual refresh.

2. **On-Device Defect Photo Compression & Offline IndexedDB Storage**:
   Implement client-side Canvas/WebWorker image compression and store binary photo attachments in browser `IndexedDB` when offline, automatically uploading them in the background once network connectivity is restored.

3. **Role-Based Action Permissions (RBAC)**:
   Add granular permission guards where standard shift supervisors can log defects and apply routine operational fixes, but closing `Critical` line-stop defects requires digital sign-off from a Quality Manager.

4. **AI-Powered Root-Cause & Corrective Action Suggestions**:
   Integrate a lightweight on-device or edge LLM prompt engine that analyzes the machine ID, defect type, and historical remediation logs to automatically recommend the top 3 most likely root causes and corrective steps to the supervisor.

5. **Progressive Web App (PWA) Installability**:
   Add a Web App Manifest and Service Worker with `CacheFirst` asset caching to enable shopfloor supervisors to install the app as a standalone icon on Android/iOS home screens and operate fully offline across browser restarts.

---

## Mock SAP QM Webhook Specification

### Endpoint: `POST /api/sap-webhook`

#### Sample Payload
```json
{
  "NotificationNumber": "QM-2026-95140",
  "Plant": "1001",
  "PlantName": "Plant Floor",
  "WorkCenter": "Airjet Loom AJ-31",
  "DefectCode": "WEAV01",
  "DefectDescription": "Warp tension drop causing loose ends and repeated reed marks.",
  "Severity": "Critical",
  "ReportedBy": "SAP_QM_LOOM_GATEWAY",
  "BatchNumber": "LOT-SATIN-8891",
  "Timestamp": "2026-08-31T07:30:00Z"
}
```

#### Test via Script
```bash
./scripts/test-sap-webhook.sh
```

---

## Summary Matrix API

### Endpoint: `GET /api/inspections/summary`

Returns exact count breakdown of Open and Resolved inspections by severity level:

```json
{
  "matrix": {
    "Critical": { "open": 2, "resolved": 2, "total": 4 },
    "Major": { "open": 1, "resolved": 2, "total": 3 },
    "Minor": { "open": 2, "resolved": 0, "total": 2 }
  },
  "totals": {
    "open": 5,
    "resolved": 4,
    "grandTotal": 9,
    "todayCount": 4,
    "criticalOpen": 2,
    "resolutionRate": 44
  },
  "defectBreakdown": [
    { "defect_type": "Weave Defect", "count": 3 },
    { "defect_type": "Shade Variation", "count": 2 },
    { "defect_type": "Hole/Tear", "count": 2 },
    { "defect_type": "Count Deviation", "count": 1 },
    { "defect_type": "Other", "count": 1 }
  ]
}
```
