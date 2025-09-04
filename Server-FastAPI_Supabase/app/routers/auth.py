from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from fastapi.security import HTTPAuthorizationCredentials
from supabase import Client
from datetime import timedelta
import uuid
import base64
import io
from PIL import Image, ImageOps
from typing import Union

from app.database import get_current_supabase
from app.models.user import UserCreate, UserLogin, UserResponse, ForgotPassword, ResetPassword
from app.models.response import TokenResponse, SuccessResponse
from app.auth import (
    get_password_hash, 
    verify_password, 
    create_access_token,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from app.utils.storage import storage_manager, upload_image_to_bucket

router = APIRouter()

async def process_and_upload_avatar(supabase: Client, user_id: str, image_data: Union[str, bytes, UploadFile]) -> str:
    """Process image and upload avatar to Supabase storage"""
    try:
        # Handle different input types
        if isinstance(image_data, UploadFile):
            # Handle file upload
            image_bytes = await image_data.read()
        elif isinstance(image_data, str):
            # Handle base64 string
            if image_data.startswith('data:image/'):
                # Remove data URL prefix
                header, encoded = image_data.split(',', 1)
                image_bytes = base64.b64decode(encoded)
            else:
                # Assume it's already base64 encoded
                image_bytes = base64.b64decode(image_data)
        else:
            # Handle raw bytes
            image_bytes = image_data
        
        # Process image with PIL
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if necessary (handles RGBA, P, etc.)
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize image to 300x300 while maintaining aspect ratio
        image = ImageOps.fit(image, (300, 300), Image.Resampling.LANCZOS)
        
        # Compress image
        output = io.BytesIO()
        image.save(output, format='JPEG', quality=85, optimize=True)
        processed_image_bytes = output.getvalue()
        
        # Generate unique filename
        filename = f"avatars/{user_id}_{uuid.uuid4().hex[:8]}.jpg"
        
        # Upload to Supabase storage
        response = supabase.storage.from_("ecommerce-bucket").upload(
            filename,
            processed_image_bytes,
            file_options={
                "content-type": "image/jpeg",
                "upsert": True
            }
        )
        
        if hasattr(response, 'error') and response.error:
            raise Exception(f"Upload failed: {response.error}")
        
        # Get public URL
        public_url_response = supabase.storage.from_("ecommerce-bucket").get_public_url(filename)
        
        if hasattr(public_url_response, 'error') and public_url_response.error:
            raise Exception(f"Failed to get public URL: {public_url_response.error}")
            
        return public_url_response
        
    except Exception as e:
        raise Exception(f"Avatar processing failed: {str(e)}")

async def upload_avatar_to_supabase(supabase: Client, user_id: str, avatar_data: str) -> str:
    """Upload avatar image to Supabase storage and return public URL - deprecated, use process_and_upload_avatar"""
    return await process_and_upload_avatar(supabase, user_id, avatar_data)

@router.post("/upload-avatar", response_model=dict)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_current_supabase)
):
    """Upload or update user avatar"""
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only image files are allowed"
            )
        
        # Validate file size (max 5MB)
        file_size = 0
        content = await file.read()
        file_size = len(content)
        
        if file_size > 5 * 1024 * 1024:  # 5MB
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size must be less than 5MB"
            )
        
        # Reset file pointer
        await file.seek(0)
        
        # Process and upload avatar
        avatar_url = await process_and_upload_avatar(supabase, current_user["id"], file)
        
        # Update user's avatar in database
        update_response = supabase.table("users").update({
            "avatar": avatar_url,
            "updated_at": "now()"
        }).eq("id", current_user["id"]).execute()
        
        if not update_response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update avatar"
            )
        
        return {
            "message": "Avatar uploaded successfully",
            "avatar_url": avatar_url
        }
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Avatar upload failed: {str(e)}"
        )

@router.post("/update-avatar-base64", response_model=dict)
async def update_avatar_base64(
    avatar_data: dict,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_current_supabase)
):
    """Update user avatar using base64 data"""
    try:
        if not avatar_data.get("image"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image data is required"
            )
        
        # Process and upload avatar
        avatar_url = await process_and_upload_avatar(supabase, current_user["id"], avatar_data["image"])
        
        # Update user's avatar in database
        update_response = supabase.table("users").update({
            "avatar": avatar_url,
            "updated_at": "now()"
        }).eq("id", current_user["id"]).execute()
        
        if not update_response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update avatar"
            )
        
        return {
            "message": "Avatar updated successfully",
            "avatar_url": avatar_url
        }
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Avatar update failed: {str(e)}"
        )

