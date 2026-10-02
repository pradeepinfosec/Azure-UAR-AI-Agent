#!/bin/bash
# FILE 5: 5. Fix Workspace Logs.sh
# Fixes the broken diagnostic setting for Log Analytics Workspace

export MSYS_NO_PATHCONV=1

SUBSCRIPTION_ID="efca2116-f6e1-430f-a854-27d4b4476efd"
LOCATION="southindia"
RG_NAME="UAR-Monitoring-RG"
LAW_NAME="UAR-Telemetry-Workspace"
DIAG_SETTING_NAME="UAR-Activity-Logs"

echo "Setting subscription context..."
az account set --subscription "$SUBSCRIPTION_ID"

echo "Retrieving Log Analytics Workspace ID..."
WORKSPACE_ID=$(az monitor log-analytics workspace show \
  --resource-group "$RG_NAME" \
  --workspace-name "$LAW_NAME" \
  --query id --output tsv)

if [ -z "$WORKSPACE_ID" ]; then
    echo "ERROR: Failed to retrieve Workspace ID. Exiting."
    exit 1
fi

echo "Creating Subscription Diagnostic Setting to route Activity Logs to Log Analytics Workspace..."
az monitor diagnostic-settings subscription create \
  --name "$DIAG_SETTING_NAME" \
  --workspace "$WORKSPACE_ID" \
  --location "$LOCATION" \
  --logs '[
    {"category": "Administrative", "enabled": true},
    {"category": "Security", "enabled": true},
    {"category": "Policy", "enabled": true}
  ]'

echo "======================================================"
echo "SUCCESS!"
echo "IAM (Activity) logs are now being routed to your Log Analytics Workspace."
echo "Note: It may take up to 15 minutes for the first logs to appear."
echo "======================================================"
