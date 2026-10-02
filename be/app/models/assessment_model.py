from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class CustomRoleDefinition(BaseModel):
    Name: str
    IsCustom: bool = True
    Description: str
    Actions: List[str]
    NotActions: List[str] = []
    DataActions: List[str] = []
    NotDataActions: List[str] = []
    AssignableScopes: List[str]

class AssessmentModel(BaseModel):
    id: str
    user_upn: str
    scope: str
    provisioned_actions: List[str]
    executed_actions: List[str]
    unused_permissions: List[str]
    risk_score: float
    status: str = "Pending Review"  # Draft, Pending Review, Approved, Executed
    mitre_mappings: List[Dict[str, Any]] = []
    synthesized_role: Optional[CustomRoleDefinition] = None
