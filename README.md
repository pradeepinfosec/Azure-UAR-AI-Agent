# Azure UAR AI Agent

> **Azure UAR AI Agent** is an enterprise-grade, automated multi-cloud identity security and entitlement governance platform designed for continuous Least-Privilege enforcement and compliance attestation across **Microsoft Azure (Entra ID & Resource Manager)** and **Amazon Web Services (AWS IAM & STS)**.

---

## Tech Stack Overview

| Layer | Technology |
|---|---|
| Frontend | React 18 (Vite), Tailwind CSS, Lucide Icons, jsPDF & jsPDF-AutoTable |
| Backend | FastAPI (Python 3.12), Pydantic Settings |
| Infrastructure Interface | Azure CLI (`az`), Azure Log Analytics SDK (`azure-monitor-query`), Entra ID, AWS STS / IAM |
| AI Microservice | Groq API (LLM Inference: `llama-3.3-70b-versatile`), Raw HTTP requests |
| Database & Vector Store | MongoDB (Docker Container for Document store, GapResults, and Vector Search) |

---

## Key Features & UI Capabilities

- **Executive Security Dashboard**: Real-time security intelligence telemetry, KPI trend cards, risk distribution bars, and top over-privileged identities with an integrated Light/Dark theme switcher.
- **Collapsible & Hover-Responsive Sidebar**: Quick-access sidebar toggle button with smooth width transitions and auto-expand on mouse hover in collapsed mode.
- **Identity Directory & Role Baseline**: Granular extraction of Entra ID Directory Roles (`Global Administrator`, `User Administrator`) and Subscription IAM Roles (`Owner`, `Contributor`, `Reader`), complete with a live Azure Role Scraper trigger.
- **Assessment Hub & 68 MITRE Controls**: High-density risk register evaluating all monitored identities against 68 MITRE ATT&CK Cloud Matrix controls, 20 corporate policy rules, and 90-day KQL operational telemetry.
- **AI Remediation Engine (HITL)**: Human-in-the-Loop approval dashboard for Groq RAG-synthesized Azure Custom Roles. Clicking **"Approve & Execute JIT"** automatically prunes unused attack vectors, deploys the custom role definition via `az role definition create`, and re-assigns the principal.
- **Cloud Connectors & Multi-Cloud Integrations**: Complete account management for adding, testing, and persisting **Azure Subscriptions/Tenants** and **AWS Accounts** (IAM Access Keys & Cross-Account STS AssumeRole ARN).
- **User Access Review (UAR) Executive Report**: Structured attestation table with one-click **"Generate Executive Report"** creating multi-page executive PDF reports embedding telemetry KPIs, risk distribution charts, review decisions, MITRE threat mappings, and formal ISO 27001 / SOC 2 compliance sign-offs.

---

## Architecture Summary

### Domain 1 — Telemetry & Gap Analysis
Pipeline: **Discovery → Telemetry Query → Gap Calculation**

| Stage | Key Files |
|---|---|
| Discovery | `identity_mapper.py`, `role_definition_service.py`, `az_role_scraper.sh` |
| Telemetry Query | `law_client.py` via `azure-monitor-query` SDK, `azure_activity.kql` |
| Gap Calculation | `gap_analyzer.py`, `risk_scoring_engine.py`, `GapResult.schema.json` |

### Domain 2 — AI-Based Remediation Engine
Pipeline: **MITRE Mapping → RAG Synthesis → Web UI Approval → JIT Execution**

| Stage | Key Files |
|---|---|
| MITRE Mapping | `mitre_mapper.py`, MongoDB collection (`mitre_cloud_v14`) |
| RAG Synthesis | `rag_engine.py` (Vector Search), `role_template_generator.py` (Groq API) |
| Standalone Web UI | `Dashboard.jsx`, `Directory.jsx`, `AssessmentHub.jsx`, `Remediation.jsx`, `Connectors.jsx`, `AccessReviewReport.jsx` |
| JIT Execution | `azure_remediator.py`, `assessment_controller.py`, `role_definition_schema.json` |
| Executive Reporting | `PdfReportService.js`, `Reporting.jsx` |

---

## How to Build & Run the Project

