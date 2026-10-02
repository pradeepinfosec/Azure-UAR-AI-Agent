from pydantic import BaseModel, Field
from typing import List, Optional

class RoleAssignment(BaseModel):
    role_name: str
    scope: str
    actions: List[str]

class IdentityModel(BaseModel):
    upn: str
    object_id: str
    display_name: str
    assignments: List[RoleAssignment] = []
    status: str = "Active"
