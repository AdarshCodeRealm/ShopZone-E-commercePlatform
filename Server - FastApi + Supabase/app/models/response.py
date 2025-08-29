from pydantic import BaseModel
from typing import Optional, Any, Dict

class ErrorResponse(BaseModel):
    error: str
    message: str
    details: Optional[Dict[str, Any]] = None

class SuccessResponse(BaseModel):
    message: str
    data: Optional[Any] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Dict[str, Any]
    message: Optional[str] = None

class PaginationResponse(BaseModel):
    page: int
    page_size: int
    total_pages: int
    total_items: int
    has_next: bool
    has_previous: bool