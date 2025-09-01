from fastapi import FastAPI
from mangum import Mangum
import sys
import os

# Add the parent directory to Python path for module imports
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

# Import the FastAPI app
from main import app

# Create the handler for Vercel using Mangum
handler = Mangum(app)