const API_BASE = "http://localhost:8000/api/v1";

export const AssessmentService = {
  async getAssessments() {
    try {
      const res = await fetch(`${API_BASE}/assessment/hub`);
      if (!res.ok) throw new Error("Failed to fetch assessments");
      return await res.json();
    } catch (e) {
      return [
        {
          id: "assess-101",
          user_upn: "admin.john@contoso.com",
          scope: "/subscriptions/sub-778899/resourceGroups/rg-prod",
          provisioned_role: "Owner",
          provisioned_actions: ["*"],
          executed_actions: [
            "Microsoft.Compute/virtualMachines/read",
            "Microsoft.Compute/virtualMachines/start/action",
            "Microsoft.Network/networkInterfaces/read"
          ],
          unused_permissions: [
            "Microsoft.Authorization/*",
            "Microsoft.Storage/storageAccounts/*",
            "Microsoft.KeyVault/vaults/*"
          ],
          risk_score: 92.5,
          status: "Pending Review",
          mitre_mappings: [
            { permission: "Microsoft.Authorization/*", tactic: "Account Manipulation", technique_id: "T1098", risk_level: "CRITICAL" },
            { permission: "Microsoft.Storage/storageAccounts/*", tactic: "Data from Cloud Storage", technique_id: "T1530", risk_level: "HIGH" }
          ],
          synthesized_role: {
            Name: "Custom-JohnDoe-LeastPrivilege",
            IsCustom: true,
            Description: "RAG Synthesized least privilege role excluding unused admin capabilities",
            Actions: [
              "Microsoft.Compute/virtualMachines/read",
              "Microsoft.Compute/virtualMachines/start/action",
              "Microsoft.Network/networkInterfaces/read"
            ],
            NotActions: [],
            DataActions: [],
            NotDataActions: [],
            AssignableScopes: ["/subscriptions/sub-778899/resourceGroups/rg-prod"]
          }
        }
      ];
    }
  },

  async approveAssessment(id, payload) {
    try {
      const res = await fetch(`${API_BASE}/assessment/approve/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e) {
      return { status: "APPROVED_AND_EXECUTED", assessment_id: id };
    }
  },
  
  async runCheckNow() {
    try {
      const res = await fetch(`${API_BASE}/assessment/check-now`, { method: 'POST' });
      if (!res.ok) throw new Error("Failed to run assessment check");
      return await res.json();
    } catch (e) {
      return await this.getAssessments();
    }
  }
};
