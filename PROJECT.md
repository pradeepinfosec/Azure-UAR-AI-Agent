# Azure UAR AI Agent — Project Architecture

> **Azure UAR AI Agent** is an automated cloud identity security platform designed as an enterprise module for the CompliView ecosystem, comprising two integrated capability domains:
> 1. **Telemetry & Gap Analysis** — extraction of Entra ID assignments, AWS IAM/STS bridges, and 90-day Azure Activity logs to deterministically identify unused permissions.
> 2. **AI-Based Remediation Engine** — MITRE ATT&CK threat mapping, RAG-powered custom role synthesis via Groq API, and Human-in-the-Loop (HITL) execution with Executive Attestation Reporting.

---

## Tech Stack Overview

| Layer | Technology |
|---|---|
| Frontend | React 18 (Vite), Tailwind CSS, Lucide Icons, jsPDF & jsPDF-AutoTable |
| Backend | FastAPI (Python 3.12), Pydantic Models |
| Infrastructure Interface | Azure CLI (`az`), Azure Log Analytics SDK (`azure-monitor-query`), Entra ID, AWS STS / IAM |
| AI Microservice | Groq API (LLM Inference: `llama-3.3-70b-versatile`), Raw HTTP requests |
| Database / Vector Store | MongoDB (Docker Container for Document store, GapResults, and Vector Search) |

---

# Domain 1 — Telemetry & Gap Analysis

> Pipeline: **Discovery → Telemetry Query → Gap Calculation**

---

## 1. Discovery & Role Baseline

**Purpose:** Master extraction of all Entra ID user assignments, directory-level admin roles, and Azure RBAC role definitions to establish the provisioned baseline.

### Engine Files
| File | Role |
|---|---|
| `identity_mapper.py` | Executes `az ad user list` and `az role assignment list` via `subprocess` |
| `role_definition_service.py` | Maps built-in and custom role definitions to exact ARM `actions` / `dataActions` |
| `az_role_scraper.sh` | Extracts `actions` and `notActions` from `az role definition list` |

### Key Attributes Extracted
- **Assignee Scope**: Management Group / Subscription / Resource Group
- **Principal Details**: User Principal Name (UPN), Object ID, Member vs Guest classification
- **Role Hierarchies**: Entra ID Directory Roles (`Global Administrator`, `User Administrator`) separated from Subscription IAM Roles (`Owner`, `Contributor`, `Reader`).
- **Provisioned Actions**: Array of allowed Azure Resource Manager (ARM) operations.

---

## 2. Telemetry Query

**Purpose:** Query the Azure Log Analytics Workspace (LAW) to extract actual operational usage over a 90-day retention period.

### Engine Files
| File | Role |
|---|---|
| `law_client.py` | Authenticates to LAW and executes KQL payloads via REST / CLI |
| `identity_controller.py` | Uses `azure-monitor-query` and `azure-identity` Python SDKs to query the `AzureActivity` table |
| `azure_activity.kql` | Kusto Query Language script grouping `OperationName` by `Caller` |

### Key Metrics Tracked
- **OperationName**: The exact ARM API calls executed by the user.
- **Execution Count**: Frequency of the operation.
- **Last Authenticated**: Timestamp of the most recent API call.

---

## 3. Gap Calculation & Risk Scoring

**Purpose:** Perform a deterministic diff between the provisioned `actions` (Discovery) and the executed `OperationName` array (Telemetry), evaluating against 68 MITRE ATT&CK Cloud Matrix controls and 20 security policies.

### Engine Files
| File | Role |
|---|---|
| `gap_analyzer.py` | Matrix comparison script returning the precise array of unused permissions |
| `risk_scoring_engine.py` | 20-rule policy evaluation and MITRE Cloud Matrix v14 gap scorer |
| `GapResult.schema.json` | JSON schema defining the payload saved to MongoDB |

---

# Domain 2 — AI-Based Remediation Engine

> Pipeline: **MITRE Mapping → RAG Synthesis → Web UI Approval → JIT Execution → Executive PDF Report**

---

## 1. MITRE ATT&CK Threat Mapping

**Purpose:** Map identified unused permissions to specific attacker tactics to quantify the threat landscape and prioritize reviews.

### Threat Mapping Examples
- Unused `*` permissions at directory level $\rightarrow$ **Account Manipulation (T1098)**
- Unused `Microsoft.Storage/*` $\rightarrow$ **Data from Cloud Storage Object (T1530)**
- Unused `Microsoft.KeyVault/*` $\rightarrow$ **Credentials in Files / Valid Accounts (T1078)**

---

## 2. RAG Synthesis via Groq API

**Purpose:** Query corporate baselines stored in MongoDB and use the Groq API to generate a least-privilege Azure Custom Role JSON document.

### Engine Files
| File | Role |
|---|---|
| `rag_engine.py` | Executes MongoDB Vector Search to retrieve internal naming conventions |
| `role_template_generator.py` | Direct Groq API prompting (`llama-3.3-70b-versatile`) to synthesize the JSON custom role |

---

## 3. Standalone Web UI & JIT Execution

**Purpose:** Present synthesized least-privilege role definitions to security administrators for Human-in-the-Loop (HITL) review, provide real-time multi-cloud account management, and execute Just-In-Time (JIT) Azure RBAC updates.

