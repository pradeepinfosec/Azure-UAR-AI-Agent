"""
mitre_mapper.py — Maps unused permissions to MITRE ATT&CK Cloud Matrix tactics.
"""

import json
from ai.services.groq_client import GroqClient

class MITREMapper:
    def __init__(self, groq_client: GroqClient = None):
        self.groq_client = groq_client or GroqClient()

    def map_unused_permissions(self, unused_permissions: list) -> list:
        system_prompt = (
            "You are a threat intelligence bot. Map unused Azure permissions to MITRE ATT&CK Cloud matrix techniques."
            "Return JSON: {'mappings': [{'permission': '...', 'tactic': '...', 'technique_id': '...'}]}"
        )
        user_prompt = f"Unused permissions: {json.dumps(unused_permissions)}"

        try:
            raw_response = self.groq_client.chat_completion(system_prompt, user_prompt)
            data = json.loads(raw_response)
            return data.get("mappings", [])
        except Exception:
            # Deterministic fallback mapping logic
            fallback = []
            for perm in unused_permissions:
                if "Storage" in perm:
                    fallback.append({"permission": perm, "tactic": "Data from Cloud Storage", "technique_id": "T1530", "risk_level": "HIGH"})
                elif perm == "*" or "Authorization" in perm:
                    fallback.append({"permission": perm, "tactic": "Account Manipulation", "technique_id": "T1098", "risk_level": "CRITICAL"})
                else:
                    fallback.append({"permission": perm, "tactic": "Unused Privilege", "technique_id": "T1078", "risk_level": "MEDIUM"})
            return fallback

if __name__ == "__main__":
    mapper = MITREMapper()
    res = mapper.map_unused_permissions(["Microsoft.Storage/*", "*"])
    print("MITRE Mappings:", res)
