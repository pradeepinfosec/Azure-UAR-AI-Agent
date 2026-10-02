# Azure UAR AI Agent — Executable Use Cases & Testing Guide

> Practical, hands-on execution scenarios for provisioning test Entra ID users, executing 90-day telemetry gap queries, synthesizing Groq RAG custom roles, managing multi-cloud connectors, and applying Just-In-Time (JIT) Azure RBAC remediations.

---

## 1. Provisioning Test Identities Mapped to MITRE ATT&CK Techniques

Use the provided script [`create_mitre_test_users.py`](./infra/scripts/create_mitre_test_users.py) to automatically provision test Entra ID users with specific over-privileged Azure RBAC roles mapped to MITRE Cloud Matrix threat vectors.

### Executable Command
```bash
python infra/scripts/create_mitre_test_users.py
```

### Test Identities Created

| User Principal Name (UPN) | Provisioned Azure RBAC Role | Target MITRE Technique | Threat Description |
|---|---|---|---|
| `mitre-admin@yourdomain` | `Owner` (Subscription Scope) | **Account Manipulation (T1098)** | Wildcard `*` permission over control plane & identity management |
| `mitre-dev@yourdomain` | `Contributor` (Resource Group) | **Data from Cloud Storage Object (T1530)** | Contains unused `Microsoft.Storage/*` data plane access |
| `mitre-contractor@yourdomain` | `Owner` (Staging RG) | **Valid Accounts / Dormant Access (T1078)** | 90-day dormant third-party account with zero API executions |

---

## 2. Infrastructure Setup: Diagnostic Log Archiving & Workspace Connection

Run the following infrastructure scripts to properly route your Azure Activity Logs to both a long-term Storage Account archive and your Log Analytics Workspace for real-time querying by the Python backend.

### Executable Commands
```bash
# 1. Provision Storage Account and route logs for cold-storage compliance
bash "infra/scripts/AZ CLI scripts/4. Configure Storage Logs.sh"

# 2. Fix/ensure Activity Logs are routed to the Log Analytics Workspace for KQL querying
bash "infra/scripts/AZ CLI scripts/5. Fix Workspace Logs.sh"
```

---

## 3. Telemetry Extraction & Permission Gap Calculation

After provisioning test identities, run the discovery and telemetry scripts to query live Entra ID RBAC assignments and 90-day Azure Log Analytics Workspace (LAW) activity logs.

### Executable Commands
```bash
# 1. Extract Entra ID user assignments and RBAC definitions
python infra/telemetry/identity_mapper.py

# 2. Query 90-day ARM operation logs via KQL
python infra/telemetry/law_client.py
```

### Expected Output
The system performs a deterministic matrix complement:
$$\text{Unused Permissions} = \text{Provisioned Actions} \setminus \text{Executed OperationNames}$$
Output JSON payloads are persisted to the MongoDB document store under the `GapResult` collection.

---

## 4. Multi-Cloud Connectors & Account Onboarding

Connect and validate multi-cloud environments directly from the **Cloud Connectors & Integrations** page:

1. **Azure Subscriptions / Entra Tenants**:
   - Provide Account Display Name, Directory (Tenant) ID, Application (Client) ID, Client Secret, and Subscription ID.
   - Click **"Test Connection"** to verify ARM/Entra connectivity.
2. **AWS Accounts (IAM & STS)**:
   - Provide AWS Account Display Name, 12-digit Account ID, and choose between **IAM Access Keys** or **Cross-Account STS Role ARN**.
   - Specify the target AWS Region (e.g., `us-east-1`, `eu-west-1`, `ap-south-1`).
   - Click **"Connect AWS Account"** to validate credentials and enable CloudTrail/IAM posture monitoring.

---

## 5. Groq RAG AI Least-Privilege Custom Role Synthesis

Execute the AI synthesis engine to generate a least-privilege Azure Custom Role JSON document (`custom_role.json`) that strips out all unused permissions and MITRE threat vectors while preserving necessary operational rights.

### Executable Command
```bash
python ai/services/role_template_generator.py
```

### Synthesis Handoff
1. Vector Search retrieves matching corporate role baselines from MongoDB.
2. Raw POST request is sent to Groq API (`llama-3.3-70b-versatile`).
3. Synthesized JSON output is formatted according to `role_definition_schema.json`.

---

## 6. Just-In-Time (JIT) Azure RBAC Remediation

Run the shell wrapper script [`execute_remediation.sh`](./infra/scripts/execute_remediation.sh) or click **"Approve & Execute JIT"** in the Web UI:

### Executable Command
```bash
bash infra/scripts/execute_remediation.sh custom_role.json <PRINCIPAL_OBJECT_ID> <SCOPE>
```

### Remediation Steps Executed
1. `az role definition create --role-definition custom_role.json`
2. `az role assignment create --assignee <PRINCIPAL_OBJECT_ID> --role <NEW_ROLE_ID> --scope <SCOPE>`

---

## 7. Web UI Human-in-the-Loop (HITL) Review & Attestation

Launch the standalone React Web UI to visually inspect risk gaps, review side-by-side JSON role diffs, and generate executive attestation reports.

### Web UI Endpoint
```
http://localhost:3000
```

### Interactive Handoffs
- **Executive Security Dashboard (`Dashboard.jsx`)**: Monitor real-time telemetry KPIs, risk distribution bars, and over-privileged identities with Light/Dark mode.
- **Identity Directory (`Directory.jsx`)**: Review Entra ID Directory Roles, Subscription IAM Roles, and trigger live role scraping.
- **Assessment Hub (`AssessmentHub.jsx`)**: Inspect the 68 MITRE ATT&CK controls and 20-rule policy evaluation register.
- **AI Remediation (`Remediation.jsx`)**: Approve AI-synthesized least-privilege custom roles in the HITL Enforcement Queue with one-click **"Approve & Execute JIT"**.
- **Cloud Connectors (`Connectors.jsx`)**: Manage and test live Azure and AWS accounts.
- **User Access Review Report (`AccessReviewReport.jsx`)**: Perform periodic entitlement reviews and click **"Generate Executive Report"** to export signed ISO 27001 / SOC 2 PDF attestation logs embedding full security dashboards.

---

## Related Documentation
- [README.md — Project Overview & Quick Start](./README.md)
- [PROJECT.md — Complete Architecture Specifications](./PROJECT.md)
- [WORKFLOW.md — Operational Execution Pipelines](./WORKFLOW.md)
