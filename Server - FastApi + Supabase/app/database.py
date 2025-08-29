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
    
    if not url or not key:
        raise ValueError("Supabase URL and ANON KEY must be set in environment variables")
    
    return create_client(url, key)

@lru_cache()
def get_supabase_admin_client() -> Client:
    """Create and return a Supabase admin client instance with service role key"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        raise ValueError("Supabase URL and SERVICE ROLE KEY must be set in environment variables")
    
    return create_client(url, key)

def get_current_supabase() -> Client:
    """Dependency to get Supabase client"""
    return get_supabase_client()