import json
import subprocess
from fastapi import APIRouter
from typing import List, Dict, Any

router = APIRouter()

def fetch_real_telemetry(workspace_id: str) -> Dict[str, Any]:
    if not workspace_id or workspace_id == "your-workspace-id-here":
        print("WARNING: LOG_ANALYTICS_WORKSPACE_ID is not set. Using fallback telemetry.")
        return {}
        
    try:
        from azure.identity import DefaultAzureCredential
        from azure.monitor.query import LogsQueryClient
        from datetime import timedelta
        
        credential = DefaultAzureCredential()
        client = LogsQueryClient(credential)
        
        query = """
            AzureActivity
            | where TimeGenerated > ago(90d)
            | where CategoryValue == "Administrative"
            | extend Action = tostring(parse_json(Authorization).action)
            | where isnotempty(Action)
            | summarize ExecutionCount = count(), LastUsed = max(TimeGenerated) by Caller, Action
        """
        
        response = client.query_workspace(
            workspace_id=workspace_id,
            query=query,
            timespan=timedelta(days=90)
        )
        
        telemetry_map = {}
        for table in response.tables:
            for row in table.rows:
                caller, action, count, last_used = row[0], row[1], row[2], row[3]
                caller = str(caller).lower()
                if caller not in telemetry_map:
                    telemetry_map[caller] = {}
                telemetry_map[caller][action] = {
                    "executionCount": count,
                    "lastUsed": last_used.strftime("%Y-%m-%d %H:%M UTC")
                }
                
        return telemetry_map
    except Exception as e:
        print(f"Failed to fetch telemetry from Log Analytics: {e}")
        return {}

# Comprehensive mapping of Entra ID Directory Role Template IDs to Display Names
KNOWN_ENTRA_ROLE_IDS: Dict[str, str] = {
    "62e90394-69f5-4237-9190-012177145e10": "Global Administrator",
    "fe930be7-5e62-47db-91af-98c3a49a38b1": "User Administrator",
    "024906de-61e5-49c8-8572-40335f1e0e10": "Security Administrator",
    "7be44c8a-adaf-4e2a-84d6-ab2649e08a13": "Privileged Role Administrator",
    "1981f584-96e9-4a6f-95b0-f522373f8fae": "Tenant Governance Administrator",
    "58f930cc-fcf4-4152-852c-1d7dbf502139": "Entra SOC Identity Responder",
    "d35481f7-cda1-4fa2-8344-5a21f7f3724d": "Entra Customer Lockbox Approver",
    "b8e31d83-1534-480f-9b10-0338ded51b7e": "Tenant Governance Relationship Administrator",
    "e0a4caa6-fe82-443f-b92f-d87341d17b2e": "Tenant Governance Reader",
    "124577f8-48ed-456a-839f-13b419002e33": "Tenant Governance Relationship Reader",
    "29232cdf-9323-42fd-ab2c-84921dad0da1": "Application Administrator",
    "9b89a4b0-25e4-43c7-8663-05bda694ddea": "Application Developer",
    "158c047a-c907-4556-b7bb-446716125426": "App Compliance Administrator",
    "b0f54576-42da-4aa9-b353-0fc69ef1151d": "Authentication Administrator",
    "c4e39bd9-1100-46d3-8c65-fb160da0071f": "Authentication Policy Administrator",
    "729827e3-9c14-49f7-bb1b-9608f156bbb8": "Helpdesk Administrator",
    "f2ef992c-96b9-446b-a3e7-7a0909e13434": "Password Administrator",
    "9360ffd5-f389-432d-95eb-5355a4f4b872": "Privileged Authentication Administrator",
    "3a2c62db-5318-420d-8d74-23affee5d9d5": "Security Reader",
    "8ac344fe-5c58-466c-8a14-87cfc1157158": "User Experience Success Manager",
    "024906de-61e5-49c8-8572-40335f1e0e10": "People Administrator",
    "e8611ab8-c189-46e8-94e1-60213ab1f814": "Privileged Role Administrator",
    "194ae4cb-b126-40b2-bd5b-6091b380977d": "Security Administrator",
    "5d6b6bb7-de71-4623-b4af-96380a352509": "Security Reader (Entra)",
    "45d8d3c5-c802-45c6-b32a-1d70b5e1e86e": "Authentication Extensibility Administrator",
    "26be63a3-c459-4de5-a1d0-99b89c6d05a0": "Attribute Assignment Administrator",
    "c21b4bd0-be9a-4e9c-8de8-5e8c4f30cbb2": "Attribute Definition Administrator",
    "95e79109-95c0-4d8e-aee3-d01accf2d47b": "Guest Inviter",
    "88d8e3e3-8f55-4a1e-953a-9b9898b8876b": "Directory Readers",
    "fdd7a751-b60b-444a-984c-02652fe8fa1c": "Groups Administrator",
    "4ba39ca4-527c-499a-b93d-d9b492c50246": "Printer Administrator",
    "11648597-926c-4cf3-9c36-bcebb0ba8dcc": "Power BI Administrator",
    "e3973bdf-4987-49ae-837a-ba8e231c7286": "Azure DevOps Administrator",
    "b1be1c3e-b65d-4f19-8427-f6fa0d97feb9": "Conditional Access Administrator",
    "aaf43236-0c0d-4d5f-883a-6955382ac081": "SharePoint Administrator",
    "75941009-915a-4869-abe7-691bff18279e": "Skype for Business Administrator",
    "4d6ac14f-3453-41d0-bef9-a3e0c569773a": "License Administrator",
    "0964bb5e-9bdb-4d7b-ac29-58e794862a40": "Message Center Reader",
    "ac16e43d-7b2d-40e0-ac05-243ff356ab5b": "Message Center Privacy Reader"
}

