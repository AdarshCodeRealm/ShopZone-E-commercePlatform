from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from app.routers import auth, products, orders, users, cart, payments
from app.database import get_supabase_client
from app.models.response import ErrorResponse

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting up Ecommerce API...")
    yield
    # Shutdown
    print("Shutting down...")

app = FastAPI(
    title=os.getenv("APP_NAME", "ShopZone Ecommerce API"),
    version=os.getenv("APP_VERSION", "1.0.0"),
    description="A complete FastAPI backend for ecommerce website with Supabase integration",
    lifespan=lifespan
)

# CORS middleware - Updated for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://localhost:3000", 
        "http://127.0.0.1:5173",
        "https://*.vercel.app",  # Add Vercel domains
        os.getenv("FRONTEND_URL", "")  # Add your frontend URL from env
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(products.router, prefix="/api/v1/products", tags=["Products"])
app.include_router(cart.router, prefix="/api/v1/cart", tags=["Cart"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["Orders"])
app.include_router(payments.router, prefix="/api/v1/payments", tags=["Payments"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to ShopZone Ecommerce API", 
        "version": os.getenv("APP_VERSION", "1.0.0"),
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "status": "running"
    }

@app.get("/api/v1/test")
async def test_api():
    """Test endpoint to verify API is working"""
    return {
        "message": "API is working!",
        "timestamp": "now()",
        "endpoints": {
            "products": "/api/v1/products",
            "categories": "/api/v1/products/categories",
            "auth": "/api/v1/auth",
            "health": "/health"
        }
    }

@app.get("/health")
async def health_check():
    try:
        # Test database connection
        supabase = get_supabase_client()
        # Simple query to test connection
        test_response = supabase.table("users").select("id").limit(1).execute()
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": "now()",
            "api_version": os.getenv("APP_VERSION", "1.0.0")
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
            "timestamp": "now()"
        }

# Vercel serverless function handler
handler = app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)