"""
create_mitre_test_users.py — Executable script to provision test Entra ID users and Azure RBAC assignments mapped to MITRE ATT&CK Cloud Matrix tactics.
"""

import subprocess
import json
import sys

TEST_USERS = [
    {
        "upn_prefix": "mitre-admin",
        "displayName": "MITRE Test Admin (Account Manipulation)",
        "role": "Owner",
        "scope_type": "subscription",
        "mitre_tcode": "T1098",
        "mitre_tactic": "Account Manipulation (Wildcard Owner Permission)"
    },
    {
        "upn_prefix": "mitre-dev",
        "displayName": "MITRE Test Developer (Storage Exfiltration)",
        "role": "Contributor",
        "scope_type": "resourceGroup",
        "mitre_tcode": "T1530",
        "mitre_tactic": "Data from Cloud Storage Object (Unused Microsoft.Storage/*)"
    },
    {
        "upn_prefix": "mitre-contractor",
        "displayName": "MITRE Test Contractor (Dormant Access)",
        "role": "Owner",
        "scope_type": "resourceGroup",
        "mitre_tcode": "T1078",
        "mitre_tactic": "Valid Accounts (Dormant Third-Party Scope)"
    }
]

def run_cmd(cmd):
    """Executes a shell command and returns output or error."""
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return res.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"[-] Command failed: {' '.join(cmd)}\n    Error: {e.stderr.strip()}")
        return None

def main():
    print("=================================================================")
    print(" Azure UAR AI Agent — MITRE ATT&CK Test Identity Provisioner")
    print("=================================================================\n")

    # Check az login
    account_raw = run_cmd(["az", "account", "show"])
    if not account_raw:
        print("[-] Error: Azure CLI is not authenticated. Please run 'az login' first.")
        sys.exit(1)

    account_data = json.loads(account_raw)
    subscription_id = account_data["id"]
    domain = account_data.get("tenantDefaultDomain", "contoso.com")
    print(f"[+] Connected Azure Subscription: {account_data['name']} ({subscription_id})")
    print(f"[+] Tenant Domain: {domain}\n")

    for user in TEST_USERS:
        upn = f"{user['upn_prefix']}@{domain}"
        print(f"--- Provisioning {user['displayName']} ---")
        print(f"    UPN: {upn}")
        print(f"    MITRE Technique: {user['mitre_tcode']} — {user['mitre_tactic']}")

        # 1. Create Entra ID User
        create_user_cmd = [
            "az", "ad", "user", "create",
            "--display-name", user["displayName"],
            "--user-principal-name", upn,
            "--password", "P@ssw0rd2026!SecureAzureUAR",
            "--force-change-password-next-sign-in", "false",
            "--output", "json"
        ]
        user_res = run_cmd(create_user_cmd)
        if user_res:
            u_json = json.loads(user_res)
            user_id = u_json.get("id")
            print(f"    [✔] Created Entra ID Principal Object ID: {user_id}")

            # 2. Assign Azure RBAC Role
            scope = f"/subscriptions/{subscription_id}"
            assign_cmd = [
                "az", "role", "assignment", "create",
                "--assignee-object-id", user_id,
                "--assignee-principal-type", "User",
                "--role", user["role"],
                "--scope", scope,
                "--output", "json"
            ]
            role_res = run_cmd(assign_cmd)
            if role_res:
                print(f"    [✔] Assigned Azure RBAC Role '{user['role']}' at Scope {scope}")

        print("")

    print("[+] Test identity provisioning complete! You can now run identity_mapper.py to extract these assignments.")

if __name__ == "__main__":
    main()
