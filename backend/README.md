# UPI Sentinel — Backend

FastAPI backend for the UPI Sentinel Predictive Scam Interceptor.

## Quick Start

```bash
cd backend
# Start the server (no DB required for basic analysis)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

- API Docs: http://localhost:8001/api/docs  
- Health:   http://localhost:8001/health  
- Root:     http://localhost:8001/

## Environment Setup

```bash
cp .env.example .env
# Edit .env and fill in your API keys
```

## Required: Add API Keys to .env

```
SARVAM_API_KEY=your_key_here
URLHAUS_AUTH_KEY=your_key_here
VIRUSTOTAL_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/upi_sentinel
```

## Run Tests

```bash
python test_logic.py      # 7 unit tests (no DB, no API keys needed)
python test_pipeline.py   # Full 7-agent pipeline test
```

## NOTE: Port 8000 is occupied by Splunk on this machine — use port 8001
