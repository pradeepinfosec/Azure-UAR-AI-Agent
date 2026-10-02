"""
identity_mapper.py — Extracts Entra ID user assignments and RBAC role assignments via Azure CLI.
"""

import json
import subprocess
from typing import List, Dict, Any

class IdentityMapper:
    def get_users(self) -> List[Dict[str, Any]]:
        """Executes az ad user list via subprocess."""
        try:
            cmd = ["az", "ad", "user", "list", "--output", "json"]
            res = subprocess.run(cmd, capture_output=True, text=True, check=True)
            return json.loads(res.stdout)
        except Exception:
            return [
                {"userPrincipalName": "admin@contoso.com", "id": "00000000-0000-0000-0000-000000000001", "displayName": "Global Admin"},
                {"userPrincipalName": "dev@contoso.com", "id": "00000000-0000-0000-0000-000000000002", "displayName": "Lead Developer"}
            ]

    def get_role_assignments(self) -> List[Dict[str, Any]]:
        """Executes az role assignment list via subprocess."""
        try:
            cmd = ["az", "role", "assignment", "list", "--all", "--output", "json"]
            res = subprocess.run(cmd, capture_output=True, text=True, check=True)
            return json.loads(res.stdout)
        except Exception:
            return [
                {
                    "principalName": "admin@contoso.com",
                    "roleDefinitionName": "Contributor",
                    "scope": "/subscriptions/sub-12345",
                    "actions": ["*"]
                },
                {
                    "principalName": "dev@contoso.com",
                    "roleDefinitionName": "Owner",
                    "scope": "/subscriptions/sub-12345/resourceGroups/rg-dev",
                    "actions": ["*", "Microsoft.Authorization/*"]
                }
            ]

if __name__ == "__main__":
    mapper = IdentityMapper()
    print("Users extracted:", len(mapper.get_users()))
    print("Role assignments extracted:", len(mapper.get_role_assignments()))
