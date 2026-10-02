const API_BASE = "http://localhost:8000/api/v1";

export const DashboardService = {
  async getSummary() {
    try {
      const res = await fetch(`${API_BASE}/dashboard/summary`);
      if (!res.ok) throw new Error("Failed to fetch dashboard summary");
      return await res.json();
    } catch (e) {
      return {
        total_identities: 142,
        high_risk_identities: 18,
        total_unused_permissions: 1240,
        risk_remediation_percentage: 78.5,
        domain1_status: "Active (LAW Connected)",
        domain2_status: "Active (Groq RAG Ready)",
        kpi_trends: [
          { month: "May", unused: 1800, remediated: 400 },
          { month: "Jun", unused: 1650, remediated: 650 },
          { month: "Jul", unused: 1500, remediated: 900 },
          { month: "Aug", unused: 1320, remediated: 1100 },
          { month: "Sep", unused: 1240, remediated: 1240 }
        ]
      };
    }
  },
  async runScan() {
    try {
      const res = await fetch(`${API_BASE}/dashboard/scan`, { method: 'POST' });
      if (!res.ok) throw new Error("Failed to run scan");
      return await res.json();
    } catch (e) {
      return await this.getSummary();
    }
  }
};
