#!/usr/bin/env python3
"""
CMS Service Account Creation Script
Idempotently creates or updates an internal admin user for Payload CMS proxy calls.
Reads credentials strictly from CMS_SERVICE_EMAIL and CMS_SERVICE_PASSWORD.
Enforces minimum password length of 20 characters. Never logs passwords.
"""

import os
import sys
from pathlib import Path

# Add backend/src and backend to sys.path
SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
SRC_DIR = BACKEND_DIR / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

def run(db=None):
    email = os.getenv("CMS_SERVICE_EMAIL")
    password = os.getenv("CMS_SERVICE_PASSWORD")

    if not email or not email.strip():
        print("ERROR: CMS_SERVICE_EMAIL environment variable is missing or empty.", file=sys.stderr)
        sys.exit(1)

    if not password or not password.strip():
        print("ERROR: CMS_SERVICE_PASSWORD environment variable is missing or empty.", file=sys.stderr)
        sys.exit(1)

    clean_email = email.strip().lower()
    clean_password = password.strip()

    if len(clean_password) < 20:
        print("ERROR: CMS_SERVICE_PASSWORD must be at least 20 characters long.", file=sys.stderr)
        sys.exit(1)

    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    try:
        user = db.query(User).filter(User.email == clean_email).first()
        hashed = get_password_hash(clean_password)

        if user:
            user.password = hashed
            user.is_admin = True
            user.is_active = True
            user.deleted_at = None
            user.deleted_by = None
            user.locked_at = None
            user.lock_reason = None
            db.commit()
            print(f"SUCCESS: Updated existing service account '{clean_email}' (User ID #{user.user_id}) as active administrator.")
        else:
            new_user = User(
                name="CMS Service Account",
                email=clean_email,
                password=hashed,
                is_admin=True,
                is_active=True,
                years_experience=0,
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            print(f"SUCCESS: Created new service account '{clean_email}' (User ID #{new_user.user_id}) as active administrator.")
    except Exception as e:
        db.rollback()
        print(f"ERROR: Failed to create or update service account: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        if should_close:
            db.close()

if __name__ == "__main__":
    run()
