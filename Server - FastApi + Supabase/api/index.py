import sys
import os

# Add the parent directory to Python path for module imports
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

# Import the FastAPI app
from main import app

# Vercel requires this exact export name
def handler(request):
    return app