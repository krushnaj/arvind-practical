#!/usr/bin/env bash
# Arvind Limited - Mock SAP QM Webhook Ingestion Tester
# Usage: ./scripts/test-sap-webhook.sh [PORT]

PORT=${1:-3001}
ENDPOINT="http://localhost:${PORT}/api/sap-webhook"

echo "=========================================================="
echo "🏭 Testing Arvind Mock SAP QM Webhook on port ${PORT}..."
echo "📍 Target: ${ENDPOINT}"
echo "=========================================================="

# 1. Valid Critical Weave Defect from Airjet Loom
echo -e "\n1. Sending SAP QM Notification (Weave Defect - Critical)..."
curl -s -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{
    "NotificationNumber": "QM-2026-99014",
    "Plant": "1001",
    "PlantName": "Plant Floor",
    "DefectCode": "WEAV01",
    "DefectType": "Weave Defect",
    "DefectDescription": "Automatic warp tension loss triggered line sensor fault.",
    "Severity": "Critical",
    "ReportedBy": "SAP_QM_LOOM_GATEWAY",
    "BatchNumber": "LOT-CTN-2026-081",
    "Timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }' | jq . || cat

# 2. Valid Major Shade Variation from Continuous Dyeing Range
echo -e "\n2. Sending SAP QM Notification (Shade Variation - Major)..."
curl -s -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{
    "NotificationNumber": "QM-2026-99015",
    "Plant": "1001",
    "PlantName": "Plant Floor",
    "WorkCenter": "Indigo Range IDR-03",
    "Severity": "Major",
    "ReportedBy": "ONLINE_COLOR_SCANNER"
  }' | jq . || cat

echo -e "\n✅ SAP Webhook test calls completed."

