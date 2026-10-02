#!/usr/bin/env bash
# execute_remediation.sh — Shell wrapper for executing custom role creation and RBAC reassignment via Azure CLI

set -e

ROLE_FILE="$1"
PRINCIPAL_ID="$2"
SCOPE="$3"

if [ -z "$ROLE_FILE" ] || [ -z "$PRINCIPAL_ID" ] || [ -z "$SCOPE" ]; then
  echo "Usage: $0 <role_definition_file.json> <principal_id> <scope>"
  exit 1
fi

echo "1. Creating Azure Custom Role from $ROLE_FILE..."
CREATED_ROLE=$(az role definition create --role-definition "$ROLE_FILE" --output json)
ROLE_ID=$(echo "$CREATED_ROLE" | grep -oP '"name": "\K[^"]+')

echo "2. Applying Custom Role ($ROLE_ID) to Principal $PRINCIPAL_ID at Scope $SCOPE..."
az role assignment create --assignee "$PRINCIPAL_ID" --role "$ROLE_ID" --scope "$SCOPE"

echo "Remediation executed successfully!"
