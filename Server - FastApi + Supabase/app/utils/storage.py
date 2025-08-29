"""
Storage utilities for Supabase Storage operations
"""
import os
import uuid
import base64
from io import BytesIO
from PIL import Image
from typing import Optional, Tuple
from supabase import create_client, Client
from fastapi import HTTPException, UploadFile
import mimetypes

def upload_image_to_bucket(supabase_client: Client, bucket_name: str, file_data: bytes, remote_file_path: str, content_type: str = "image/jpeg") -> str:
    """Upload image data to Supabase storage bucket - based on test_storage.py function"""
    try:
        print(f"📤 Uploading image to {bucket_name}/{remote_file_path}")
        print(f"📊 File size: {len(file_data)} bytes")
        print(f"🔑 Using service role key to bypass RLS policies")
        
        # Upload to Supabase storage using service client (bypasses RLS)
        upload_response = supabase_client.storage.from_(bucket_name).upload(
            remote_file_path,
            file_data,
            file_options={
                "content-type": content_type
                # Removed upsert parameter to avoid header value error
            }
        )
        
        # Check if upload was successful
        if hasattr(upload_response, 'error') and upload_response.error:
            print(f"❌ Upload failed: {upload_response.error}")
            raise Exception(f"Upload failed: {upload_response.error}")
        
        # Get the public URL of uploaded file
        public_url = supabase_client.storage.from_(bucket_name).get_public_url(remote_file_path)
        print(f"✅ Image uploaded successfully!")
        print(f"🔗 Public URL: {public_url}")
        return public_url
        
    except Exception as e:
        print(f"❌ Upload error: {e}")
        raise Exception(f"Upload error: {str(e)}")

class StorageManager:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        self.supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")
        
        if not all([self.supabase_url, self.supabase_service_key]):
            raise ValueError("Missing Supabase credentials in environment variables")
        
        # Service client for uploads (bypasses RLS)
        self.service_client: Client = create_client(self.supabase_url, self.supabase_service_key)
        # Public client for getting URLs
        self.public_client: Client = create_client(self.supabase_url, self.supabase_anon_key)
        
        self.bucket_name = "Ecommerce-Storage"
        self.avatar_folder = "avatars"
        self.max_file_size = 5 * 1024 * 1024  # 5MB
        self.allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]

    def _validate_image(self, file_data: bytes, content_type: str) -> bool:
        """Validate image file"""
        if len(file_data) > self.max_file_size:
            raise HTTPException(status_code=413, detail="File too large. Maximum size is 5MB")
        
        if content_type not in self.allowed_types:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file type. Allowed types: {', '.join(self.allowed_types)}"
            )
        
        try:
            # Verify it's a valid image
            Image.open(BytesIO(file_data))
            return True
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid image file")

    def _resize_image(self, file_data: bytes, max_size: Tuple[int, int] = (800, 800)) -> bytes:
        """Resize image to optimize storage"""
        try:
            image = Image.open(BytesIO(file_data))
            
            # Convert RGBA to RGB if necessary
            if image.mode in ("RGBA", "P"):
                image = image.convert("RGB")
            
            # Resize maintaining aspect ratio
            image.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # Save optimized image
            output = BytesIO()
            image.save(output, format="JPEG", quality=85, optimize=True)
            return output.getvalue()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error processing image: {str(e)}")

    async def upload_avatar(self, user_id: str, file: UploadFile) -> str:
        """Upload user avatar to Supabase Storage"""
        try:
            # Read file data
            file_data = await file.read()
            content_type = file.content_type or mimetypes.guess_type(file.filename)[0]
            
            # Validate image
            self._validate_image(file_data, content_type)
            
            # Resize image for optimization
            optimized_data = self._resize_image(file_data)
            
            # Generate unique filename
            file_extension = "jpg"  # Always save as JPEG for consistency
            filename = f"{user_id}_{uuid.uuid4().hex}.{file_extension}"
            file_path = f"{self.avatar_folder}/{filename}"
            
            # Delete old avatar if exists
            await self.delete_user_avatar(user_id)
            
            # Upload to Supabase Storage
            upload_response = self.service_client.storage.from_(self.bucket_name).upload(
                file_path,
                optimized_data,
                file_options={
                    "content-type": "image/jpeg",
                    "upsert": True  # Changed from "true" string to boolean True
                }
            )
            
            if hasattr(upload_response, 'error') and upload_response.error:
                raise HTTPException(status_code=500, detail=f"Upload failed: {upload_response.error}")
            
            # Get public URL
            public_url = self.public_client.storage.from_(self.bucket_name).get_public_url(file_path)
            
            return public_url
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Upload error: {str(e)}")

    async def upload_from_base64(self, user_id: str, base64_data: str) -> str:
        """Upload avatar from base64 encoded data"""
        try:
            # Remove data URL prefix if present
            if base64_data.startswith('data:'):
                base64_data = base64_data.split(',')[1]
            
            # Decode base64
            file_data = base64.b64decode(base64_data)
            
            # Validate and process image
            self._validate_image(file_data, "image/jpeg")
            optimized_data = self._resize_image(file_data)
            
            # Generate filename and upload
            filename = f"{user_id}_{uuid.uuid4().hex}.jpg"
            file_path = f"{self.avatar_folder}/{filename}"
            
            # Delete old avatar if exists
            await self.delete_user_avatar(user_id)
            
            # Upload to storage
            upload_response = self.service_client.storage.from_(self.bucket_name).upload(
                file_path,
                optimized_data,
                file_options={
                    "content-type": "image/jpeg",
                    "upsert": True  # Changed from "true" string to boolean True
                }
            )
            
            if hasattr(upload_response, 'error') and upload_response.error:
                raise HTTPException(status_code=500, detail=f"Upload failed: {upload_response.error}")
            
            # Get public URL
            public_url = self.public_client.storage.from_(self.bucket_name).get_public_url(file_path)
            
            return public_url
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Base64 upload error: {str(e)}")

    async def delete_user_avatar(self, user_id: str) -> bool:
        """Delete user's existing avatar from storage"""
        try:
            # List files in avatar folder
            files = self.service_client.storage.from_(self.bucket_name).list(self.avatar_folder)
            
            # Find and delete user's existing avatars
            user_files = [f for f in files if f['name'].startswith(f"{user_id}_")]
            
            if user_files:
                file_paths = [f"{self.avatar_folder}/{f['name']}" for f in user_files]
                delete_response = self.service_client.storage.from_(self.bucket_name).remove(file_paths)
                
                if hasattr(delete_response, 'error') and delete_response.error:
                    print(f"Warning: Failed to delete old avatar: {delete_response.error}")
                    return False
            
            return True
            
        except Exception as e:
            print(f"Warning: Error deleting old avatar: {str(e)}")
            return False

    def get_avatar_url(self, file_path: str) -> str:
        """Get public URL for avatar"""
        return self.public_client.storage.from_(self.bucket_name).get_public_url(file_path)

# Global storage manager instance
storage_manager = StorageManager()