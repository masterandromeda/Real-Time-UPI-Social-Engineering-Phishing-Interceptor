<div align="center">

<img src="https://img.shields.io/badge/UPI%20Sentinel-AI%20Scam%20Interceptor-3B82F6?style=for-the-badge&logo=shield&logoColor=white" alt="UPI Sentinel"/>

# 🛡️ UPI Sentinel — Predictive Scam Interceptor

### *Detect Early. Intercept Before Authorization. Protect Every User.*

[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Python](https://img.shields.io/badge/Python_3.13-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

</div>

---

## 🎯 Problem Statement

India processes **over 13 billion UPI transactions monthly**. Social-engineering scams — where fraudsters impersonate bank officials, create urgency, deliver phishing links, and push victims into authorizing UPI payments — account for a significant portion of digital fraud losses.

> **Most fraud detection systems identify suspicious transactions *after* the money moves.**
> 
> **UPI Sentinel identifies the social-engineering attack *journey* — and intervenes *before* authorization.**

---

## 💡 Our Solution

UPI Sentinel is an **AI-native predictive scam interception platform** that analyzes:

| Signal | What We Detect |
|--------|---------------|
| 📞 **Call Intelligence** | Impersonation, urgency, fear, OTP requests in transcripts |
| 🔗 **Link Intelligence** | Phishing URLs, UPI deep-link abuse, malware domains |
| 📱 **Device Guardian** | Remote-access app indicators, risky permission combinations |
| 🧠 **Scam Prediction** | Multi-signal correlation → predicted next attack stage |
| 🚨 **Safety Intervention** | Pre-authorization warning + simulated protective hold |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS 16 FRONTEND                       │
│  Landing Page · 14-Page Console · Real-Time WebSocket UI    │
└──────────────────────┬──────────────────────────────────────┘
                       │  REST + WebSocket (port 8001)
┌──────────────────────▼──────────────────────────────────────┐
│                   FASTAPI BACKEND                            │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Orchestrator │  │   7 AI Agent │  │  Risk Engine v1  │  │
│  │    Agent     │→ │   Pipeline   │→ │  (Deterministic) │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌─────────────┐  │
│  │Sarvam AI │ │ URLhaus  │ │VirusTotal │ │   OpenAI    │  │
│  │  (STT)   │ │(Malware) │ │(Reputation│ │(Explanation)│  │
│  └──────────┘ └──────────┘ └───────────┘ └─────────────┘  │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          SQLite (dev) / PostgreSQL (prod)            │   │
│  │              Alembic Migrations                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## ✨ Five Core Innovations

### 1. 📞 Call Intelligence Agent
Analyzes consent-based conversation transcripts to detect:
- Bank/government impersonation patterns
- Urgency and time-pressure tactics
- Fear-based language (Hindi, Punjabi, Hinglish, English)
- OTP/PIN/password request indicators

### 2. 🔗 Link Intelligence Agent  
Scans suspicious URLs and UPI deep links via:
- Structural URL risk analysis (suspicious TLDs, patterns)
- **URLhaus** malware intelligence lookup
- **VirusTotal** multi-engine reputation scanning
- UPI deep-link parameter dissection

### 3. 📱 Device Guardian Agent
Evaluates user-provided device risk evidence:
- Remote-access app detection (AnyDesk, TeamViewer, etc.)
- Dangerous permission combinations
- Screen-sharing and device-admin indicators

### 4. 🧠 Scam Prediction Agent
Correlates all three signals using a **deterministic weighted risk engine**:
- Call (30%) + Link (35%) + Device (25%) + Sequence (10%)
- Predicts current scam stage: Initial Contact → Payment Extraction
- AI confidence scoring

### 5. 🚨 Safety Intervention Agent
Delivers actionable protective guidance:
- Risk-level-appropriate warnings
- Evidence-backed recommendations
- Simulated pre-authorization safety hold interface

---

## 🤖 Seven-Agent AI Pipeline

```
User Input
    │
    ▼
┌─────────────────────────┐
│  Central Orchestrator   │ ← Routes events, coordinates pipeline
└────────────┬────────────┘
             │
    ┌────────┼────────┐
    ▼        ▼        ▼
┌───────┐ ┌───────┐ ┌────────┐
│ Call  │ │ Link  │ │Device  │  ← Parallel analysis agents
│Intel  │ │Intel  │ │Guardian│
└───┬───┘ └───┬───┘ └───┬────┘
    └────────┬┘          │
             ▼           │
      ┌────────────┐     │
      │    Scam    │ ◄───┘  ← Risk correlation
      │ Prediction │
      └─────┬──────┘
            │
      ┌─────▼──────┐
      │Explanation │  ← OpenAI explanation layer
      │   Agent    │
      └─────┬──────┘
            │
      ┌─────▼──────────┐
      │    Safety      │  ← Intervention recommendation
      │ Intervention   │
      └────────────────┘
```

---

## 📊 Real-Time Dashboard

The **Command Center Console** features:

| Module | Functionality |
|--------|--------------|
| 🏠 Overview | Live KPIs, agent status, security event timeline |
| 📡 Live Agent Monitor | WebSocket agent states, execution logs, event timeline |
| 📞 Call Intelligence | Transcript submission → real AI analysis → risk results |
| 🔗 Link Intelligence | URL scan → URLhaus + VirusTotal → risk report |
| 📱 Device Guardian | Evidence submission → device risk scoring |
| 🧠 Scam Prediction | Signal correlation → stage prediction |
| 🚨 Safety Intervention | Demo scenarios + simulated safety holds |
| 🏢 Organizations | Multi-org management |
| 📈 Business Analytics | Security trends, risk distribution |
| 🔌 API & Integrations | Live integration health status |
| 💳 Billing | Subscription management |
| 📋 Reports | PDF + JSON export with 22 Indian language support |
| ⚙️ Settings | User preferences |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16.4 | App framework with App Router |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Utility-first styling |
| Lucide React | Latest | Icons |
| shadcn/ui patterns | — | Component patterns |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| FastAPI | 0.115 | API framework |
| Python | 3.13 | Runtime |
| SQLAlchemy | 2.x async | ORM |
| Alembic | Latest | DB migrations |
| SQLite / PostgreSQL | — | Persistence |
| Pydantic v2 | 2.x | Validation |
| ReportLab | Latest | PDF generation |
| python-docx | Latest | DOCX reports |

### External APIs
| API | Purpose |
|-----|---------|
| **Sarvam AI** | Hindi/Punjabi/Hinglish STT + NLU |
| **URLhaus** | Malware URL intelligence |
| **VirusTotal** | Multi-engine URL reputation |
| **OpenAI GPT-4o-mini** | Explanation generation (NOT risk scoring) |

> ⚠️ **Important:** Risk scores are calculated by our **deterministic Risk Engine**, not by OpenAI. OpenAI is an explanation-only layer.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.13+
- Node.js 18+
- Git

### 1. Clone the repository
```bash
git clone https://github.com/masterandromeda/Real-Time-UPI-Social-Engineering-Phishing-Interceptor.git
cd Real-Time-UPI-Social-Engineering-Phishing-Interceptor
```

### 2. Backend Setup
```bash
cd backend

# Create .env from example
cp .env.example .env
# Edit .env and add your API keys (see Configuration section)

# Install dependencies
pip install -r requirements.txt

# Run database migrations
python -m alembic upgrade head

# Start the backend (port 8001)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

Backend API docs: http://localhost:8001/api/docs  
Health check: http://localhost:8001/health

### 3. Frontend Setup
```bash
cd upi-sentinel

# Install dependencies
npm install

# Start development server (port 3000)
npm run dev
```

Open: http://localhost:3000

---

## ⚙️ Configuration

Copy `backend/.env.example` to `backend/.env` and configure:

```env
# Database (SQLite default — no setup needed)
DATABASE_URL=sqlite+aiosqlite:///./upi_sentinel.db

# For production PostgreSQL:
# DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/upi_sentinel

# External API Keys (all optional — system works without them using local analysis)
SARVAM_API_KEY=your_sarvam_key_here
URLHAUS_AUTH_KEY=your_urlhaus_key_here
VIRUSTOTAL_API_KEY=your_virustotal_key_here
OPENAI_API_KEY=your_openai_key_here
```

> 🔒 **Security:** API keys are loaded server-side only. They are **never** exposed to the frontend.

---

## 🧪 Testing

```bash
cd backend

# Unit tests (7 tests — logic, risk engine, report generation)
python -m pytest test_logic.py -v

# Full pipeline test (7-agent end-to-end)
python -m pytest test_pipeline.py -v

# Build frontend
cd ../upi-sentinel
npm run build
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Backend health + integration status |
| POST | `/api/v1/call/analyze` | Analyze conversation transcript |
| POST | `/api/v1/link/analyze` | Analyze suspicious URL |
| POST | `/api/v1/device/analyze` | Analyze device risk evidence |
| POST | `/api/v1/prediction/analyze` | Correlate signals → risk score |
| GET | `/api/v1/analysis/{id}/events` | Poll analysis events (REST fallback) |
| GET | `/api/v1/integrations/status` | Integration health |
| GET | `/api/v1/reports/{id}/download` | Download PDF/JSON report |
| WS | `/ws/analysis/{id}` | Per-analysis real-time events |
| WS | `/ws/agents` | Global agent event stream |

Full interactive docs: http://localhost:8001/api/docs

---

## ⚡ WebSocket Events

Real-time events pushed to connected clients:

```json
{
  "event_type": "risk.updated",
  "agent_id": "scam_prediction",
  "status": "completed",
  "payload": {
    "overall_score": 78,
    "risk_level": "high",
    "predicted_stage": "authorization_pressure",
    "call_risk_score": 85,
    "link_risk_score": 72,
    "device_risk_score": 45
  }
}
```

Event types: `analysis.started` · `call_analysis_completed` · `link_analysis_completed` · `device_analysis_completed` · `prediction_completed` · `risk.updated` · `explanation_completed` · `analysis.completed`

---

## 🛡️ Security & Privacy

- **No silent monitoring** — all inputs are explicitly user-provided
- **Consent-based only** — transcripts require user consent to analyze
- **No call interception** — browser microphone only with explicit permission
- **No transaction blocking** — safety holds are simulated UI guidance only
- **API keys server-side only** — never exposed to frontend
- **SSRF protection** — internal IP ranges blocked from URL analysis
- **Demo labels** — all simulated events clearly marked `is_demo: true`

---

## 📋 Supported Languages (Reports)

Reports can be generated in all **22 Indian Scheduled Languages**:

English · Hindi · Bengali · Assamese · Bodo · Dogri · Gujarati · Kannada · Kashmiri · Konkani · Maithili · Malayalam · Manipuri · Marathi · Nepali · Odia · Punjabi · Sanskrit · Santali · Sindhi · Tamil · Telugu

Translation powered by Sarvam AI (Indian language specialist).

---

## 🏆 Hackathon Context

This project was built for a cybersecurity hackathon focused on protecting Indian digital payment users.

**Problem:** Social-engineering scams are the #1 cause of UPI fraud. Existing systems detect fraud *after* the transaction.

**Our approach:** Detect the *attack journey* — the call, the link, the device compromise — and intervene *before* the user authorizes the payment.

**Differentiator:** Multi-signal correlation across call + link + device channels, combined with AI-predicted scam stage identification, gives security teams and users actionable warnings at the earliest possible moment.

---

## 📁 Repository Structure

```
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── agents/            # 7-agent orchestration pipeline
│   │   ├── api/               # REST endpoints (analysis, auth, reports)
│   │   ├── core/              # Config, logging, security, exceptions
│   │   ├── database/          # SQLAlchemy models + connection
│   │   ├── integrations/      # Sarvam AI, URLhaus, VirusTotal, OpenAI
│   │   ├── intelligence/      # Call, link, device analysis engines
│   │   ├── realtime/          # WebSocket connection manager
│   │   ├── reports/           # PDF + JSON + CSV generators
│   │   └── risk/              # Deterministic risk scoring engine
│   ├── alembic/               # Database migrations
│   ├── .env.example           # Environment template
│   ├── requirements.txt       # Python dependencies
│   ├── test_logic.py          # Unit tests
│   └── test_pipeline.py       # Integration tests
│
├── upi-sentinel/               # Next.js 16 frontend
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   │   ├── page.tsx       # Landing page
│   │   │   └── console/       # 14 dashboard pages
│   │   ├── components/        # UI components + visualizations
│   │   └── lib/               # API client, types, utilities
│   └── .env.local.example     # Frontend env template
│
└── HANDOFF.md                  # Complete technical handoff document
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## ⚠️ Disclaimer

UPI Sentinel is a **research and demonstration platform**.

- It cannot block or freeze actual UPI transactions without authorized integration with payment processors
- Safety holds shown in the web interface are simulated guidance tools only
- Call analysis requires explicit user consent
- Device analysis uses only user-provided evidence — no automatic device inspection
- All risk scores are estimates, not confirmed fraud determinations
- This tool does not provide legal, financial, or law enforcement advice

---

<div align="center">

**Built with ❤️ to protect every Indian digital payment user**

*UPI Sentinel — Because prevention is better than recovery*

</div>
