from fastapi import APIRouter, HTTPException, status, Depends
from supabase import Client
from typing import List
import uuid
from decimal import Decimal

from app.database import get_current_supabase
from app.models.cart import CartItemCreate, CartItemUpdate, CartItemResponse, CartResponse
from app.models.response import SuccessResponse
from app.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=CartResponse)
async def get_cart(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_current_supabase)
):
    """Get user's cart"""
    try:
        # Get cart items with product details
        response = supabase.table("cart_items").select("""
            *,
            products (
                name,
                price,
                stock_quantity,
                image_url
            )
        """).eq("user_id", current_user["id"]).execute()
        
        cart_items = []
        total_amount = Decimal('0')
        
        for item in response.data:
            if item.get("products"):
                product = item["products"]
                item_total = Decimal(str(product["price"])) * item["quantity"]
                
                cart_item = CartItemResponse(
                    id=item["id"],
                    user_id=item["user_id"],
                    product_id=item["product_id"],
                    quantity=item["quantity"],
                    product_name=product["name"],
                    product_price=Decimal(str(product["price"])),
                    total_price=item_total,
                    created_at=item["created_at"],
                    updated_at=item.get("updated_at")
                )
                cart_items.append(cart_item)
                total_amount += item_total
        
        return CartResponse(
            items=cart_items,
            total_amount=total_amount,
            total_items=len(cart_items)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get cart: {str(e)}"
        )

@router.post("/add", response_model=SuccessResponse)
async def add_to_cart(
    cart_item: CartItemCreate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_current_supabase)
):
    """Add item to cart"""
    try:
        # Check if product exists and has enough stock
        product_response = supabase.table("products").select("*").eq("id", cart_item.product_id).eq("is_active", True).execute()
        
        if not product_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        product = product_response.data[0]
        
        if product["stock_quantity"] < cart_item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient stock"
            )
        
        # Check if item already exists in cart
        existing_item = supabase.table("cart_items").select("*").eq("user_id", current_user["id"]).eq("product_id", cart_item.product_id).execute()
        
        if existing_item.data:
            # Update existing item quantity
            new_quantity = existing_item.data[0]["quantity"] + cart_item.quantity
            
            if product["stock_quantity"] < new_quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Insufficient stock for requested quantity"
                )
            
            response = supabase.table("cart_items").update({
                "quantity": new_quantity,
                "updated_at": "now()"
            }).eq("id", existing_item.data[0]["id"]).execute()
        else:
            # Create new cart item
            cart_data = {
                "id": str(uuid.uuid4()),
                "user_id": current_user["id"],
                "product_id": cart_item.product_id,
                "quantity": cart_item.quantity,
                "created_at": "now()"
            }
            
            response = supabase.table("cart_items").insert(cart_data).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to add item to cart"
            )
        
        return SuccessResponse(
            message="Item added to cart successfully",
            data=response.data[0]
        )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add item to cart: {str(e)}"
        )

@router.put("/update/{product_id}", response_model=SuccessResponse)
async def update_cart_item(
    product_id: str,
    request: dict,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_current_supabase)
):
    """Update cart item quantity"""
    try:
        quantity = request.get("quantity")
        
        if not quantity or quantity < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quantity must be at least 1"
            )
        
        # Get cart item
        cart_response = supabase.table("cart_items").select("*").eq("product_id", product_id).eq("user_id", current_user["id"]).execute()
        
        if not cart_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart item not found"
            )
        
        cart_item = cart_response.data[0]
        
        # Check product stock
        product_response = supabase.table("products").select("stock_quantity").eq("id", product_id).execute()
        
        if not product_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        if product_response.data[0]["stock_quantity"] < quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient stock"
            )
        
        # Update cart item
        response = supabase.table("cart_items").update({
            "quantity": quantity,
            "updated_at": "now()"
        }).eq("id", cart_item["id"]).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update cart item"
            )
        
        return SuccessResponse(
            message="Cart item updated successfully",
            data=response.data[0]
        )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update cart item: {str(e)}"
        )

@router.delete("/remove/{product_id}", response_model=SuccessResponse)
async def remove_from_cart(
    product_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_current_supabase)
):
    """Remove item from cart"""
    try:
        response = supabase.table("cart_items").delete().eq("product_id", product_id).eq("user_id", current_user["id"]).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart item not found"
            )
        
        return SuccessResponse(
            message="Item removed from cart successfully",
            data={"product_id": product_id}
        )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove item from cart: {str(e)}"
        )

@router.delete("/clear", response_model=SuccessResponse)
async def clear_cart(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_current_supabase)
):
    """Clear all items from cart"""
    try:
        response = supabase.table("cart_items").delete().eq("user_id", current_user["id"]).execute()
        
        return SuccessResponse(
            message="Cart cleared successfully",
            data={"cleared_items": len(response.data) if response.data else 0}
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear cart: {str(e)}"
        )