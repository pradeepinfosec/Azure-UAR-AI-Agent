"""
role_template_generator.py — Synthesizes Azure Custom Role definitions via RAG and Groq API.
"""

import json
from ai.services.groq_client import GroqClient

class RoleTemplateGenerator:
    def __init__(self, groq_client: GroqClient = None):
        self.groq_client = groq_client or GroqClient()

    def generate_custom_role(self, role_name: str, executed_actions: list, scope: str = "/subscriptions/sub-12345") -> dict:
        system_prompt = (
            "Synthesize an Azure Custom Role JSON definition with least privilege."
            "Return JSON matching: {'Name': '...', 'IsCustom': true, 'Description': '...', 'Actions': [...], 'AssignableScopes': [...]}"
        )
        user_prompt = f"Role Name: {role_name}\nExecuted Actions: {json.dumps(executed_actions)}\nScope: {scope}"

        try:
            raw_response = self.groq_client.chat_completion(system_prompt, user_prompt)
            return json.loads(raw_response)
        except Exception:
            return {
                "Name": f"Custom-{role_name.replace(' ', '')}-LeastPrivilege",
                "IsCustom": True,
                "Description": "Synthesized least-privilege role created by Azure UAR AI Agent",
                "Actions": executed_actions if executed_actions else ["Microsoft.Compute/virtualMachines/read"],
                "NotActions": [],
                "DataActions": [],
                "NotDataActions": [],
                "AssignableScopes": [scope]
            }

if __name__ == "__main__":
    gen = RoleTemplateGenerator()
    role = gen.generate_custom_role("VM Operator", ["Microsoft.Compute/virtualMachines/read"])
    print("Synthesized Role:", json.dumps(role, indent=2))
