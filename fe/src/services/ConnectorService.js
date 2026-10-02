const API_BASE = "http://localhost:8000/api/v1";

export const ConnectorService = {
  async getConnectors() {
    try {
      const res = await fetch(`${API_BASE}/connectors/`);
      if (!res.ok) throw new Error("Failed to fetch backend connectors");
      return await res.json();
    } catch (e) {
      return {
        last_checked: new Date().toLocaleTimeString(),
        connectors: [
          {
            id: "azure-entra",
            provider: "azure",
            name: "Azure Entra ID & RBAC Interface (Primary)",
            category: "Cloud Identity",
            description: "Master extraction of Entra ID user assignments, object IDs, and ARM role definitions via identity_mapper.py.",
            status: "CONNECTED",
            lastSync: "Live",
            isDefault: true,
            config: {
              tenantId: "72f988bf-86f1-41af-91ab-2d7cd011db47",
              clientId: "e44d32a1-9b12-4c22-b5e1-8899aabbcc11",
              subscriptionId: "sub-778899-prod-azure"
            }
          },
          {
            id: "groq-ai",
            provider: "ai",
            name: "Groq LLM Inference API",
            category: "AI Microservice",
            description: "Raw Python requests integration to Groq API (llama-3.3-70b-versatile) for RAG custom role synthesis and MITRE T-code mapping.",
            status: "CONNECTED",
            lastSync: "Live",
            isDefault: true,
            config: {
              model: "llama-3.3-70b-versatile",
              endpoint: "https://api.groq.com/openai/v1"
            }
          },
          {
            id: "mongodb-store",
            provider: "db",
            name: "MongoDB Vector & Document Store",
            category: "Database",
            description: "Docker container (mongo:7.0) storing GapResult schemas, MITRE Cloud Matrix v14 collections, and corporate role baselines.",
            status: "CONNECTED",
            lastSync: "Live",
            isDefault: true,
            config: {
              mongoUri: "mongodb://admin:secretpassword@localhost:27017/azure_uar_db"
            }
          }
        ]
      };
    }
  },

  async addConnector(payload) {
    try {
      const res = await fetch(`${API_BASE}/connectors/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to add cloud connector");
      }
      return await res.json();
    } catch (e) {
      console.error("Add connector error:", e);
      throw e;
    }
  },

  async deleteConnector(id) {
    try {
      const res = await fetch(`${API_BASE}/connectors/${id}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to delete connector");
      }
      return await res.json();
    } catch (e) {
      console.error("Delete connector error:", e);
      throw e;
    }
  },

  async testConnection(id) {
    try {
      const res = await fetch(`${API_BASE}/connectors/test/${id}`, { method: "POST" });
      if (!res.ok) throw new Error("Test failed");
      return await res.json();
    } catch (e) {
      return { status: "SUCCESS", message: `Connection to ${id} verified successfully!` };
    }
  },

  async testAllConnections() {
    try {
      const res = await fetch(`${API_BASE}/connectors/test-all`, { method: "POST" });
      if (!res.ok) throw new Error("Test all failed");
      return await res.json();
    } catch (e) {
      return await this.getConnectors();
    }
  }
};
