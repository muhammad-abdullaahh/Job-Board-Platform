# Refresh Token Repository
# Manages database persistence and lookup for session refresh tokens.
# Supports token validation, revoking active sessions, and cleaning expired tokens.

from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.models.refresh_token import RefreshToken

class RefreshTokenRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, user_id: int, token_hash: str, expires_at: datetime) -> RefreshToken:
        token_record = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        try:
            self.db.add(token_record)
            self.db.commit()
            self.db.refresh(token_record)
            return token_record
        except Exception:
            self.db.rollback()
            raise

    def get_active_by_hash(self, token_hash: str) -> Optional[RefreshToken]:
        now = datetime.now(timezone.utc)
        return (
            self.db.query(RefreshToken)
            .filter(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked_at.is_(None),
                RefreshToken.expires_at > now
            )
            .first()
        )

    def revoke_by_hash(self, token_hash: str) -> bool:
        record = (
            self.db.query(RefreshToken)
            .filter(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked_at.is_(None)
            )
            .first()
        )
        if record:
            record.revoked_at = datetime.now(timezone.utc)
            try:
                self.db.commit()
                return True
            except Exception:
                self.db.rollback()
                raise
        return False

    def revoke_all_for_user(self, user_id: int) -> int:
        now = datetime.now(timezone.utc)
        try:
            count = (
                self.db.query(RefreshToken)
                .filter(
                    RefreshToken.user_id == user_id,
                    RefreshToken.revoked_at.is_(None)
                )
                .update({"revoked_at": now}, synchronize_session=False)
            )
            self.db.commit()
            return count
        except Exception:
            self.db.rollback()
            raise
