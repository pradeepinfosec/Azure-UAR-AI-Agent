from fastapi import APIRouter
from typing import List, Dict, Any

router = APIRouter()

@router.get("/rules")
def get_policy_rules() -> List[Dict[str, Any]]:
    return [
        {"id": "R01", "name": "Directory Wildcard Assignment", "severity": "CRITICAL", "description": "Detects unconstrained '*' wildcard ARM permissions."},
        {"id": "R02", "name": "Unused Authorization Rights", "severity": "CRITICAL", "description": "Detects unused RBAC modification rights (Microsoft.Authorization/*)."},
        {"id": "R03", "name": "Dormant Storage Account Access", "severity": "HIGH", "description": "Flags 90-day unauthenticated blob/file operations."},
        {"id": "R04", "name": "KeyVault Management Exposure", "severity": "HIGH", "description": "Identifies unutilized KeyVault secret/key management actions."}
    ]