### Prerequisites
- **Node.js**: `v18.0.0` or higher & `npm`
- **Python**: `v3.12` or higher & `pip`
- **Docker & Docker Compose**: For local MongoDB container
- **Azure CLI (`az`)**: Authenticated to Azure tenant (`az login`) for live RBAC/LAW extraction

---

### Working Directories & Python Execution Matrix

| Task | Target Directory (CWD) | Command |
|---|---|---|
| **1. Docker DB Setup** | `Azure UAR AI Agent/infra/docker` | `docker-compose up -d` |
| **2. Backend Setup & Venv** | `Azure UAR AI Agent/be` | `python -m venv venv` |
| **2. Backend Venv Activation (PowerShell)** | `Azure UAR AI Agent/be` | `.\venv\Scripts\activate` |
| **2. Backend Venv Activation (Git Bash / Linux)** | `Azure UAR AI Agent/be` | `source venv/Scripts/activate` (or `source venv/bin/activate`) |
| **2. Backend Server Run** | `Azure UAR AI Agent/be` | `uvicorn app.main:app --reload --port 8000` |
| **3. AI Microservice Tests (Option A - Root)** | `Azure UAR AI Agent/` (Root) | `python -m unittest discover -s ai/tests` |
| **3. AI Microservice Tests (Option B - ai/)** | `Azure UAR AI Agent/ai` | `python tests/test_ai_synthesis.py` |
| **4. Frontend App Run** | `Azure UAR AI Agent/fe` | `npm install` && `npm run dev` |
| **5. Telemetry Extraction** | `Azure UAR AI Agent/` (Root) | `python infra/telemetry/identity_mapper.py` |

---

### Step-by-Step Execution Guide

#### Step 1: Launch Infrastructure Services (`infra/docker/`)
* **Working Directory**: `infra/docker`
* **Commands**:
  ```bash
  cd infra/docker
  docker-compose up -d
  ```
* **Verify**: MongoDB running on `localhost:27017` with credentials `admin:secretpassword`.

---

#### Step 2: Configure & Run Backend Microservice (`be/`)
* **Working Directory**: `be`
* **Commands**:
  ```bash
  cd be
  python -m venv venv
  # On Windows PowerShell:
  .\venv\Scripts\activate
  # On Linux/macOS:
  # source venv/bin/activate
  pip install -r requirements.txt
  ```
* **Configure Environment (`be/.env`)**:
  #```env
  #GROQ_API_KEY=gsk_your_groq_api_key_here
  #MONGO_URI=mongodb://admin:secretpassword@localhost:27017/azure_uar_db?authSource=admin
  #LOG_ANALYTICS_WORKSPACE_ID=your-actual-workspace-uuid-here
  #PORT=8000
  #ENVIRONMENT=development
  #```
* **Start Server**:
  ```bash
  uvicorn app.main:app --reload --port 8000
  ```
* **Verify**: Interactive API documentation active at [http://localhost:8000/docs](http://localhost:8000/docs).

---

#### Step 3: Run AI Microservice Unit Tests (`ai/`)
```bash
python -m unittest discover -s ai/tests
```

---

#### Step 4: Configure & Launch Standalone Web UI (`fe/`)
* **Working Directory**: `fe`
* **Commands**:
  ```bash
  cd fe
  npm install
  npm run dev
  ```
* **Verify**: Web application running at [http://localhost:3000](http://localhost:3000).

---

#### Step 5: Execute Telemetry & Discovery Pipeline (`infra/telemetry/`)
* **Working Directory**: Project Root
* **Commands**:
  ```bash
  # Scrape all Azure RBAC role definitions (actions & dataActions)
  python infra/scripts/az_role_scraper.py

  # Execute Entra ID user & assignment extraction
  python infra/telemetry/identity_mapper.py

  # Execute 90-day Azure Log Analytics Workspace query
  python infra/telemetry/law_client.py
  ```

---

## Related Documentation
- [PROJECT.md](./PROJECT.md) — Comprehensive technical architecture & component specifications.
- [WORKFLOW.md](./WORKFLOW.md) — End-to-end execution pipelines & data flows.
- [USE_CASES.md](./USE_CASES.md) — Executable use cases, MITRE ATT&CK test provisioning & hands-on testing guide.
