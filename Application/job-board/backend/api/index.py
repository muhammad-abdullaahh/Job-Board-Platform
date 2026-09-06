import os
import sys
from pathlib import Path

# Ensure src directory is in sys.path
CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent
SRC_DIR = BACKEND_DIR / "src"

for p in [str(SRC_DIR), str(BACKEND_DIR), os.path.join(os.getcwd(), "src"), os.getcwd()]:
    if p not in sys.path:
        sys.path.insert(0, p)

from app.main import app