@router.post("/signup", response_model=TokenResponse)
async def signup_user(
    user: UserCreate,
    supabase: Client = Depends(get_current_supabase)
):
    """Register a new user and return access token"""
    try:
        # Check if user already exists
        existing_user = supabase.table("users").select("id").eq("email", user.email).execute()
        if existing_user.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Generate user ID
        user_id = str(uuid.uuid4())
        
        # Handle avatar upload
        avatar_url = None
        if user.avatar and user.avatar.strip():
            try:
                # Remove data URL prefix if present
                base64_data = user.avatar
                if base64_data.startswith('data:'):
                    base64_data = base64_data.split(',')[1]
                
                # Decode base64 to bytes
                file_data = base64.b64decode(base64_data)
                
                # Generate unique filename for avatar
                filename = f"avatars/{user_id}_{uuid.uuid4().hex}.jpg"
                
                # Use upload_image_to_bucket function from test_storage.py
                avatar_url = upload_image_to_bucket(
                    supabase_client=storage_manager.service_client,
                    bucket_name=storage_manager.bucket_name,
                    file_data=file_data,
                    remote_file_path=filename,
                    content_type="image/jpeg"
                )
                print(f"Avatar uploaded successfully: {avatar_url}")
            except Exception as e:
                # Log the error for debugging
                print(f"Avatar upload failed during signup: {str(e)}")
                # If avatar upload fails, don't fail the entire signup process
                # Set a default avatar instead
                avatar_url = f"https://ui-avatars.com/api/?name={user.full_name.replace(' ', '+')}&background=0D8ABC&color=fff"
        else:
            # No avatar provided, use default avatar
            avatar_url = f"https://ui-avatars.com/api/?name={user.full_name.replace(' ', '+')}&background=0D8ABC&color=fff"
        
        # Create user with correct database field names
        user_data = {
            "id": user_id,
            "full_name": user.full_name,  # Changed from 'name' to 'full_name'
            "email": user.email,
            "phone": user.phone,
            "address": user.address,  # Added address field
            "password_hash": get_password_hash(user.password),  # Changed from 'password' to 'password_hash'
            "avatar": avatar_url,
            "is_active": True,
            "created_at": "now()",
            "updated_at": "now()"
        }
        
        response = supabase.table("users").insert(user_data).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user"
            )
        
        created_user = response.data[0]
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": created_user["id"], "email": created_user["email"]},
            expires_delta=access_token_expires
        )
        
        # Remove password from response
        user_response = {k: v for k, v in created_user.items() if k != "password_hash"}
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=user_response,
            message="Account created successfully"
        )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=TokenResponse)
async def login_user(
    user_credentials: UserLogin,
    supabase: Client = Depends(get_current_supabase)
):
    """Login user and return access token"""
    try:
        # Get user from database
        response = supabase.table("users").select("*").eq("email", user_credentials.email).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        user = response.data[0]
        
        # Verify password
        if not verify_password(user_credentials.password, user["password_hash"]):  # Changed from 'password' to 'password_hash'
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Check if user is active
        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is disabled"
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["id"], "email": user["email"]},
            expires_delta=access_token_expires
        )
        
        # Remove password from user data
        user_data = {k: v for k, v in user.items() if k != "password_hash"}
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=user_data,
            message="Login successful"
        )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.post("/forgot-password", response_model=SuccessResponse)
async def forgot_password(
    request: ForgotPassword,
    supabase: Client = Depends(get_current_supabase)
):
    """Send password reset instructions - simplified without OTP"""
    try:
        # Check if user exists
        response = supabase.table("users").select("id", "email").eq("email", request.email).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # In a real application, you would send an email with reset link
        # For demo purposes, we'll just return success
        return SuccessResponse(
            message="Password reset instructions sent to your email"
        )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password reset failed: {str(e)}"
        )

@router.post("/reset-password", response_model=SuccessResponse)
async def reset_password(
    request: ResetPassword,
    supabase: Client = Depends(get_current_supabase)
):
    """Reset user password - simplified without OTP verification"""
    try:
        # Get user
        response = supabase.table("users").select("id").eq("email", request.email).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user_id = response.data[0]["id"]
        
        # Update password
        hashed_password = get_password_hash(request.new_password)
        update_response = supabase.table("users").update({
            "password": hashed_password,
            "updated_at": "now()"
        }).eq("id", user_id).execute()
        
        if not update_response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update password"
            )
        
        return SuccessResponse(
            message="Password updated successfully"
        )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password reset failed: {str(e)}"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: dict = Depends(get_current_user)
):
    """Get current user information"""
    return UserResponse(**current_user)

@router.post("/logout", response_model=SuccessResponse)
async def logout_user():
    """Logout user (token-based, so just return success)"""
    return SuccessResponse(
        message="Logged out successfully"
    )