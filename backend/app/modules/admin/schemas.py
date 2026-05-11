from pydantic import BaseModel, Field
from typing import List
from app.modules.auth.schemas import UserResponse

class UpdateRolesRequest(BaseModel):
    roles_ids: List[int] = Field(..., description="List of role IDs to assign to the user")
