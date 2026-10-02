#!/bin/bash
# FILE 4: 4. Configure Storage Logs.sh
# Provisions an Azure Storage Account and routes Subscription Activity Logs (IAM logs) to it.

# PREVENT GIT BASH PATH CONVERSION ERRORS ON WINDOWS
export MSYS_NO_PATHCONV=1

# ==========================================
# CONFIGURATION VARIABLES
# ==========================================
SUBSCRIPTION_ID="efca2116-f6e1-430f-a854-27d4b4476efd"
LOCATION="southindia"
RG_NAME="UAR-Monitoring-RG"
# Storage Account names must be between 3 and 24 characters in length and may contain numbers and lowercase letters only.
SA_NAME="uarlogarchive${RANDOM}"
DIAG_SETTING_NAME="UAR-Activity-Logs-SA"
# ==========================================

echo "Setting subscription context..."
az account set --subscription "$SUBSCRIPTION_ID"

echo "Creating Storage Account: $SA_NAME in $RG_NAME..."
az storage account create \
  --name "$SA_NAME" \
  --resource-group "$RG_NAME" \
  --location "$LOCATION" \
  --sku Standard_LRS \
  --kind StorageV2 \
  --allow-blob-public-access false

echo "Retrieving Storage Account ID..."
SA_ID=$(az storage account show --name "$SA_NAME" --resource-group "$RG_NAME" --query id --output tsv)

if [ -z "$SA_ID" ]; then
    echo "ERROR: Failed to retrieve Storage Account ID. Exiting."
    exit 1
fi

echo "Registering Microsoft.Insights resource provider (this may take a minute if not already registered)..."
az provider register --namespace Microsoft.Insights --wait

echo "Creating Subscription Diagnostic Setting to route Activity Logs to Storage Account..."
az monitor diagnostic-settings subscription create \
  --name "$DIAG_SETTING_NAME" \
  --storage-account "$SA_ID" \
  --location "$LOCATION" \
  --logs '[
    {"category": "Administrative", "enabled": true},
    {"category": "Security", "enabled": true},
    {"category": "Policy", "enabled": true}
  ]'

echo "======================================================"
echo "SUCCESS!"
echo "Storage Account Name: $SA_NAME"
echo "IAM (Activity) logs are now being routed to this Storage Account."
echo "Note: It may take up to 15 minutes for the first logs to appear."
echo "======================================================"
