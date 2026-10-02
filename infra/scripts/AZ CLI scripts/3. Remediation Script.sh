#!/bin/bash
# FILE 3: 03_execute_remediation.sh
# Executes least-privilege remediation based on simulated gaps

# ==========================================
# CONFIGURATION VARIABLES
# ==========================================
SUBSCRIPTION_ID="efca2116-f6e1-430f-a854-27d4b4476efd"
SIM_RG_NAME="UAR-Sim-RG"
USER_STORAGE_UPN="sim.storage@anjalibhagigmail.onmicrosoft.com"
USER_ADMIN_UPN="sim.admin@anjalibhagigmail.onmicrosoft.com"
USER_ORPHAN_UPN="sim.orphan@anjalibhagigmail.onmicrosoft.com"
CUSTOM_ROLE_NAME="UAR Least Privilege Storage Reader"
CUSTOM_ROLE_FILE="uar_storage_custom_role.json"
# ==========================================

az account set --subscription "$SUBSCRIPTION_ID"
RG_SCOPE="/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$SIM_RG_NAME"

# Remediation A: Synthesize and Apply Custom Role (T1530)
cat <<EOF > "$CUSTOM_ROLE_FILE"
{
  "Name": "$CUSTOM_ROLE_NAME",
  "IsCustom": true,
  "Description": "AI-Synthesized role restricting access to basic storage read operations.",
  "Actions": [
    "Microsoft.Storage/storageAccounts/read",
    "Microsoft.Storage/storageAccounts/blobServices/containers/read"
  ],
  "NotActions": [],
  "DataActions": [],
  "NotDataActions": [],
  "AssignableScopes": [
    "/subscriptions/$SUBSCRIPTION_ID"
  ]
}
EOF

az role definition create --role-definition "$CUSTOM_ROLE_FILE"

az role assignment create \
  --assignee "$USER_STORAGE_UPN" \
  --role "$CUSTOM_ROLE_NAME" \
  --scope "/subscriptions/$SUBSCRIPTION_ID"

az role assignment delete \
  --assignee "$USER_STORAGE_UPN" \
  --role "Storage Blob Data Contributor" \
  --scope "/subscriptions/$SUBSCRIPTION_ID"

# Remediation B: Down-scope Subscription Contributor (T1098)
az role assignment create \
  --assignee "$USER_ADMIN_UPN" \
  --role "Log Analytics Reader" \
  --scope "/subscriptions/$SUBSCRIPTION_ID"

az role assignment delete \
  --assignee "$USER_ADMIN_UPN" \
  --role "Contributor" \
  --scope "/subscriptions/$SUBSCRIPTION_ID"

# Remediation C: Revoke Orphaned Access (T1078)
az role assignment delete \
  --assignee "$USER_ORPHAN_UPN" \
  --role "Owner" \
  --scope "$RG_SCOPE"

az ad user update --id "$USER_ORPHAN_UPN" --account-enabled false 