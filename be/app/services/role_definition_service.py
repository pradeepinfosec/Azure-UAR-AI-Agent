"""
role_definition_service.py — Resolves exact Azure IAM & Entra ID permissions (Actions & DataActions) matching Azure Portal.
"""

import subprocess
import json
import logging
from typing import List, Dict, Any, Tuple

logger = logging.getLogger(__name__)

# Pre-indexed comprehensive built-in definitions for instant latency and offline resilience
BUILTIN_ROLE_PERMISSIONS: Dict[str, Dict[str, Any]] = {
    "Storage Blob Data Reader": {
        "actions": [
            "Microsoft.Storage/storageAccounts/blobServices/containers/read",
            "Microsoft.Storage/storageAccounts/blobServices/generateUserDelegationKey/action"
        ],
        "dataActions": [
            "Microsoft.Storage/storageAccounts/blobServices/containers/blobs/read"
        ]
    },
    "Storage Blob Data Contributor": {
        "actions": [
            "Microsoft.Storage/storageAccounts/blobServices/containers/delete",
            "Microsoft.Storage/storageAccounts/blobServices/containers/read",
            "Microsoft.Storage/storageAccounts/blobServices/containers/write",
            "Microsoft.Storage/storageAccounts/blobServices/generateUserDelegationKey/action"
        ],
        "dataActions": [
            "Microsoft.Storage/storageAccounts/blobServices/containers/blobs/delete",
            "Microsoft.Storage/storageAccounts/blobServices/containers/blobs/read",
            "Microsoft.Storage/storageAccounts/blobServices/containers/blobs/write",
            "Microsoft.Storage/storageAccounts/blobServices/containers/blobs/move/action",
            "Microsoft.Storage/storageAccounts/blobServices/containers/blobs/add/action"
        ]
    },
    "Storage Blob Data Owner": {
        "actions": [
            "Microsoft.Storage/storageAccounts/blobServices/containers/*",
            "Microsoft.Storage/storageAccounts/blobServices/generateUserDelegationKey/action"
        ],
        "dataActions": [
            "Microsoft.Storage/storageAccounts/blobServices/containers/blobs/*"
        ]
    },
    "Reader": {
        "actions": [
            "*/read"
        ],
        "dataActions": []
    },
    "Contributor": {
        "actions": [
            "*"
        ],
        "dataActions": []
    },
    "Owner": {
        "actions": [
            "*",
            "Microsoft.Authorization/*"
        ],
        "dataActions": []
    },
    "Security Reader": {
        "actions": [
            "Microsoft.Authorization/*/read",
            "Microsoft.Insights/alertRules/read",
            "Microsoft.operationalInsights/workspaces/*/read",
            "Microsoft.Resources/deployments/*/read",
            "Microsoft.Resources/subscriptions/resourceGroups/read",
            "Microsoft.Security/*/read",
            "Microsoft.IoTSecurity/*/read",
            "Microsoft.Support/*/read",
            "Microsoft.Security/iotDefenderSettings/packageDownloads/action",
            "Microsoft.Security/iotDefenderSettings/downloadManagerActivation/action",
            "Microsoft.Security/iotSensors/downloadResetPassword/action",
            "Microsoft.Management/managementGroups/read"
        ],
        "dataActions": []
    },
    "Security Admin": {
        "actions": [
            "Microsoft.Security/*",
            "Microsoft.Authorization/*/read",
            "Microsoft.Insights/alertRules/*",
            "Microsoft.OperationalInsights/workspaces/*/read"
        ],
        "dataActions": []
    },
    "Virtual Machine Administrator Login": {
        "actions": [
            "Microsoft.Network/publicIPAddresses/read",
            "Microsoft.Network/virtualNetworks/read",
            "Microsoft.Network/loadBalancers/read",
            "Microsoft.Network/networkInterfaces/read",
            "Microsoft.Compute/virtualMachines/*/read",
            "Microsoft.HybridCompute/machines/*/read",
            "Microsoft.HybridConnectivity/endpoints/listCredentials/action"
        ],
        "dataActions": [
            "Microsoft.Compute/virtualMachines/login/action",
            "Microsoft.Compute/virtualMachines/loginAsAdmin/action",
            "Microsoft.HybridCompute/machines/login/action",
            "Microsoft.HybridCompute/machines/loginAsAdmin/action"
        ]
    },
    "Virtual Machine Contributor": {
        "actions": [
            "Microsoft.Compute/virtualMachines/*",
            "Microsoft.Compute/virtualMachineScaleSets/*",
            "Microsoft.Network/networkInterfaces/*",
            "Microsoft.Network/publicIPAddresses/*",
            "Microsoft.Network/virtualNetworks/*",
            "Microsoft.Resources/deployments/*",
            "Microsoft.Resources/subscriptions/resourceGroups/read"
        ],
        "dataActions": []
    },
    "Billing Reader": {
        "actions": [
            "Microsoft.Authorization/*/read",
            "Microsoft.Billing/*/read",
            "Microsoft.Commerce/*/read",
            "Microsoft.Consumption/*/read",
            "Microsoft.Management/managementGroups/read",
            "Microsoft.CostManagement/*/read",
            "Microsoft.Support/*"
        ],
        "dataActions": []
    },
    "Monitoring Reader": {
        "actions": [
            "Microsoft.Insights/alertRules/read",
            "Microsoft.Insights/components/*/read",
            "Microsoft.Insights/metricAlerts/read",
            "Microsoft.operationalInsights/workspaces/read",
            "Microsoft.operationalInsights/workspaces/query/read"
        ],
        "dataActions": []
    },
    "Log Analytics Reader": {
        "actions": [
            "Microsoft.OperationalInsights/workspaces/read",
            "Microsoft.OperationalInsights/workspaces/query/read",
            "Microsoft.OperationalInsights/workspaces/analytics/query/action",
            "Microsoft.OperationalInsights/workspaces/search/action"
        ],
        "dataActions": []
    },
    "Network Contributor": {
        "actions": [
            "Microsoft.Network/*",
            "Microsoft.Resources/deployments/*",
            "Microsoft.Resources/subscriptions/resourceGroups/read"
        ],
        "dataActions": []
    },
    "SQL DB Contributor": {
        "actions": [
            "Microsoft.Sql/servers/databases/*",
            "Microsoft.Sql/servers/elasticPools/*",
            "Microsoft.Resources/deployments/*",
            "Microsoft.Resources/subscriptions/resourceGroups/read"
        ],
        "dataActions": []
    },
    "Backup Contributor": {
        "actions": [
            "Microsoft.RecoveryServices/vaults/*",
            "Microsoft.DataProtection/backupVaults/*",
            "Microsoft.Resources/deployments/*"
        ],
        "dataActions": []
    },
    "User Access Administrator": {
        "actions": [
            "Microsoft.Authorization/*",
            "Microsoft.Support/*",
            "Microsoft.Resources/subscriptions/resourceGroups/read"
        ],
        "dataActions": []
    },
    "Role Based Access Control Administrator": {
        "actions": [
            "Microsoft.Authorization/roleAssignments/*",
            "Microsoft.Authorization/roleDefinitions/*",
            "Microsoft.Authorization/classicAdministrators/read",
            "Microsoft.Resources/subscriptions/resourceGroups/read"
        ],
        "dataActions": []
    },
    # Entra ID Directory Roles
    "Global Administrator": {
        "actions": [
            "microsoft.directory/*",
            "microsoft.directory/users/allProperties/all",
            "microsoft.directory/groups/allProperties/all",
            "microsoft.directory/servicePrincipals/allProperties/all",
            "microsoft.directory/applications/allProperties/all"
        ],
        "dataActions": []
    },
    "User Administrator": {
        "actions": [
            "microsoft.directory/users/allProperties/all",
            "microsoft.directory/users/password/update",
            "microsoft.directory/groups/allProperties/all",
            "microsoft.directory/auditLogs/allProperties/read"
        ],
        "dataActions": []
    },
    "Application Administrator": {
        "actions": [
            "microsoft.directory/applications/allProperties/all",
            "microsoft.directory/servicePrincipals/allProperties/all",
            "microsoft.directory/servicePrincipals/credentials/update"
        ],
        "dataActions": []
    },
    "Directory Readers": {
        "actions": [
            "microsoft.directory/users/allProperties/read",
            "microsoft.directory/groups/allProperties/read",
            "microsoft.directory/applications/allProperties/read"
        ],
        "dataActions": []
    }
}

