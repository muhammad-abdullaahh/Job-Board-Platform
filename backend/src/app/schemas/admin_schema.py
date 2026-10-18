# Admin Schemas
# Defines Pydantic serialization models for administrative audit trails and CMS responses.

from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime

class AdminAuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    admin_user_id: int
    actor_label: Optional[str] = None
    action: str
    target_type: str
    target_id: int
    details: Optional[Dict[str, Any]] = None
    created_at: datetime
