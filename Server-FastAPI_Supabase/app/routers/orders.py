from fastapi import APIRouter, HTTPException, status, Depends, Query
from supabase import Client
from typing import List, Optional
import uuid
from decimal import Decimal
import math

from app.database import get_current_supabase
from app.models.order import OrderCreate, OrderUpdate, OrderResponse, OrderStatus, OrderItemCreate
from app.models.response import SuccessResponse
from app.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=dict)
async def get_orders(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=50, description="Number of orders per page"),
    status_filter: Optional[OrderStatus] = Query(None, description="Filter by order status"),
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_current_supabase)
):
    """Get user's orders with pagination"""
    try:
        offset = (page - 1) * limit
        
        query = supabase.table("orders").select("""
            *,
            order_items (
                *,
                products (name, image_url)
            )
        """, count="exact").eq("user_id", current_user["id"])
        
        if status_filter:
            query = query.eq("status", status_filter.value)
        
        query = query.order("created_at", desc=True).range(offset, offset + limit - 1)
        
        response = query.execute()
        
        orders = []
        for order in response.data:
            order_items = []
            if order.get("order_items"):
                for item in order["order_items"]:
                    order_items.append({
                        "id": item["id"],
                        "order_id": item["order_id"],
                        "product_id": item["product_id"],
                        "product_name": item["products"]["name"] if item.get("products") else "Unknown Product",
                        "product_image": item["products"].get("image_url") if item.get("products") else None,
                        "quantity": item["quantity"],
                        "unit_price": float(item["unit_price"]),
                        "total_price": float(item["unit_price"]) * item["quantity"]
                    })
            
            order_data = {
                "id": order["id"],
                "user_id": order["user_id"],
                "status": order["status"],
                "total_amount": float(order["total_amount"]),
                "shipping_address": order["shipping_address"],
                "payment_method": order.get("payment_method", "cod"),
                "notes": order.get("notes"),
                "created_at": order["created_at"],
                "updated_at": order.get("updated_at"),
                "items": order_items
            }
            orders.append(order_data)
        
        # Calculate pagination info
        total_items = response.count if hasattr(response, 'count') else len(response.data)
        total_pages = math.ceil(total_items / limit) if total_items > 0 else 1
        
        return {
            "orders": orders,
            "pagination": {
                "page": page,
                "limit": limit,
                "total_items": total_items,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_previous": page > 1
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get orders: {str(e)}"
        )

@router.get("/{order_id}", response_model=dict)
async def get_order(
    order_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_current_supabase)
):
    """Get a specific order"""
    try:
        response = supabase.table("orders").select("""
            *,
            order_items (
                *,
                products (name, image_url, price)
            )
        """).eq("id", order_id).eq("user_id", current_user["id"]).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        order = response.data[0]
        order_items = []
        
        if order.get("order_items"):
            for item in order["order_items"]:
                order_items.append({
                    "id": item["id"],
                    "order_id": item["order_id"],
                    "product_id": item["product_id"],
                    "product_name": item["products"]["name"] if item.get("products") else "Unknown Product",
                    "product_image": item["products"].get("image_url") if item.get("products") else None,
                    "quantity": item["quantity"],
                    "unit_price": float(item["unit_price"]),
                    "total_price": float(item["unit_price"]) * item["quantity"]
                })
        
        return {
            "id": order["id"],
            "user_id": order["user_id"],
            "status": order["status"],
            "total_amount": float(order["total_amount"]),
            "shipping_address": order["shipping_address"],
            "payment_method": order.get("payment_method", "cod"),
            "notes": order.get("notes"),
            "created_at": order["created_at"],
            "updated_at": order.get("updated_at"),
            "items": order_items
        }
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get order: {str(e)}"
        )

@router.post("/", response_model=SuccessResponse)
async def create_order(
    order_data: dict,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_current_supabase)
):
    """Create a new order"""
    try:
        items = order_data.get("items", [])
        shipping_address = order_data.get("shipping_address", {})
        payment_method = order_data.get("payment_method", "cod")
        notes = order_data.get("notes")
        
        if not items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Order must contain at least one item"
            )
        
        # Validate and calculate order total
        total_amount = 0
        order_items_data = []
        
        for item in items:
            product_id = item.get("product_id") or item.get("id")
            quantity = item.get("quantity", 1)
            
            # Get product details
            product_response = supabase.table("products").select("*").eq("id", product_id).eq("is_active", True).execute()
            
            if not product_response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product {product_id} not found"
                )
            
            product = product_response.data[0]
            
            # Check stock
            if product["stock_quantity"] < quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for product {product['name']}"
                )
            
            # Use current product price
            unit_price = float(product["price"])
            item_total = unit_price * quantity
            total_amount += item_total
            
            order_items_data.append({
                "id": str(uuid.uuid4()),
                "product_id": product_id,
                "quantity": quantity,
                "unit_price": unit_price
            })
        
        # Create order
        order_record = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "status": "pending",
            "total_amount": total_amount,
            "shipping_address": shipping_address,
            "payment_method": payment_method,
            "notes": notes,
            "created_at": "now()"
        }
        
        order_response = supabase.table("orders").insert(order_record).execute()
        
        if not order_response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create order"
            )
        
        # Create order items
        for item_data in order_items_data:
            item_data["order_id"] = order_record["id"]
        
        items_response = supabase.table("order_items").insert(order_items_data).execute()
        
        if not items_response.data:
            # Rollback order creation if items creation fails
            supabase.table("orders").delete().eq("id", order_record["id"]).execute()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create order items"
            )
        
        # Update product stock quantities
        for item_data in order_items_data:
            current_stock_response = supabase.table("products").select("stock_quantity").eq("id", item_data["product_id"]).execute()
            if current_stock_response.data:
                current_stock = current_stock_response.data[0]["stock_quantity"]
                new_stock = current_stock - item_data["quantity"]
                supabase.table("products").update({
                    "stock_quantity": new_stock
                }).eq("id", item_data["product_id"]).execute()
        
        # Clear user's cart
        supabase.table("cart_items").delete().eq("user_id", current_user["id"]).execute()
        
        return SuccessResponse(
            message="Order created successfully",
            data={
                "order_id": order_record["id"],
                "total_amount": total_amount,
                "status": "pending"
            }
        )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create order: {str(e)}"
        )

@router.put("/{order_id}/cancel", response_model=SuccessResponse)
async def cancel_order(
    order_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_current_supabase)
):
    """Cancel an order (only if pending or confirmed)"""
    try:
        # Get order
        order_response = supabase.table("orders").select("*").eq("id", order_id).eq("user_id", current_user["id"]).execute()
        
        if not order_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        order = order_response.data[0]
        
        # Check if order can be cancelled
        if order["status"] not in ["pending", "confirmed"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Order cannot be cancelled"
            )
        
        # Update order status
        update_response = supabase.table("orders").update({
            "status": "cancelled",
            "updated_at": "now()"
        }).eq("id", order_id).execute()
        
        if not update_response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to cancel order"
            )
        
        # Restore product stock (get order items and restore stock)
        items_response = supabase.table("order_items").select("*").eq("order_id", order_id).execute()
        
        for item in items_response.data:
            product_response = supabase.table("products").select("stock_quantity").eq("id", item["product_id"]).execute()
            if product_response.data:
                current_stock = product_response.data[0]["stock_quantity"]
                supabase.table("products").update({
                    "stock_quantity": current_stock + item["quantity"]
                }).eq("id", item["product_id"]).execute()
        
        return SuccessResponse(
            message="Order cancelled successfully",
            data={"order_id": order_id, "status": "cancelled"}
        )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel order: {str(e)}"
        )