def fetch_live_azure_identities() -> List[Dict[str, Any]]:
    """Runs Azure CLI to pull real Entra ID users and RBAC assignments from connected tenant."""
    try:
        user_res = subprocess.run(["az", "ad", "user", "list", "--output", "json"], capture_output=True, text=True, timeout=30, shell=True)
        if user_res.returncode != 0 or not user_res.stdout.strip():
            return []

        az_users = json.loads(user_res.stdout)

        from app.services.role_definition_service import get_role_permissions, classify_action_risk_and_mitre, is_entra_directory_role

        # Fetch all Azure RBAC role assignments (index by principalId and principalName)
        role_map: Dict[str, List[Dict[str, Any]]] = {}
        try:
            role_res = subprocess.run(["az", "role", "assignment", "list", "--all", "--output", "json"], capture_output=True, text=True, timeout=60, shell=True)
            if role_res.returncode == 0 and role_res.stdout.strip():
                az_roles = json.loads(role_res.stdout)
                for r in az_roles:
                    r["isEntraRole"] = False
                    pid = r.get("principalId")
                    pname = r.get("principalName")
                    if pid:
                        if pid not in role_map:
                            role_map[pid] = []
                        role_map[pid].append(r)
                    if pname:
                        pname_l = pname.lower()
                        if pname_l not in role_map:
                            role_map[pname_l] = []
                        role_map[pname_l].append(r)
        except Exception as e:
            print(f"Error fetching Azure role assignments: {e}")

        # Fetch Entra ID directory role definitions dynamically if possible
        try:
            def_res = subprocess.run(
                ["az", "rest", "--method", "GET", "--url", "https://graph.microsoft.com/v1.0/roleManagement/directory/roleDefinitions?$select=id,displayName"],
                capture_output=True, text=True, timeout=30, shell=True
            )
            if def_res.returncode == 0 and def_res.stdout.strip():
                for item in json.loads(def_res.stdout).get("value", []):
                    KNOWN_ENTRA_ROLE_IDS[item["id"]] = item["displayName"]
        except Exception:
            pass

        # Fetch Entra ID directory role assignments
        try:
            entra_res = subprocess.run(
                ["az", "rest", "--method", "GET", "--url", "https://graph.microsoft.com/v1.0/roleManagement/directory/roleAssignments"],
                capture_output=True, text=True, timeout=30, shell=True
            )
            if entra_res.returncode == 0 and entra_res.stdout.strip():
                entra_data = json.loads(entra_res.stdout)
                for er in entra_data.get("value", []):
                    pid = er.get("principalId")
                    role_id = er.get("roleDefinitionId")
                    role_name = KNOWN_ENTRA_ROLE_IDS.get(role_id, er.get("roleDefinition", {}).get("displayName"))
                    if pid and role_name:
                        if pid not in role_map:
                            role_map[pid] = []
                        role_map[pid].append({
                            "roleDefinitionName": role_name,
                            "scope": er.get("directoryScopeId", "Entra ID Tenant Scope"),
                            "isEntraRole": True
                        })
        except Exception as e:
            print(f"Error fetching Entra directory role assignments: {e}")

        import os
        workspace_id = os.getenv("LOG_ANALYTICS_WORKSPACE_ID", "your-workspace-id-here")
        telemetry_map = fetch_real_telemetry(workspace_id)

        identities = []
        for u in az_users:
            upn = u.get("userPrincipalName", "")
            mail = u.get("mail", "")
            display_name = u.get("displayName", upn.split("@")[0])
            uid = u.get("id")

            # Match user assignments by Object ID, UPN, or Mail
            user_assignments = []
            seen_role_keys = set()
            for key in [uid, upn.lower() if upn else None, mail.lower() if mail else None]:
                if key and key in role_map:
                    for a in role_map[key]:
                        role_name = a.get("roleDefinitionName")
                        scope_val = a.get("scope", "")
                        r_key = f"{role_name}@{scope_val}"
                        if r_key not in seen_role_keys:
                            user_assignments.append(a)
                            seen_role_keys.add(r_key)
            
            if user_assignments:
                entra_roles = list({a.get("roleDefinitionName") for a in user_assignments if a.get("isEntraRole") and a.get("roleDefinitionName")})
                subscription_roles = list({a.get("roleDefinitionName") for a in user_assignments if not a.get("isEntraRole") and a.get("roleDefinitionName")})
                
                all_roles = [a.get("roleDefinitionName") for a in user_assignments if a.get("roleDefinitionName")]
                assigned_roles_list = list(set(all_roles))
                assigned_role = ", ".join(assigned_roles_list)
                scope = user_assignments[0].get("scope", "/subscriptions/efca2116-f6e1-430f-a854-27d4b4476efd")
            else:
                entra_roles = []
                subscription_roles = []
                assigned_roles_list = []
                assigned_role = "None (No Assigned Roles)"
                scope = "/subscriptions/efca2116-f6e1-430f-a854-27d4b4476efd"

            entra_role_str = ", ".join(entra_roles) if entra_roles else "None (Directory Member)"
            sub_role_str = ", ".join(subscription_roles) if subscription_roles else "None (No Azure IAM Role)"

            user_telemetry = {}
            # Match by UPN or Guest Email (B2B guest accounts record 'Caller' as their external email)
            upn_lower = upn.lower()
            if upn_lower in telemetry_map:
                user_telemetry.update(telemetry_map[upn_lower])
                
            if mail:
                mail_lower = mail.lower()
                if mail_lower in telemetry_map:
                    user_telemetry.update(telemetry_map[mail_lower])
            
            # 1. Resolve all genuine permissions from assigned Azure IAM / Entra ID roles and track origin
            action_origin_map = {}
            for r_name in assigned_roles_list:
                role_type = "Entra ID Directory Role" if is_entra_directory_role(r_name) else "Subscription IAM Role"
                role_perms = get_role_permissions(r_name)
                for act in role_perms.get("actions", []):
                    action_origin_map[act] = {"grantedBy": r_name, "roleType": role_type}
                for dact in role_perms.get("dataActions", []):
                    action_origin_map[dact] = {"grantedBy": r_name, "roleType": role_type}

            perms = []
            seen_actions = set()

            # 2. Add USED permissions matching telemetry
            for action, origin in action_origin_map.items():
                if action in user_telemetry:
                    stats = user_telemetry[action]
                    perms.append({
                        "action": action,
                        "status": "USED",
                        "grantedBy": origin["grantedBy"],
                        "roleType": origin["roleType"],
                        "executionCount": stats["executionCount"],
                        "lastUsed": stats["lastUsed"]
                    })
                    seen_actions.add(action)

            # Also add telemetry actions executed under wildcard roles (e.g. * or */read)
            for t_action, stats in user_telemetry.items():
                if t_action not in seen_actions:
                    origin = action_origin_map.get(t_action, {"grantedBy": assigned_role, "roleType": "Azure Activity / RBAC"})
                    perms.append({
                        "action": t_action,
                        "status": "USED",
                        "grantedBy": origin["grantedBy"],
                        "roleType": origin["roleType"],
                        "executionCount": stats["executionCount"],
                        "lastUsed": stats["lastUsed"]
                    })
                    seen_actions.add(t_action)

            # 3. Add UNUSED (Dormant) permissions for all provisioned actions not executed
            for action in sorted(action_origin_map.keys()):
                if action not in seen_actions:
                    origin = action_origin_map[action]
                    risk, mitre = classify_action_risk_and_mitre(action)
                    perms.append({
                        "action": action,
                        "status": "UNUSED",
                        "grantedBy": origin["grantedBy"],
                        "roleType": origin["roleType"],
                        "risk": risk,
                        "mitre": mitre,
                        "lastUsed": "Never (90d)"
                    })
                    seen_actions.add(action)

            unused_count = sum(1 for p in perms if p.get("status") == "UNUSED")
            critical_count = sum(1 for p in perms if p.get("risk") == "CRITICAL" and p.get("status") == "UNUSED")
            high_count = sum(1 for p in perms if p.get("risk") == "HIGH" and p.get("status") == "UNUSED")
            med_count = sum(1 for p in perms if p.get("risk") == "MEDIUM" and p.get("status") == "UNUSED")

            computed_score = 10.0 + (critical_count * 30.0) + (high_count * 15.0) + (med_count * 5.0)
            risk_score = min(99.5, computed_score)

            if critical_count > 0 or risk_score >= 75:
                risk_level = "CRITICAL"
            elif high_count > 0 or risk_score >= 40:
                risk_level = "HIGH"
            elif med_count > 0 or risk_score >= 20:
                risk_level = "MEDIUM"
            else:
                risk_level = "LOW"

            identities.append({
                "upn": upn,
                "displayName": display_name,
                "scope": scope,
                "provisionedRole": assigned_role,
                "entraRole": entra_role_str,
                "subscriptionRole": sub_role_str,
                "unusedCount": unused_count,
                "riskScore": round(risk_score, 1),
                "riskLevel": risk_level,
                "permissions": perms
            })

        return identities
    except Exception as e:
        print(f"Error pulling live identities: {e}")
        return []