### Key Web UI Pages & Components
- **Executive Security Dashboard (`Dashboard.jsx`)**: Real-time telemetry KPIs, risk distribution charts, and over-privileged user rankings with a top-right Light/Dark mode switcher.
- **Collapsible Sidebar (`App.jsx`)**: Sidebar toggle button with smooth width transition and auto-expand on mouse hover in collapsed mode.
- **Identity Directory (`Directory.jsx`, `IdentityList.jsx`)**: Master user baseline showing Entra ID roles, Subscription roles, usage metrics, and live Azure role scraper trigger.
- **Assessment Hub (`AssessmentHub.jsx`, `RiskRegister.jsx`)**: High-density risk register evaluating all monitored identities across 68 MITRE ATT&CK controls and 20 security policies.
- **AI Remediation Engine (`Remediation.jsx`, `ReviewModal.jsx`)**: HITL approval dashboard for Groq RAG synthesized custom roles with side-by-side JSON approval. Clicking **"Approve & Execute JIT"** automatically applies `az role definition create` and re-assigns the principal.
- **Cloud Connectors & Multi-Cloud Integrations (`Connectors.jsx`, `connector_controller.py`)**: Full management interface to add, test, and persist **Microsoft Azure** subscriptions/tenants and **Amazon Web Services (AWS)** accounts (IAM Access Keys & STS AssumeRole ARN).
- **User Access Review (UAR) Executive Report (`AccessReviewReport.jsx`, `PdfReportService.js`)**: Structured attestation table with one-click **"Generate Executive Report"** creating multi-page executive PDF reports embedding telemetry KPIs, risk distribution charts, review decisions, MITRE threat mappings, and formal ISO 27001 / SOC 2 compliance sign-offs.

---

## Folder Structure

```
├── fe/                                  # Frontend (React 18, Vite, Tailwind CSS)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/                  # Button, Modal (createPortal), Loader
│   │   │   ├── dashboard/               # KPICard, RiskDistribution
│   │   │   ├── directory/               # IdentityList
│   │   │   └── assessment/              # RiskRegister, ReviewModal
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx            # Executive Security Dashboard
│   │   │   ├── Directory.jsx            # Identity Directory & Baseline
│   │   │   ├── AssessmentHub.jsx        # Assessment Hub & Policy Rules
│   │   │   ├── Remediation.jsx          # AI Remediation Engine (HITL)
│   │   │   ├── Connectors.jsx           # Cloud Connectors (Azure & AWS)
│   │   │   ├── AccessReviewReport.jsx   # User Access Review (UAR) Executive Report
│   │   │   └── Reporting.jsx            # Compliance Reports Hub
│   │   ├── services/                    # API client wrappers
│   │   │   ├── DashboardService.js
│   │   │   ├── IdentityService.js
│   │   │   ├── AssessmentService.js
│   │   │   ├── ConnectorService.js
│   │   │   └── PdfReportService.js      # Executive PDF Report Generator
│   │   ├── App.jsx                      # Navigation, Hover Sidebar & Theme Switcher
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── be/                                  # Backend (FastAPI, Python 3.12)
│   ├── app/
│   │   ├── api/                         # REST API Controllers
│   │   │   ├── dashboard_controller.py
│   │   │   ├── identity_controller.py
│   │   │   ├── assessment_controller.py
│   │   │   ├── policy_controller.py
│   │   │   └── connector_controller.py  # Multi-Cloud Azure & AWS Controller
│   │   ├── services/                    # Core Business Logic
│   │   │   ├── role_definition_service.py # Built-in & Custom ARM Role Mapper
│   │   │   ├── gap_analyzer.py          # Diffs provisioned vs. used operations
│   │   │   ├── risk_scoring_engine.py   # 20-rule policy & MITRE evaluation
│   │   │   └── azure_remediator.py      # JIT execution wrapper
│   │   ├── core/                        # Config, DB connection, Security
│   │   │   ├── config.py
│   │   │   └── db.py
│   │   └── main.py                      # FastAPI application entry point
│   ├── requirements.txt
│   └── .env                             # GROQ_API_KEY, MONGO_URI, LOG_ANALYTICS_WORKSPACE_ID
│
├── infra/                               # Infrastructure, Telemetry & Scripts
│   ├── docker/
│   │   └── docker-compose.yml           # MongoDB container config
│   ├── scripts/
│   │   ├── az_role_scraper.sh           # Extracts role definitions via CLI
│   │   ├── execute_remediation.sh       # Shell wrapper for Azure CLI execution
│   │   └── create_mitre_test_users.py   # Provisions test users with MITRE mappings
│   ├── telemetry/
│   │   ├── kql_queries/
│   │   │   └── azure_activity.kql       # LAW telemetry extraction query
│   │   ├── law_client.py                # Authenticates and runs KQL against LAW
│   │   └── identity_mapper.py           # Extracts az ad user list and RBACs
│   └── schemas/
│       ├── GapResult.schema.json
│       └── role_definition_schema.json
│
└── ai/                                  # AI Microservice & Prompts (Groq Integration)
    ├── prompts/
    │   ├── system_prompt_mitre.txt      # Instructions for MITRE ATT&CK mapping
    │   └── system_prompt_role_gen.txt   # Instructions for least-privilege JSON synthesis
    ├── services/
    │   ├── groq_client.py               # Raw requests implementation for Groq API
    │   ├── mitre_mapper.py              # Maps unused permissions to T-codes
    │   └── role_template_generator.py   # Synthesizes custom_role.json
    ├── data/
    │   └── mitre_cloud_v14.json         # MITRE Cloud matrix for DB seeding
    └── tests/
        └── test_ai_synthesis.py         # Unit tests for Groq responses
```