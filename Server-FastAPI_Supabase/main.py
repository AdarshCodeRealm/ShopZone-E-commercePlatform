from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Environment variable validation
REQUIRED_ENV_VARS = [
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY"
]

missing_vars = [var for var in REQUIRED_ENV_VARS if not os.getenv(var)]
ENV_VARS_VALID = len(missing_vars) == 0

# Add error handling for imports
IMPORTS_SUCCESS = True
IMPORT_ERROR = None
try:
    from app.routers import auth, products, orders, users, cart, payments
    from app.database import get_supabase_client
    from app.models.response import ErrorResponse
except ImportError as e:
    print(f"Import error: {e}")
    IMPORTS_SUCCESS = False
    IMPORT_ERROR = str(e)
except Exception as e:
    print(f"General import error: {e}")
    IMPORTS_SUCCESS = False
    IMPORT_ERROR = str(e)

# Create FastAPI app without lifespan for serverless compatibility
app = FastAPI(
    title=os.getenv("APP_NAME", "ShopZone Ecommerce API"),
    version=os.getenv("APP_VERSION", "1.0.0"),
    description="A complete FastAPI backend for ecommerce website with Supabase integration"
)

# CORS middleware with proper wildcard support
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://localhost:3000", 
        "http://127.0.0.1:5173",
        "https://shop-zone-e-commerce-platform-lm5r.vercel.app",
        "https://*.vercel.app",
        "*"  # Allow all origins for now to test
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Basic endpoints that work without database
@app.get("/")
async def root():
    return {
        "message": "Welcome to ShopZone Ecommerce API", 
        "version": os.getenv("APP_VERSION", "1.0.0"),
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "status": "running",
        "imports": "success" if IMPORTS_SUCCESS else "failed",
        "import_error": IMPORT_ERROR if not IMPORTS_SUCCESS else None,
        "env_vars_valid": ENV_VARS_VALID,
        "missing_env_vars": missing_vars if not ENV_VARS_VALID else None,
        "env_vars": {
            "supabase_url": bool(os.getenv("SUPABASE_URL")),
            "supabase_key": bool(os.getenv("SUPABASE_ANON_KEY")),
            "jwt_secret": bool(os.getenv("JWT_SECRET_KEY"))
        }
    }

@app.get("/api/v1/test")
async def test_api():
    """Test endpoint to verify API is working"""
    return {
        "message": "API is working!",
        "timestamp": "2025-01-02",
        "python_version": sys.version,
        "imports_successful": IMPORTS_SUCCESS,
        "env_vars_valid": ENV_VARS_VALID,
        "import_error": IMPORT_ERROR if not IMPORTS_SUCCESS else None,
        "missing_env_vars": missing_vars if not ENV_VARS_VALID else None,
        "endpoints": {
            "products": "/api/v1/products",
            "categories": "/api/v1/products/categories",
            "auth": "/api/v1/auth",
            "health": "/health"
        }
    }

@app.get("/health")
async def health_check():
    if not ENV_VARS_VALID:
        return {
            "status": "unhealthy",
            "error": "Missing required environment variables",
            "missing_vars": missing_vars,
            "imports": "success" if IMPORTS_SUCCESS else "failed"
        }
    
    if not IMPORTS_SUCCESS:
        return {
            "status": "unhealthy",
            "error": "Import failed",
            "import_error": IMPORT_ERROR,
            "imports": "failed"
        }
    
    try:
        # Test database connection
        supabase = get_supabase_client()
        # Simple query to test connection
        test_response = supabase.table("users").select("id").limit(1).execute()
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": "2025-01-02",
            "api_version": os.getenv("APP_VERSION", "1.0.0")
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
            "timestamp": "2025-01-02"
        }

# Include routers only if imports are successful and env vars are valid
if IMPORTS_SUCCESS and ENV_VARS_VALID:
    try:
        app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
        app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
        app.include_router(products.router, prefix="/api/v1/products", tags=["Products"])
        app.include_router(cart.router, prefix="/api/v1/cart", tags=["Cart"])
        app.include_router(orders.router, prefix="/api/v1/orders", tags=["Orders"])
        app.include_router(payments.router, prefix="/api/v1/payments", tags=["Payments"])
    except Exception as e:
        print(f"Router inclusion error: {e}")

# Vercel serverless function handler
handler = app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)