@router.get("/")
def get_identities() -> Dict[str, Any]:
    from datetime import datetime
    from app.core.db import db
    
    if db is not None:
        cached = db.identities.find_one({"_id": "latest_identities"})
        if cached and len(cached.get("identities", [])) > 0:
            return {
                "last_checked": cached.get("last_checked", "Never"),
                "identities": cached.get("identities", [])
            }
            
    # Fallback to live fetch if no DB or empty cached data
    identities = fetch_live_azure_identities()
    last_checked = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    if db is not None and identities:
        db.identities.update_one(
            {"_id": "latest_identities"},
            {"$set": {"last_checked": last_checked, "identities": identities}},
            upsert=True
        )

    return {
        "last_checked": last_checked,
        "identities": identities
    }

@router.post("/sync")
def sync_identities() -> Dict[str, Any]:
    from datetime import datetime
    from app.core.db import db
    
    identities = fetch_live_azure_identities()
    last_checked = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    if db is not None:
        db.identities.update_one(
            {"_id": "latest_identities"},
            {"$set": {"last_checked": last_checked, "identities": identities}},
            upsert=True
        )
        
    return {
        "last_checked": last_checked,
        "message": "Entra ID & RBAC sync completed successfully and stored in DB",
        "identities": identities
    }

@router.post("/run-scraper")
def run_scraper() -> Dict[str, Any]:
    import os
    import threading
    from datetime import datetime
    from app.core.db import db
    from app.services.role_definition_service import load_role_definitions
    
    be_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
    be_file = os.path.join(be_dir, "role_definitions.json")
    infra_file = os.path.abspath(os.path.join(be_dir, "../infra/scripts/role_definitions.json"))
    
    role_count = 0
    
    # Step 1: Scrape Azure RBAC role definitions
    try:
        env = os.environ.copy()
        env["PYTHONIOENCODING"] = "utf-8"
        res = subprocess.run(
            ["az", "role", "definition", "list", "--output", "json"],
            capture_output=True, text=True, timeout=60, shell=True, env=env
        )
        if res.returncode == 0 and res.stdout.strip():
            parsed = json.loads(res.stdout.strip())
            role_count = len(parsed)
            with open(be_file, "w", encoding="utf-8") as f:
                json.dump(parsed, f, indent=2)
            try:
                with open(infra_file, "w", encoding="utf-8") as f:
                    json.dump(parsed, f, indent=2)
            except Exception:
                pass
            load_role_definitions(be_file)
    except Exception as e:
        print(f"Role scrape error: {e}")
        role_count = load_role_definitions(be_file) or load_role_definitions(infra_file)
    
    # Step 2: Run full identity sync (Entra ID + RBAC) — update DB in background
    def _sync_identities_bg():
        try:
            identities = fetch_live_azure_identities()
            last_checked = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            if db is not None and identities:
                db.identities.update_one(
                    {"_id": "latest_identities"},
                    {"$set": {"last_checked": last_checked, "identities": identities}},
                    upsert=True
                )
                print(f"Background identity sync complete: {len(identities)} principals updated.")
        except Exception as ex:
            print(f"Background identity sync error: {ex}")
    
    # Kick off in background — returns immediately to UI without waiting
    t = threading.Thread(target=_sync_identities_bg, daemon=True)
    t.start()
    
    if role_count > 0:
        return {
            "status": "success",
            "message": f"Scraped {role_count} Azure RBAC role definitions. Identity sync running in background — refresh in ~30s.",
            "count": role_count
        }
    
    return {
        "status": "error",
        "error": "Failed to scrape role definitions and no local cache was found.",
        "message": "Failed to scrape role definitions."
    }
