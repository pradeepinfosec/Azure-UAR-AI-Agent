# Azure UAR AI Agent — Workflow Specifications

> End-to-end execution pipelines, data flow specifications, and operational stage handoffs for **Domain 1 (Telemetry & Gap Analysis)** and **Domain 2 (AI-Based Remediation Engine)**.

---

## Domain 1 Workflow: Telemetry & Gap Analysis

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   1. Discovery  │ ───> │2. Telemetry Query│ ───> │3. Gap Calculation│
└─────────────────┘      └─────────────────┘      └─────────────────┘
 identity_mapper.py       law_client.py            gap_analyzer.py
 role_definition_service  azure_activity.kql       risk_scoring_engine
 az_role_scraper.sh                                GapResult.schema.json
```

### Stage 1: Discovery Pipeline
1. **Identity & Role Extraction**: `identity_mapper.py` calls `az ad user list` and `az role assignment list` via `subprocess` to gather Entra ID user assignments across scopes (Management Group, Subscription, Resource Group).
2. **Permission Parsing**: `role_definition_service.py` extracts provisioned `actions`, `notActions`, `dataActions`, and `notDataActions` arrays from Azure RBAC and Entra ID directory roles.
3. **Provisioned Baseline Data Store**: Outputs structured JSON mapping every principal to their provisioned ARM API rights.

### Stage 2: Telemetry Query Pipeline
1. **LAW Authentication & KQL Execution**: `law_client.py` uses the `azure-monitor-query` Python SDK to authenticate and execute robust data-plane queries against the workspace.
2. **Usage Log Aggregation**: Runs `kql_queries/azure_activity.kql` over a 90-day retention window.
3. **Metrics Extracted**: Groups executed ARM API calls (`OperationName`) by `Caller`, exact execution counts, and precise `Last Authenticated` timestamps.

### Stage 3: Gap Calculation Pipeline
1. **Deterministic Matrix Comparison**: `gap_analyzer.py` calculates the relative complement:
   $$\text{Unused Permissions} = \text{Provisioned Actions} \setminus \text{Executed OperationNames}$$
2. **Risk & Policy Evaluation**: `risk_scoring_engine.py` evaluates 20 security policies and scores vulnerabilities against 68 MITRE ATT&CK Cloud Matrix controls.
3. **Database Insertion**: Persists gap results to MongoDB document store for remediation consumption.

---

## Domain 2 Workflow: AI-Based Remediation Engine

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ 1. MITRE Mapping │ ──> │ 2. RAG Synthesis │ ──> │3. Web UI Review  │ ──> │ 4. JIT Execution │
└──────────────────┘     └──────────────────┘     └──────────────────┘     └──────────────────┘
  mitre_mapper.py          rag_engine.py            Remediation.jsx          azure_remediator.py
  MongoDB mitre_cloud      role_template_generator  ReviewModal.jsx          role_definition_schema
```

### Stage 1: MITRE ATT&CK Threat Mapping Pipeline
1. **Gap Input Processing**: Consumes unused permission arrays from MongoDB `GapResult`.
2. **Attacker Tactic Lookup**: `mitre_mapper.py` queries MongoDB (`mitre_cloud_v14`) and prompts Groq API to categorize risks.
3. **Threat Scoring Examples**:
   - Directory-wide `*` permissions $\rightarrow$ **Account Manipulation (T1098)**
   - Unused `Microsoft.Storage/*` $\rightarrow$ **Data from Cloud Storage Object (T1530)**
   - Unused `Microsoft.KeyVault/*` $\rightarrow$ **Valid Accounts / Credentials in Files (T1078)**

### Stage 2: RAG Synthesis via Groq API Pipeline
1. **Vector Context Retrieval**: `rag_engine.py` performs MongoDB Vector Search to retrieve corporate role naming conventions and policy baselines.
2. **Direct LLM Prompting**: `role_template_generator.py` constructs a raw POST payload to the Groq API (`llama-3.3-70b-versatile`).
3. **JSON Custom Role Output**: Groq API returns a valid Azure Custom Role definition JSON containing only explicitly needed permissions.

### Stage 3: Standalone Web UI & HITL Approval Pipeline
1. **Executive Security Dashboard**: `Dashboard.jsx` exposes high-level telemetry KPIs, risk breakdown charts, and top over-privileged identities with a top-right Light/Dark theme toggle.
2. **Collapsible Sidebar**: `App.jsx` features an interactive sidebar toggle button with smooth width transitions and auto-expand on mouse hover in collapsed mode.
3. **Identity Directory & Role Baseline**: `Directory.jsx` and `IdentityList.jsx` present Entra ID roles and Subscription roles with live Azure role scraper trigger.
4. **Assessment Hub Page**: `AssessmentHub.jsx` and `RiskRegister.jsx` display a tabular register evaluating all 28 tenant identities across 68 MITRE ATT&CK controls and 20 security policies.
5. **AI Remediation Engine Page (HITL)**: `Remediation.jsx` provides a dedicated Human-in-the-Loop approval dashboard for Groq RAG Synthesized Azure Custom Roles. Clicking **"Approve & Execute JIT"** triggers automatic Azure ARM custom role creation and assignment.
6. **Cloud Connectors & Multi-Cloud Integrations**: `Connectors.jsx` and `connector_controller.py` enable connecting, configuring, testing, and managing **Azure Subscriptions/Tenants** and **AWS Accounts** (IAM Access Keys & STS AssumeRole ARN).
7. **User Access Review (UAR) Executive Report**: `AccessReviewReport.jsx` presents an executive attestation table with one-click **"Generate Executive Report"** creating multi-page executive PDF reports embedding telemetry KPIs, risk distribution charts, review decisions, MITRE threat mappings, and formal ISO 27001 / SOC 2 compliance sign-offs.

### Stage 4: JIT Execution Pipeline
1. **Payload Validation**: `azure_remediator.py` validates custom role JSON against `role_definition_schema.json`.
2. **Azure RBAC Provisioning**: Creates custom role definition in Azure via `az role definition create`.
3. **Assignment Update**: Replaces over-privileged role assignment with the newly created least-privilege role for the target principal.

---

## Related Documentation & Build Instructions
- [USE_CASES.md — Executable Use Cases & MITRE ATT&CK Testing Guide](./USE_CASES.md)
- [README.md — How to Build & Run the Project](./README.md#how-to-build--run-the-project)
- [PROJECT.md — Complete Architecture Specifications](./PROJECT.md)
