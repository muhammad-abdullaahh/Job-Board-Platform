import os
import sys
from pathlib import Path

# Ensure src directory is in sys.path
CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent
SRC_DIR = BACKEND_DIR / "src"

paths_to_add = [os.getcwd(), os.path.join(os.getcwd(), "src"), str(BACKEND_DIR), str(SRC_DIR)]
for p in paths_to_add:
    if p in sys.path:
        sys.path.remove(p)
    sys.path.insert(0, p)

try:
    from app.main import app
    handler = app
except Exception as e:
    import traceback
    traceback.print_exc(file=sys.stderr)
    raise

