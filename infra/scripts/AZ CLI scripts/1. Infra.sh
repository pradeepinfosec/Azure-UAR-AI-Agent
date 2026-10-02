#!/bin/bash
# FILE 1: 01_provision_infrastructure.sh
# Combines: Telemetry Infrastructure, Activity Logs, App Registration, and RBAC Assignments

# PREVENT GIT BASH PATH CONVERSION ERRORS ON WINDOWS
export MSYS_NO_PATHCONV=1

# ==========================================
# CONFIGURATION VARIABLES
# ==========================================

SUBSCRIPTION_ID="efca2116-f6e1-430f-a854-27d4b4476efd"
APPLICATION_ID="db0ae769-454f-4248-a185-541b447a9ae5"
OBJECT_ID="f43580a6-ed17-4513-9754-713c01ad6e44"
TENANT_ID="c8b2f43e-f8d3-4e4e-9649-16c0c555f1ad"
CLIENT_SECRET="insertsecrethere"

LOCATION="southindia"
RG_NAME="UAR-Monitoring-RG"
LAW_NAME="UAR-Telemetry-Workspace"
RETENTION_DAYS="90"
DIAG_SETTING_NAME="UAR-Activity-Logs"
APP_DISPLAY_NAME="UAR-Agent-SP"
SECRET_DISPLAY_NAME="UAR-Agent-Secret"
SECRET_DURATION_YEARS="1"
GRAPH_API_ID="00000003-0000-0000-c000-000000000000"
GRAPH_DIR_READ_ROLE="7ab1d382-f21e-4acd-a863-ba3e13f7babd"
# ==========================================

# 1. Set Subscription
az account set --subscription "$SUBSCRIPTION_ID"

# 2. Provision Telemetry Infrastructure
az group create --name "$RG_NAME" --location "$LOCATION"

az monitor log-analytics workspace create \
  --resource-group "$RG_NAME" \
  --workspace-name "$LAW_NAME" \
  --retention-time "$RETENTION_DAYS"

WORKSPACE_ID=$(az monitor log-analytics workspace show \
  --resource-group "$RG_NAME" \
  --workspace-name "$LAW_NAME" \
  --query id --output tsv)

# 3. Route Subscription Activity Logs
az monitor diagnostic-settings subscription create \
  --name "$DIAG_SETTING_NAME" \
  --workspace "$WORKSPACE_ID" \
  --location "$LOCATION" \
  --logs '[
    {"category": "Administrative", "enabled": true},
    {"category": "Security", "enabled": true},
    {"category": "Policy", "enabled": true}
  ]'

# 4. Register the Entra ID Service Principal
APP_ID=$(az ad app create --display-name "$APP_DISPLAY_NAME" --query appId --output tsv)

# Safely retrieve or create the Service Principal to prevent empty assignee errors
SP_ID=$(az ad sp show --id "$APP_ID" --query id --output tsv 2>/dev/null)

if [ -z "$SP_ID" ]; then
    echo "Service Principal not found. Creating..."
    SP_ID=$(az ad sp create --id "$APP_ID" --query id --output tsv)
    echo "Waiting 15 seconds for Entra ID replication..."
    sleep 15
fi

echo "--- SAVE THIS CLIENT SECRET ---"
az ad app credential reset \
  --id "$APP_ID" \
  --append \
  --display-name "$SECRET_DISPLAY_NAME" \
  --years "$SECRET_DURATION_YEARS" \
  --query password \
  --output tsv
echo "-------------------------------"

# 5. Grant API Permissions and RBAC Roles
az ad app permission add \
  --id "$APP_ID" \
  --api "$GRAPH_API_ID" \
  --api-permissions "$GRAPH_DIR_READ_ROLE=Role"

# Grant admin consent (Requires Global Admin privileges)
echo "Attempting to grant admin consent..."
az ad app permission admin-consent --id "$APP_ID" || echo "WARNING: Admin consent failed. Please grant it manually in the Azure Portal under App Registrations > API Permissions."

az role assignment create \
  --assignee "$SP_ID" \
  --role "Log Analytics Reader" \
  --scope "/subscriptions/$SUBSCRIPTION_ID"

az role assignment create \
  --assignee "$SP_ID" \
  --role "Role Based Access Control Administrator" \
  --scope "/subscriptions/$SUBSCRIPTION_ID"