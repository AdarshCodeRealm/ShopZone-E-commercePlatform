from fastapi import FastAPI
from mangum import Mangum
import sys
import os

# Add the parent directory to Python path for module imports
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

try:
    # Import the FastAPI app
    from main import app
    
    # Create the handler for Vercel using Mangum
    handler = Mangum(app)
except Exception as e:
    # Fallback FastAPI app in case main import fails
    print(f"Failed to import main app: {e}")
    
    fallback_app = FastAPI(title="API Error Handler")
    
    @fallback_app.get("/")
    async def fallback_root():
        return {
            "error": "Application failed to initialize",
            "details": str(e),
            "suggestion": "Check environment variables and dependencies"
        }
    
    handler = Mangum(fallback_app)