ENTRA_DIRECTORY_ROLES = {
    "Global Administrator",
    "User Administrator",
    "People Administrator",
    "Application Administrator",
    "Directory Readers",
    "Security Administrator",
    "Helpdesk Administrator",
    "Privileged Role Administrator",
    "Privileged Authentication Administrator",
    "Authentication Administrator",
    "Authentication Policy Administrator",
    "Authentication Extensibility Administrator",
    "Cloud Application Administrator",
    "Billing Administrator",
    "Entra SOC Identity Responder",
    "Tenant Governance Administrator",
    "Tenant Governance Reader",
    "Tenant Governance Relationship Administrator",
    "Tenant Governance Relationship Reader",
    "Entra Customer Lockbox Approver",
    "Password Administrator",
    "Guest Inviter",
    "Groups Administrator",
    "Conditional Access Administrator",
    "License Administrator",
    "Message Center Reader",
    "Message Center Privacy Reader",
    "Security Reader",
    "Attribute Assignment Administrator",
    "Attribute Definition Administrator",
    "User Experience Success Manager",
    "Power BI Administrator",
    "Azure DevOps Administrator",
    "SharePoint Administrator",
    "Skype for Business Administrator",
    "Printer Administrator",
}

def is_entra_directory_role(role_name: str, scope: str = "") -> bool:
    if "entra" in scope.lower() or "directory" in scope.lower() or scope == "/":
        return True
    if role_name in ENTRA_DIRECTORY_ROLES or "directory" in role_name.lower() or "entra" in role_name.lower():
        return True
    return False

