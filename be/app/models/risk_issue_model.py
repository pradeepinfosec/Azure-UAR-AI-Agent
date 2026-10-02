from pydantic import BaseModel
from typing import List

class RiskIssueModel(BaseModel):
    rule_id: str
    severity: str  # CRITICAL, HIGH, MEDIUM, LOW
    title: str
    description: str
    affected_identity: str
    unused_permission: str
    mitre_tactic: str
    mitre_technique_id: str
