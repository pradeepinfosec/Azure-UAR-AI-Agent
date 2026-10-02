from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.services.azure_remediator import AzureRemediator

router = APIRouter()
remediator = AzureRemediator()

@router.get("/hub")
def get_assessments() -> Dict[str, Any]:
    from datetime import datetime
    from app.api.identity_controller import get_identities
    
    id_data = get_identities()
    identities = id_data.get("identities", [])

    data = []
    for idx, u in enumerate(identities):
        upn = u.get("upn", "")
        display_name = u.get("displayName", upn.split("@")[0])
        role = u.get("provisionedRole", "Reader / User")
        scope = u.get("scope", "/subscriptions/efca2116-f6e1-430f-a854-27d4b4476efd")
        perms = u.get("permissions", [])
        
        executed = [p["action"] for p in perms if p.get("status") == "USED"]
        unused = [p["action"] for p in perms if p.get("status") == "UNUSED"]
        
        mitre_mappings = []
        for p in perms:
            if p.get("status") == "UNUSED":
                mitre_str = p.get("mitre", "T1078 Valid Accounts")
                parts = mitre_str.split(" ", 1)
                tech_id = parts[0] if len(parts) > 0 else "T1078"
                tactic = parts[1] if len(parts) > 1 else "Valid Accounts"
                
                mitre_mappings.append({
                    "permission": p["action"],
                    "technique_id": tech_id,
                    "tactic": tactic,
                    "risk_level": p.get("risk", "HIGH"),
                    "granted_by": p.get("grantedBy", role),
                    "role_type": p.get("roleType", "Subscription IAM")
                })

        safe_name = display_name.replace(" ", "").replace("-", "")
        clean_actions = executed if executed else ["Microsoft.Resources/subscriptions/resourceGroups/read"]

        data.append({
            "id": f"assess-{idx + 101}",
            "user_upn": upn,
            "display_name": display_name,
            "scope": scope,
            "provisioned_role": role,
            "entra_role": u.get("entraRole", "Directory Member"),
            "subscription_role": u.get("subscriptionRole", "None"),
            "provisioned_actions": [p["action"] for p in perms],
            "executed_actions": executed,
            "unused_permissions": unused,
            "risk_score": u.get("riskScore", 15.0),
            "risk_level": u.get("riskLevel", "LOW"),
            "status": "Pending Review" if len(unused) > 0 else "Compliant",
            "mitre_mappings": mitre_mappings,
            "synthesized_role": {
                "Name": f"Custom-{safe_name}-LeastPrivilege",
                "IsCustom": True,
                "Description": f"RAG Synthesized least-privilege role tailored for {display_name} based on 90-day activity",
                "Actions": clean_actions,
                "NotActions": [],
                "DataActions": [],
                "NotDataActions": [],
                "AssignableScopes": [scope]
            }
        })

    return {
        "last_checked": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "assessments": data
    }

@router.post("/check-now")
def run_assessment_check() -> Dict[str, Any]:
    from datetime import datetime
    res = get_assessments()
    res["message"] = "Policy evaluation and risk assessment scan executed successfully"
    return res

@router.post("/approve/{assessment_id}")
def approve_assessment(assessment_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    upn = payload.get("user_upn", "sim.admin@anjalibhagigmail.onmicrosoft.com")
    scope = payload.get("scope", "/subscriptions/efca2116-f6e1-430f-a854-27d4b4476efd")
    custom_role = payload.get("synthesized_role", {})

    result = remediator.execute_jit_remediation(custom_role, upn, scope)
    return {
        "assessment_id": assessment_id,
        "status": "APPROVED_AND_EXECUTED",
        "remediation_result": result
    }