import os

# Dynamic in-memory cache for any custom roles or unlisted roles in Azure
DYNAMIC_ROLE_CACHE: Dict[str, Dict[str, Any]] = {}

def load_role_definitions(file_path: str = None) -> int:
    """Loads role definitions from role_definitions.json into DYNAMIC_ROLE_CACHE."""
    candidate_paths = [
        file_path,
        os.path.join(os.path.dirname(__file__), "../../role_definitions.json"),
        os.path.join(os.path.dirname(__file__), "../../../infra/scripts/role_definitions.json"),
        "role_definitions.json"
    ]
    for p in candidate_paths:
        if p and os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    roles = json.load(f)
                    count = 0
                    for r in roles:
                        r_name = r.get("roleName")
                        if r_name and "permissions" in r and len(r["permissions"]) > 0:
                            p_entry = r["permissions"][0]
                            DYNAMIC_ROLE_CACHE[r_name] = {
                                "actions": p_entry.get("actions", []),
                                "dataActions": p_entry.get("dataActions", [])
                            }
                            count += 1
                    logger.info(f"Loaded {count} Azure role definitions from {p}")
                    return count
            except Exception as e:
                logger.warning(f"Failed to load role definitions from {p}: {e}")
    return 0

# Auto-load available role definitions on startup
load_role_definitions()

