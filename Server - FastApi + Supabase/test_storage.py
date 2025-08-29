from supabase import create_client, Client
import requests
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Added service key

# Create two clients - one for uploads (with service key), one for public access
supabase_service: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)  # For uploads
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)  # For public access
bucket_name = os.getenv("STORAGE_BUCKET_NAME", "Ecommerce-Storage")


def upload_image_to_bucket( local_file_path, remote_file_path):
    """Upload a local image file to Supabase storage bucket using service key"""
    try:
        # Check if local file exists
        if not os.path.exists(local_file_path):
            print(f"❌ Local file {local_file_path} not found!")
            return False
        
        # Read the local file
        with open(local_file_path, 'rb') as f:
            file_data = f.read()
        
        print(f"📤 Uploading {local_file_path} to {bucket_name}/{remote_file_path}")
        print(f"📊 File size: {len(file_data)} bytes")
        print(f"🔑 Using service role key to bypass RLS policies")
        
        # Upload to Supabase storage using service client (bypasses RLS)
        upload_response = supabase_service.storage.from_(bucket_name).upload(
            remote_file_path,
            file_data,
            file_options={
                "content-type": "image/png",
                "upsert": "true"  # Allow overwriting existing files
            }
        )
        
        # Check if upload was successful
        if hasattr(upload_response, 'error') and upload_response.error:
            print(f"❌ Upload failed: {upload_response.error}")
            return False
        
        # Get the public URL of uploaded file using regular client
        public_url = supabase.storage.from_(bucket_name).get_public_url(remote_file_path)
        print(f"✅ Image uploaded successfully!")
        print(f"🔗 Public URL: {public_url}")
        return public_url
        
    except Exception as e:
        print(f"❌ Upload error: {e}")
        return False

def fetch_image_from_public_bucket(bucket_name, file_path, local_filename):
    try:
        # Get the public URL for the image
        public_url = supabase.storage.from_(bucket_name).get_public_url(file_path)
        print(f"Generated URL: {public_url}")

        # Download the image using the requests library
        response = requests.get(public_url)
        response.raise_for_status()  # Raise an exception for bad status codes (e.g., 404)

        # Save the image to a local file
        with open(local_filename, 'wb') as f:
            f.write(response.content)

        print(f"Image successfully downloaded to {local_filename}")
        return local_filename

    except Exception as e:
        print(f"An error occurred: {e}")
        return None

# if __name__ == "__main__":
#     BUCKET_NAME = "Ecommerce-Storage"
#     LOCAL_FILE_NAME = "downloaded_image.png"
#     REMOTE_FILE_PATH = "ss1.png"
    
#     print("🚀 Uploading image to Supabase Storage...")
#     success = upload_image_to_bucket( LOCAL_FILE_NAME, REMOTE_FILE_PATH)
    
#     if success:
#         print("\n🎉 Upload completed successfully!",success)
#     else:
#         print("\n❌ Upload failed!")


