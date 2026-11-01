"""
UPI Sentinel backend launcher.
Run from any directory: python backend/start.py
Always uses backend/ as working directory so .env is found correctly.
"""
import os
import pathlib
import sys

# Ensure CWD is the backend directory regardless of where the script is invoked.
BACKEND_DIR = pathlib.Path(__file__).parent.resolve()
os.chdir(BACKEND_DIR)

# Add backend/ to sys.path so `app.*` imports work.
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info",
    )
