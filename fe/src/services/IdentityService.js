const API_BASE = "http://localhost:8000/api/v1";

export const IdentityService = {
  async getIdentities() {
    try {
      const res = await fetch(`${API_BASE}/identities/`);
      if (!res.ok) throw new Error("Failed to fetch identities");
      return await res.json();
    } catch (e) {
      console.warn("Falling back to local identities data:", e);
      return {
        last_checked: new Date().toLocaleTimeString(),
        identities: [
          {
            upn: "admin.john@contoso.com",
            displayName: "John Doe (Global Admin)",
            scope: "/subscriptions/efca2116-f6e1-430f-a854-27d4b4476efd/resourceGroups/rg-prod",
            provisionedRole: "Owner",
            entraRole: "Global Administrator",
            subscriptionRole: "Owner",
            userType: "Member",
            unusedCount: 34,
            riskScore: 92.5,
            riskLevel: "CRITICAL",
            permissions: [
              { action: "Microsoft.Authorization/*", status: "UNUSED", risk: "CRITICAL", mitre: "T1098 Account Manipulation", lastUsed: "Never (90d)", roleLevel: "Entra ID Directory Role" },
              { action: "Microsoft.Storage/storageAccounts/*", status: "UNUSED", risk: "HIGH", mitre: "T1530 Cloud Storage Data", lastUsed: "Never (90d)", roleLevel: "Subscription IAM" },
              { action: "Microsoft.KeyVault/vaults/*", status: "UNUSED", risk: "HIGH", mitre: "T1078 Valid Accounts", lastUsed: "Never (90d)", roleLevel: "Subscription IAM" },
              { action: "Microsoft.Compute/virtualMachines/read", status: "USED", executionCount: 42, lastUsed: "2026-09-15 10:00 UTC", roleLevel: "Subscription IAM" },
              { action: "Microsoft.Compute/virtualMachines/start/action", status: "USED", executionCount: 18, lastUsed: "2026-09-14 14:30 UTC", roleLevel: "Subscription IAM" },
              { action: "Microsoft.Network/networkInterfaces/read", status: "USED", executionCount: 29, lastUsed: "2026-09-16 09:15 UTC", roleLevel: "Subscription IAM" },
              { action: "Microsoft.Resources/subscriptions/resourceGroups/read", status: "USED", executionCount: 85, lastUsed: "2026-09-17 08:00 UTC", roleLevel: "Subscription IAM" }
            ]
          },
          {
            upn: "dev.sarah@contoso.com",
            displayName: "Sarah Connor (Lead Dev)",
            scope: "/subscriptions/efca2116-f6e1-430f-a854-27d4b4476efd/resourceGroups/rg-dev",
            provisionedRole: "Contributor",
            entraRole: "None",
            subscriptionRole: "Contributor",
            userType: "Member",
            unusedCount: 18,
            riskScore: 64.0,
            riskLevel: "HIGH",
            permissions: [
              { action: "Microsoft.Sql/servers/*", status: "UNUSED", risk: "HIGH", mitre: "T1530 Database Exposure", lastUsed: "Never (90d)", roleLevel: "Subscription IAM" },
              { action: "Microsoft.KeyVault/vaults/secrets/read", status: "UNUSED", risk: "MEDIUM", mitre: "T1552 Credentials in Files", lastUsed: "Never (90d)", roleLevel: "Subscription IAM" },
              { action: "Microsoft.Web/sites/publish/action", status: "USED", executionCount: 54, lastUsed: "2026-09-16 16:45 UTC", roleLevel: "Subscription IAM" },
              { action: "Microsoft.Web/sites/config/write", status: "USED", executionCount: 12, lastUsed: "2026-09-15 11:20 UTC", roleLevel: "Subscription IAM" },
              { action: "Microsoft.Compute/virtualMachines/read", status: "USED", executionCount: 33, lastUsed: "2026-09-17 09:10 UTC", roleLevel: "Subscription IAM" }
            ]
          },
          {
            upn: "analyst.alex@contoso.com",
            displayName: "Alex Smith (SecOps Analyst)",
            scope: "/subscriptions/efca2116-f6e1-430f-a854-27d4b4476efd",
            provisionedRole: "Reader",
            entraRole: "None",
            subscriptionRole: "Reader",
            userType: "Member",
            unusedCount: 2,
            riskScore: 12.0,
            riskLevel: "LOW",
            permissions: [
              { action: "Microsoft.Insights/components/read", status: "USED", executionCount: 110, lastUsed: "2026-09-17 10:30 UTC", roleLevel: "Subscription IAM" },
              { action: "Microsoft.Resources/subscriptions/read", status: "USED", executionCount: 95, lastUsed: "2026-09-17 10:25 UTC", roleLevel: "Subscription IAM" },
              { action: "Microsoft.Security/assessments/read", status: "USED", executionCount: 60, lastUsed: "2026-09-16 15:00 UTC", roleLevel: "Subscription IAM" },
              { action: "Microsoft.Network/networkWatchers/read", status: "UNUSED", risk: "LOW", mitre: "T1078 Valid Accounts", lastUsed: "Never (90d)", roleLevel: "Subscription IAM" }
            ]
          },
          {
            upn: "vendor.mike@contoso.com",
            displayName: "Mike Vance (Nth-Party Contractor)",
            scope: "/subscriptions/efca2116-f6e1-430f-a854-27d4b4476efd/resourceGroups/rg-staging",
            provisionedRole: "Owner",
            entraRole: "None",
            subscriptionRole: "Owner",
            userType: "Guest",
            unusedCount: 50,
            riskScore: 98.0,
            riskLevel: "CRITICAL",
            permissions: [
              { action: "Microsoft.Authorization/*", status: "UNUSED", risk: "CRITICAL", mitre: "T1098 Account Manipulation", lastUsed: "Dormant (92d)", roleLevel: "Subscription IAM" },
              { action: "Microsoft.Storage/storageAccounts/*", status: "UNUSED", risk: "HIGH", mitre: "T1530 Cloud Storage Data", lastUsed: "Dormant (92d)", roleLevel: "Subscription IAM" },
              { action: "Microsoft.Compute/*", status: "UNUSED", risk: "HIGH", mitre: "T1078 Valid Accounts", lastUsed: "Dormant (92d)", roleLevel: "Subscription IAM" }
            ]
          }
        ]
      };
    }
  },

  async syncIdentities() {
    try {
      const res = await fetch(`${API_BASE}/identities/sync`, { method: 'POST' });
      if (!res.ok) throw new Error("Failed to sync identities");
      return await res.json();
    } catch (e) {
      return await this.getIdentities();
    }
  }
};
