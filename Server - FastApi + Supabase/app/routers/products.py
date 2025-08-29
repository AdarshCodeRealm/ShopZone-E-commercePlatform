from fastapi import APIRouter, HTTPException, status, Depends, Query
from supabase import Client
from typing import List, Optional
import uuid
import math

from app.database import get_current_supabase
from app.models.product import ProductCreate, ProductUpdate, ProductResponse, ReviewCreate, ReviewResponse
from app.models.response import SuccessResponse, PaginationResponse
from app.auth import get_current_user, get_current_active_user

router = APIRouter()

@router.get("/", response_model=dict)
async def get_products(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(12, ge=1, le=100, description="Number of products per page"),
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search in name and description"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price"),
    sort_by: str = Query("name", description="Sort by: name, price_asc, price_desc, rating, newest"),
    supabase: Client = Depends(get_current_supabase)
):
    """Get all products with filters and pagination"""
    try:
        # Calculate offset
        offset = (page - 1) * limit
        
        # Build base query
        query = supabase.table("products").select("*", count="exact").eq("is_active", True)
        
        # Apply filters
        if category:
            query = query.eq("category", category)
        
        if search:
            query = query.or_(f"name.ilike.%{search}%,description.ilike.%{search}%")
        
        if min_price is not None:
            query = query.gte("price", min_price)
            
        if max_price is not None:
            query = query.lte("price", max_price)
        
        # Apply sorting
        if sort_by == "price_asc":
            query = query.order("price", desc=False)
        elif sort_by == "price_desc":
            query = query.order("price", desc=True)
        elif sort_by == "rating":
            query = query.order("rating", desc=True)
        elif sort_by == "newest":
            query = query.order("created_at", desc=True)
        else:  # default to name
            query = query.order("name", desc=False)
        
        # Apply pagination
        query = query.range(offset, offset + limit - 1)
        
        response = query.execute()
        
        # Calculate pagination info
        total_items = response.count if hasattr(response, 'count') else len(response.data)
        total_pages = math.ceil(total_items / limit) if total_items > 0 else 1
        
        return {
            "products": [ProductResponse(**product) for product in response.data],
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
            detail=f"Failed to get products: {str(e)}"
        )

@router.get("/featured", response_model=List[ProductResponse])
async def get_featured_products(
    limit: int = Query(8, ge=1, le=20, description="Number of featured products"),
    supabase: Client = Depends(get_current_supabase)
):
    """Get featured products"""
    try:
        response = supabase.table("products").select("*").eq("is_active", True).eq("is_featured", True).limit(limit).execute()
        
        return [ProductResponse(**product) for product in response.data]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get featured products: {str(e)}"
        )

@router.get("/categories", response_model=dict)
async def get_categories(
    supabase: Client = Depends(get_current_supabase)
):
    """Get all unique product categories with counts"""
    try:
        response = supabase.table("products").select("category").eq("is_active", True).execute()
        
        # Count categories
        category_counts = {}
        for product in response.data:
            category = product.get("category")
            if category:
                category_counts[category] = category_counts.get(category, 0) + 1
        
        categories = [{"name": cat, "count": count} for cat, count in sorted(category_counts.items())]
        
        return {"categories": categories}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get categories: {str(e)}"
        )

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: str,
    supabase: Client = Depends(get_current_supabase)
):
    """Get a specific product by ID"""
    try:
        response = supabase.table("products").select("*").eq("id", product_id).eq("is_active", True).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        return ProductResponse(**response.data[0])
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get product: {str(e)}"
        )

@router.get("/{product_id}/reviews", response_model=dict)
async def get_product_reviews(
    product_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=50, description="Number of reviews per page"),
    supabase: Client = Depends(get_current_supabase)
):
    """Get reviews for a specific product"""
    try:
        offset = (page - 1) * limit
        
        # Get reviews with user info
        query = supabase.table("reviews").select("*, users!inner(full_name, avatar)").eq("product_id", product_id)
        query = query.order("created_at", desc=True).range(offset, offset + limit - 1)
        
        response = query.execute()
        
        # Get total count
        count_response = supabase.table("reviews").select("id", count="exact").eq("product_id", product_id).execute()
        total_items = count_response.count if hasattr(count_response, 'count') else len(count_response.data)
        total_pages = math.ceil(total_items / limit) if total_items > 0 else 1
        
        return {
            "reviews": response.data,
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
            detail=f"Failed to get product reviews: {str(e)}"
        )

@router.post("/{product_id}/reviews", response_model=SuccessResponse)
async def add_product_review(
    product_id: str,
    review: ReviewCreate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_current_supabase)
):
    """Add a review for a product"""
    try:
        # Check if product exists
        product_response = supabase.table("products").select("id").eq("id", product_id).eq("is_active", True).execute()
        if not product_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        # Check if user already reviewed this product
        existing_review = supabase.table("reviews").select("id").eq("product_id", product_id).eq("user_id", current_user["id"]).execute()
        if existing_review.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already reviewed this product"
            )
        
        # Create review
        review_data = {
            "id": str(uuid.uuid4()),
            "product_id": product_id,
            "user_id": current_user["id"],
            "rating": review.rating,
            "comment": review.comment,
            "created_at": "now()"
        }
        
        response = supabase.table("reviews").insert(review_data).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to add review"
            )
        
        # Update product rating
        await update_product_rating(product_id, supabase)
        
        return SuccessResponse(
            message="Review added successfully",
            data=response.data[0]
        )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add review: {str(e)}"
        )