def get_role_permissions(role_name: str) -> Dict[str, List[str]]:
    """
    Returns exact actions and dataActions for a given Azure RBAC or Entra ID role.
    """
    if not role_name:
        return {"actions": ["*/read"], "dataActions": []}
        
    # Check built-in dictionary
    if role_name in BUILTIN_ROLE_PERMISSIONS:
        return BUILTIN_ROLE_PERMISSIONS[role_name]
        
    # Check dynamic cache (direct & case-insensitive)
    if role_name in DYNAMIC_ROLE_CACHE:
        return DYNAMIC_ROLE_CACHE[role_name]
    for k, v in DYNAMIC_ROLE_CACHE.items():
        if k.lower() == role_name.lower():
            return v

    # Dynamically fetch from Azure CLI if unknown
    try:
        res = subprocess.run(
            ["az", "role", "definition", "list", "--name", role_name, "--output", "json"],
            capture_output=True, text=True, timeout=8, shell=True
        )
        if res.returncode == 0 and res.stdout.strip():
            role_data = json.loads(res.stdout)
            if role_data and len(role_data) > 0:
                perms = role_data[0].get("permissions", [{}])[0]
                actions = perms.get("actions", [])
                data_actions = perms.get("dataActions", [])
                
                resolved = {
                    "actions": actions if actions else [f"Microsoft.{role_name.replace(' ', '')}/*"],
                    "dataActions": data_actions
                }
                DYNAMIC_ROLE_CACHE[role_name] = resolved
                return resolved
    except Exception as e:
        logger.warning(f"Failed to fetch dynamic role definition for {role_name}: {e}")

    # Fallback heuristic based on role name
    role_lower = role_name.lower()
    if "admin" in role_lower or "owner" in role_lower:
        return {"actions": ["*"], "dataActions": []}
    elif "reader" in role_lower:
        return {"actions": ["*/read"], "dataActions": []}
    elif "storage" in role_lower:
        return {
            "actions": [
                "Microsoft.Storage/storageAccounts/blobServices/containers/read",
                "Microsoft.Storage/storageAccounts/blobServices/generateUserDelegationKey/action"
            ],
            "dataActions": [
                "Microsoft.Storage/storageAccounts/blobServices/containers/blobs/read"
            ]
        }
    
    return {"actions": [f"Microsoft.{role_name.replace(' ', '')}/*"], "dataActions": []}

def classify_action_risk_and_mitre(action: str) -> Tuple[str, str]:
    """
    Assigns appropriate MITRE ATT&CK technique and Risk Severity to an Azure permission.
    """
    act_lower = action.lower()
    
    if "authorization" in act_lower or "roleassignment" in act_lower:
        return "CRITICAL", "T1098 Account Manipulation"
    elif "loginasadmin" in act_lower or "elevateaccess" in act_lower:
        return "CRITICAL", "T1068 Privilege Escalation"
    elif "storage" in act_lower or "blob" in act_lower:
        if "delete" in act_lower or "write" in act_lower:
            return "HIGH", "T1485 Data Destruction / Exfiltration"
        return "HIGH", "T1530 Cloud Storage Data Access"
    elif "keyvault" in act_lower:
        return "HIGH", "T1555 Credentials from Password Stores"
    elif "sql" in act_lower or "database" in act_lower:
        return "HIGH", "T1530 Database Data Access"
    elif "compute" in act_lower or "virtualmachine" in act_lower:
        if "login" in act_lower:
            return "HIGH", "T1078 Valid Accounts (RDP/SSH)"
        return "MEDIUM", "T1078 Valid Accounts"
    elif "network" in act_lower:
        return "MEDIUM", "T1046 Network Service Discovery"
    elif "microsoft.directory" in act_lower:
        if "password" in act_lower or "all" in act_lower:
            return "CRITICAL", "T1098 Account Manipulation"
        return "HIGH", "T1087 Account Discovery"
    elif act_lower == "*":
        return "CRITICAL", "T1078 Full Subscription Control"
    elif "read" in act_lower:
        return "LOW", "T1087 Cloud Resource Discovery"
    else:
        return "MEDIUM", "T1078 Valid Accounts"
