#!/bin/bash
# FILE 2: 02_simulate_vulnerabilities.sh
# Simulates MITRE ATT&CK vulnerable IAM configurations

# PREVENT GIT BASH PATH CONVERSION ERRORS ON WINDOWS
export MSYS_NO_PATHCONV=1

# ==========================================
# CONFIGURATION VARIABLES
# ==========================================
SUBSCRIPTION_ID="efca2116-f6e1-430f-a854-27d4b4476efd"
DOMAIN="anjalibhagigmail.onmicrosoft.com"
TEMP_PASSWORD="Reva_Pass@123$%^"
LOCATION="southindia"
SIM_RG_NAME="UAR-Sim-RG"
# ==========================================

az account set --subscription "$SUBSCRIPTION_ID"

# Create a dedicated Resource Group for scoped testing
az group create --name "$SIM_RG_NAME" --location "$LOCATION"
RG_SCOPE="/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$SIM_RG_NAME"

# Define 25 users with different use cases (Format: DisplayName|UPNPrefix|Role)
USERS=(
  "HR-Manager|hr.manager|Reader"
  "Data-Scientist|data.scientist|Storage Blob Data Reader"
  "DevOps-Eng|devops.eng|Contributor"
  "Sec-Admin|sec.admin|Security Admin"
  "Net-Admin|net.admin|Network Contributor"
  "DB-Admin|db.admin|SQL DB Contributor"
  "Cloud-Arch|cloud.arch|Owner"
  "QA-Tester|qa.tester|Virtual Machine Contributor"
  "Billing-Admin|billing.admin|Billing Reader"
  "App-Dev|app.dev|App Service Contributor"
  "Helpdesk|helpdesk|User Access Administrator"
  "Ext-Auditor|ext.auditor|Reader"
  "Backup-Admin|backup.admin|Backup Contributor"
  "Monitor-Op|monitor.op|Monitoring Reader"
  "IAM-Admin|iam.admin|Role Based Access Control Administrator"
  "Intern-IT|intern.it|Reader"
  "Vendor-1|vendor1|Reader"
  "Vendor-2|vendor2|Contributor"
  "Project-Mgr|project.mgr|Reader"
  "Data-Eng|data.eng|Storage Blob Data Contributor"
  "Sys-Admin|sys.admin|Virtual Machine Administrator Login"
  "Sec-Auditor|sec.auditor|Security Reader"
  "Fin-Analyst|fin.analyst|Billing Reader"
  "Cloud-Eng|cloud.eng|Contributor"
  "Support-Eng|support.eng|Reader"
)

for user_info in "${USERS[@]}"; do
  IFS='|' read -r name prefix role <<< "$user_info"
  upn="${prefix}@${DOMAIN}"
  
  echo "Creating user: Sim-$name ($upn)"
  az ad user create \
    --display-name "Sim-$name" \
    --user-principal-name "$upn" \
    --password "$TEMP_PASSWORD" > /dev/null

done

echo "Waiting 15 seconds for Entra ID replication..."
sleep 15

for user_info in "${USERS[@]}"; do
  IFS='|' read -r name prefix role <<< "$user_info"
  upn="${prefix}@${DOMAIN}"
  
  echo "Assigning role: $role to $upn"
  az role assignment create \
    --assignee "$upn" \
    --role "$role" \
    --scope "/subscriptions/$SUBSCRIPTION_ID" > /dev/null
done

echo "Simulation script completed successfully."