async def update_product_rating(product_id: str, supabase: Client):
    """Update product average rating"""
    try:
        # Get all reviews for the product
        reviews_response = supabase.table("reviews").select("rating").eq("product_id", product_id).execute()
        
        if reviews_response.data:
            ratings = [review["rating"] for review in reviews_response.data]
            average_rating = sum(ratings) / len(ratings)
            
            # Update product rating
            supabase.table("products").update({
                "rating": round(average_rating, 1),
                "review_count": len(ratings)
            }).eq("id", product_id).execute()
    except Exception:
        # Don't fail the main operation if rating update fails
        pass

@router.post("/", response_model=SuccessResponse)
async def create_product(
    product: ProductCreate,
    current_user: dict = Depends(get_current_active_user),
    supabase: Client = Depends(get_current_supabase)
):
    """Create a new product (admin only)"""
    try:
        product_data = product.dict()
        product_data["id"] = str(uuid.uuid4())
        
        response = supabase.table("products").insert(product_data).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create product"
            )
        
        return SuccessResponse(
            message="Product created successfully",
            data=response.data[0]
        )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create product: {str(e)}"
        )

@router.put("/{product_id}", response_model=SuccessResponse)
async def update_product(
    product_id: str,
    product_update: ProductUpdate,
    current_user: dict = Depends(get_current_active_user),
    supabase: Client = Depends(get_current_supabase)
):
    """Update a product (admin only)"""
    try:
        update_data = product_update.dict(exclude_unset=True)
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No data to update"
            )
        
        response = supabase.table("products").update(update_data).eq("id", product_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found or failed to update"
            )
        
        return SuccessResponse(
            message="Product updated successfully",
            data=response.data[0]
        )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update product: {str(e)}"
        )

@router.delete("/{product_id}", response_model=SuccessResponse)
async def delete_product(
    product_id: str,
    current_user: dict = Depends(get_current_active_user),
    supabase: Client = Depends(get_current_supabase)
):
    """Delete a product (admin only) - soft delete by setting is_active to False"""
    try:
        response = supabase.table("products").update({"is_active": False}).eq("id", product_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        return SuccessResponse(
            message="Product deleted successfully",
            data={"product_id": product_id}
        )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete product: {str(e)}"
        )

# Add sample products endpoint for testing
@router.post("/sample-data", response_model=SuccessResponse)
async def create_sample_products(
    supabase: Client = Depends(get_current_supabase)
):
    """Create sample products for testing (development only)"""
    try:
        # Sample products data
        sample_products = [
            {
                "id": str(uuid.uuid4()),
                "name": "Wireless Headphones",
                "description": "Premium wireless headphones with noise cancellation",
                "price": 2999.99,
                "category": "Electronics",
                "stock_quantity": 50,
                "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
                "is_active": True,
                "is_featured": True,
                "created_at": "now()"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Gaming Laptop",
                "description": "High-performance gaming laptop with RTX graphics",
                "price": 89999.99,
                "category": "Electronics",
                "stock_quantity": 25,
                "image_url": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500",
                "is_active": True,
                "is_featured": True,
                "created_at": "now()"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Cotton T-Shirt",
                "description": "100% cotton comfortable t-shirt",
                "price": 799.99,
                "category": "Clothing",
                "stock_quantity": 100,
                "image_url": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
                "is_active": True,
                "is_featured": False,
                "created_at": "now()"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Running Shoes",
                "description": "Comfortable running shoes for daily workouts",
                "price": 4999.99,
                "category": "Sports",
                "stock_quantity": 75,
                "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
                "is_active": True,
                "is_featured": True,
                "created_at": "now()"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Coffee Mug",
                "description": "Ceramic coffee mug perfect for morning coffee",
                "price": 299.99,
                "category": "Home & Garden",
                "stock_quantity": 200,
                "image_url": "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500",
                "is_active": True,
                "is_featured": False,
                "created_at": "now()"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Smartphone",
                "description": "Latest flagship smartphone with advanced camera",
                "price": 69999.99,
                "category": "Electronics",
                "stock_quantity": 40,
                "image_url": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500",
                "is_active": True,
                "is_featured": True,
                "created_at": "now()"
            }
        ]
        
        # Insert sample products
        response = supabase.table("products").insert(sample_products).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create sample products"
            )
        
        return SuccessResponse(
            message=f"Created {len(sample_products)} sample products successfully",
            data={
                "products_created": len(response.data),
                "categories": list(set([p["category"] for p in sample_products]))
            }
        )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create sample products: {str(e)}"
        )