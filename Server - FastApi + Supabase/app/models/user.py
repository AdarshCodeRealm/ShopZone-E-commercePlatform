from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

class UserBase(BaseModel):
    email: EmailStr
    full_name: str  # Changed from 'name' to 'full_name' to match database
    phone: Optional[str] = None
    address: Optional[str] = None  # Added address field

class UserCreate(UserBase):
    password: str
    avatar: Optional[str] = None  # This will be base64 encoded image data or None
    address: Optional[str] = None  # Added address field for signup
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v

class UserUpdate(BaseModel):
    full_name: Optional[str] = None  # Changed from 'name' to 'full_name'
    phone: Optional[str] = None
    avatar: Optional[str] = None
    address: Optional[str] = None  # Added address field
 
class UserResponse(UserBase):
    id: str
    avatar: Optional[str] = None
    address: Optional[str] = None  # Added address field
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_active: bool = True
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ForgotPassword(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    email: EmailStr
    new_password: str
    
    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v

class ChangePassword(BaseModel):
    current_password: str
    new_password: str
    
    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v

class Address(BaseModel):
    id: Optional[str] = None
    user_id: str
    type: str = "home"  # home, office, other
    full_name: str
    phone: str
    address_line_1: str
    address_line_2: Optional[str] = None
    city: str
    state: str
    postal_code: str
    country: str = "India"
    is_default: bool = False
    
class AddressCreate(BaseModel):
    type: str = "home"
    full_name: str
    phone: str
    address_line_1: str
    address_line_2: Optional[str] = None
    city: str
    state: str
    postal_code: str
    country: str = "India"
    is_default: bool = False

class AddressUpdate(BaseModel):
    type: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address_line_1: Optional[str] = None
    address_line_2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    is_default: Optional[bool] = None