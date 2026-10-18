#!/usr/bin/env python3
"""
CMS Service Account Creation Script (Workspace Root Wrapper)
"""

import os
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
SRC_DIR = BACKEND_DIR / "src"

if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Import and execute run from backend/scripts/create_cms_service_account.py
from scripts.create_cms_service_account import run

if __name__ == "__main__":
    run()
