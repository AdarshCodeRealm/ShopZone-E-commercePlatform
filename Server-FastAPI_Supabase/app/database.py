from supabase import create_client, Client
from functools import lru_cache
import os
from dotenv import load_dotenv

load_dotenv()

@lru_cache()
def get_supabase_client() -> Client:
    """Create and return a Supabase client instance"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")
    
    if not url:
        raise ValueError("SUPABASE_URL environment variable is not set")
    if not key:
        raise ValueError("SUPABASE_ANON_KEY environment variable is not set")
    
    try:
        return create_client(url, key)
    except Exception as e:
        raise ValueError(f"Failed to create Supabase client: {str(e)}")

@lru_cache()
def get_supabase_admin_client() -> Client:
    """Create and return a Supabase admin client instance with service role key"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url:
        raise ValueError("SUPABASE_URL environment variable is not set")
    if not key:
        raise ValueError("SUPABASE_SERVICE_ROLE_KEY environment variable is not set")
    
    try:
        return create_client(url, key)
    except Exception as e:
        raise ValueError(f"Failed to create Supabase admin client: {str(e)}")

def get_current_supabase() -> Client:
    """Dependency to get Supabase client"""
    return get_supabase_client()

# Test function to validate configuration
def test_supabase_connection():
    """Test the Supabase connection without caching"""
    try:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_ANON_KEY")
        
        if not url or not key:
            return False, "Missing environment variables"
            
        client = create_client(url, key)
        # Try a simple query
        response = client.table("users").select("id").limit(1).execute()
        return True, "Connection successful"
    except Exception as e:
        return False, f"Connection failed: {str(e)}"