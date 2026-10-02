"""
az_role_scraper.py — Cross-platform Python script to extract Azure RBAC role definitions via Azure CLI.
"""

import sys
import os
import json
import subprocess

def scrape_azure_roles(output_path: str = "role_definitions.json"):
    print("Extracting Azure RBAC role definitions via Azure CLI...")
    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"

    try:
        res = subprocess.run(
            ["az", "role", "definition", "list", "--output", "json"],
            capture_output=True,
            text=True,
            shell=True,
            env=env
        )

        if res.returncode == 0 and res.stdout.strip():
            roles = json.loads(res.stdout)
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(roles, f, indent=2)
            print(f"Successfully scraped {len(roles)} Azure role definitions to {output_path}")
            return roles
        else:
            print(f"Azure CLI failed with return code {res.returncode}: {res.stderr.strip()}", file=sys.stderr)
            sys.exit(1)
    except Exception as e:
        print(f"Error executing Azure CLI: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    out_file = sys.argv[1] if len(sys.argv) > 1 else "role_definitions.json"
    scrape_azure_roles(out_file)
