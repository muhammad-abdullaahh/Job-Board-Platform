#!/usr/bin/env python3
"""
Job Board Platform — Backend Test Runner Shortcut
Runs backend unit, integration, and E2E tests directly from the backend directory.
"""
import sys
import os
import subprocess
from pathlib import Path

# Safe encoding on Windows consoles
_reconfigure_stdout = getattr(sys.stdout, "reconfigure", None)
if callable(_reconfigure_stdout):
    try:
        _reconfigure_stdout(encoding="utf-8", errors="replace")
    except Exception:
        pass

BACKEND_DIR = Path(__file__).resolve().parent
ROOT_DIR = BACKEND_DIR.parent
ROOT_RUNNER = ROOT_DIR / "run_tests.py"

if ROOT_RUNNER.is_file():
    # Delegate to root runner with passed arguments
    cmd = [sys.executable, str(ROOT_RUNNER)] + sys.argv[1:]
    sys.exit(subprocess.run(cmd).returncode)
else:
    # Fallback to direct pytest invocation
    cmd = [sys.executable, "-m", "pytest"] + sys.argv[1:]
    sys.exit(subprocess.run(cmd, cwd=str(BACKEND_DIR)).returncode)
