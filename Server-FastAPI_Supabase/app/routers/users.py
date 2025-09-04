from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from supabase import Client
from typing import List, Optional
import uuid

from app.database import get_current_supabase
from app.models.user import UserResponse, UserUpdate, ChangePassword, AddressCreate, AddressUpdate, Address
from app.models.response import SuccessResponse
from app.auth import get_current_user, get_password_hash, verify_password
from app.utils.storage import storage_manager

router = APIRouter()

@router.get("/profile", response_model=UserResponse)
async def get_current_user_profile(
    current_user: dict = Depends(get_current_user)
):
    """Get current user profile"""
    user_data = {k: v for k, v in current_user.items() if k != "password"}
    return UserResponse(**user_data)

@router.put("/profile", response_model=SuccessResponse)
async def update_current_user_profile(
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_current_supabase)
):
    """Update current user profile"""
    try:
        update_data = user_update.dict(exclude_unset=True)
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No data to update"
            )
        
        update_data["updated_at"] = "now()"
        
        response = supabase.table("users").update(update_data).eq("id", current_user["id"]).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update user"
            )
        
        return SuccessResponse(
            message="Profile updated successfully",
            data={k: v for k, v in response.data[0].items() if k != "password"}
        )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}"
        )

@router.put("/change-password", response_model=SuccessResponse)
async def change_password(
    password_data: ChangePassword,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_current_supabase)
):
    """Change user password"""
    try:
        # Verify current password
        if not verify_password(password_data.current_password, current_user["password"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # Hash new password
        new_password_hash = get_password_hash(password_data.new_password)
        
        # Update password in database
        response = supabase.table("users").update({
            "password": new_password_hash,
            "updated_at": "now()"
        }).eq("id", current_user["id"]).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update password"
            )
        
        return SuccessResponse(
            message="Password changed successfully"
        )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to change password: {str(e)}"
        )

# Address Management
@router.get("/addresses", response_model=List[Address])
async def get_user_addresses(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_current_supabase)
):
    """Get all addresses for current user"""
    try:
        response = supabase.table("addresses").select("*").eq("user_id", current_user["id"]).order("is_default", desc=True).execute()
        
        return [Address(**address) for address in response.data]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get addresses: {str(e)}"
        )

@router.post("/addresses", response_model=SuccessResponse)
async def add_address(
    address: AddressCreate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_current_supabase)
):
    """Add a new address for current user"""
    try:
        # If this is set as default, unset other defaults
        if address.is_default:
            supabase.table("addresses").update({"is_default": False}).eq("user_id", current_user["id"]).execute()
        
        address_data = address.dict()
        address_data.update({
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "created_at": "now()"
        })
        
        response = supabase.table("addresses").insert(address_data).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to add address"
            )
        
        return SuccessResponse(
            message="Address added successfully",
            data=response.data[0]
        )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add address: {str(e)}"
        )

@router.put("/addresses/{address_id}", response_model=SuccessResponse)
async def update_address(
    address_id: str,
    address_update: AddressUpdate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_current_supabase)
):
    """Update an address"""
    try:
        # Check if address belongs to user
        existing_address = supabase.table("addresses").select("*").eq("id", address_id).eq("user_id", current_user["id"]).execute()
        
        if not existing_address.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Address not found"
            )
        
        update_data = address_update.dict(exclude_unset=True)
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No data to update"
            )
        
        # If this is set as default, unset other defaults
        if update_data.get("is_default"):
            supabase.table("addresses").update({"is_default": False}).eq("user_id", current_user["id"]).execute()
        
        update_data["updated_at"] = "now()"
        
        response = supabase.table("addresses").update(update_data).eq("id", address_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update address"
            )
        
        return SuccessResponse(
            message="Address updated successfully",
            data=response.data[0]
        )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update address: {str(e)}"
        )

@router.delete("/addresses/{address_id}", response_model=SuccessResponse)
async def delete_address(
    address_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_current_supabase)
):
    """Delete an address"""
    try:
        # Check if address belongs to user
        existing_address = supabase.table("addresses").select("*").eq("id", address_id).eq("user_id", current_user["id"]).execute()
        
        if not existing_address.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Address not found"
            )
        
        response = supabase.table("addresses").delete().eq("id", address_id).execute()
        
        return SuccessResponse(
            message="Address deleted successfully",
            data={"address_id": address_id}
        )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete address: {str(e)}"
        )

# Wishlist Management
@router.get("/wishlist", response_model=dict)
async def get_wishlist(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_current_supabase)
):
    """Get user's wishlist"""
    try:
        response = supabase.table("wishlist").select("*, products!inner(*)").eq("user_id", current_user["id"]).execute()
        
        wishlist_items = []
        for item in response.data:
            product = item["products"]
            wishlist_items.append({
                "id": item["id"],
                "product": product,
                "added_at": item["created_at"]
            })
        
        return {
            "items": wishlist_items,
            "total": len(wishlist_items)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get wishlist: {str(e)}"
        )

@router.post("/wishlist/add", response_model=SuccessResponse)
async def add_to_wishlist(
    request: dict,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_current_supabase)
):
    """Add product to wishlist"""
    try:
        product_id = request.get("product_id")
        
        if not product_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product ID is required"
            )
        
        # Check if product exists
        product_response = supabase.table("products").select("id").eq("id", product_id).eq("is_active", True).execute()
        if not product_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        # Check if already in wishlist
        existing_item = supabase.table("wishlist").select("id").eq("user_id", current_user["id"]).eq("product_id", product_id).execute()
        if existing_item.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product already in wishlist"
            )
        
        # Add to wishlist
        wishlist_data = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "product_id": product_id,
            "created_at": "now()"
        }
        
        response = supabase.table("wishlist").insert(wishlist_data).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to add to wishlist"
            )
        
        return SuccessResponse(
            message="Product added to wishlist",
            data=response.data[0]
        )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add to wishlist: {str(e)}"
        )

@router.delete("/wishlist/remove/{product_id}", response_model=SuccessResponse)
async def remove_from_wishlist(
    product_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_current_supabase)
):
    """Remove product from wishlist"""
    try:
        # Check if item exists in wishlist
        existing_item = supabase.table("wishlist").select("id").eq("user_id", current_user["id"]).eq("product_id", product_id).execute()
        
        if not existing_item.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found in wishlist"
            )
        
        response = supabase.table("wishlist").delete().eq("user_id", current_user["id"]).eq("product_id", product_id).execute()
        
        return SuccessResponse(
            message="Product removed from wishlist",
            data={"product_id": product_id}
        )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove from wishlist: {str(e)}"
        )

# Avatar Upload Endpoints
@router.post("/avatar/upload", response_model=SuccessResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_current_supabase)
):
    """Upload user avatar image"""
    try:
        # Upload image to storage
        avatar_url = await storage_manager.upload_avatar(current_user["id"], file)
        
        # Update user avatar URL in database
        response = supabase.table("users").update({
            "avatar": avatar_url,
            "updated_at": "now()"
        }).eq("id", current_user["id"]).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update user avatar"
            )
        
        return SuccessResponse(
            message="Avatar uploaded successfully",
            data={
                "avatar_url": avatar_url,
                "user_id": current_user["id"]
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload avatar: {str(e)}"
        )

@router.post("/avatar/upload-base64", response_model=SuccessResponse)
async def upload_avatar_base64(
    base64_data: str = Form(...),
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_current_supabase)
):
    """Upload user avatar from base64 encoded data"""
    try:
        # Upload image to storage from base64
        avatar_url = await storage_manager.upload_from_base64(current_user["id"], base64_data)
        
        # Update user avatar URL in database
        response = supabase.table("users").update({
            "avatar": avatar_url,
            "updated_at": "now()"
        }).eq("id", current_user["id"]).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update user avatar"
            )
        
        return SuccessResponse(
            message="Avatar uploaded successfully",
            data={
                "avatar_url": avatar_url,
                "user_id": current_user["id"]
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload avatar: {str(e)}"
        )

@router.delete("/avatar", response_model=SuccessResponse)
async def delete_avatar(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_current_supabase)
):
    """Delete user avatar"""
    try:
        # Delete from storage
        await storage_manager.delete_user_avatar(current_user["id"])
        
        # Remove avatar URL from user record
        response = supabase.table("users").update({
            "avatar": None,
            "updated_at": "now()"
        }).eq("id", current_user["id"]).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to delete avatar from user record"
            )
        
        return SuccessResponse(
            message="Avatar deleted successfully",
            data={"user_id": current_user["id"]}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete avatar: {str(e)}"
        )