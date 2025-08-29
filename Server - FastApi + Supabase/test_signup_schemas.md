# Test Schemas for Signup Route
# Use these JSON payloads to test the /auth/signup endpoint

## 1. Valid Signup (Minimal Required Fields)
{
    "email": "john.doe@example.com",
    "full_name": "John Doe",
    "password": "securepass123"
}

## 2. Valid Signup (With All Optional Fields)
{
    "email": "jane.smith@example.com",
    "full_name": "Jane Smith",
    "phone": "9876543210",
    "address": "123 Main Street, New York, NY 10001",
    "password": "mypassword456",
    "avatar": null
}

## 3. Valid Signup (With Base64 Avatar - Sample)
{
    "email": "mike.wilson@example.com",
    "full_name": "Mike Wilson",
    "phone": "9123456789",
    "address": "456 Oak Avenue, Los Angeles, CA 90001",
    "password": "strongpass789",
    "avatar": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."
}

## 4. Test Cases for Validation Errors

### 4a. Missing Required Field (email)
{
    "full_name": "Test User",
    "password": "testpass123"
}
# Expected Error: Field 'email' is required

### 4b. Missing Required Field (full_name)
{
    "email": "test@example.com",
    "password": "testpass123"
}
# Expected Error: Field 'full_name' is required

### 4c. Missing Required Field (password)
{
    "email": "test@example.com",
    "full_name": "Test User"
}
# Expected Error: Field 'password' is required

### 4d. Invalid Email Format
{
    "email": "invalid-email",
    "full_name": "Test User",
    "password": "testpass123"
}
# Expected Error: Invalid email format

### 4e. Password Too Short
{
    "email": "test@example.com",
    "full_name": "Test User",
    "password": "123"
}
# Expected Error: Password must be at least 6 characters long

### 4f. Invalid Phone Number Format (if validation added)
{
    "email": "test@example.com",
    "full_name": "Test User",
    "phone": "invalid-phone",
    "password": "testpass123"
}

## 5. Edge Cases

### 5a. Very Long Full Name
{
    "email": "longname@example.com",
    "full_name": "This is a very long full name that exceeds normal length expectations for testing purposes",
    "password": "testpass123"
}

### 5b. Special Characters in Name
{
    "email": "special@example.com",
    "full_name": "José María O'Connor-Smith",
    "password": "testpass123"
}

### 5c. Empty Optional Fields
{
    "email": "empty@example.com",
    "full_name": "Empty Fields User",
    "phone": "",
    "address": "",
    "password": "testpass123",
    "avatar": ""
}

## 6. Duplicate Email Test (Second Request)
{
    "email": "john.doe@example.com",
    "full_name": "Another John Doe",
    "password": "differentpass123"
}
# Expected Error: Email already registered

## 7. SQL Injection Attempt (Should be handled by Pydantic/Supabase)
{
    "email": "hack@example.com",
    "full_name": "'; DROP TABLE users; --",
    "password": "hackpass123"
}

## 8. Large Avatar Data Test
{
    "email": "avatar@example.com",
    "full_name": "Avatar Test User",
    "password": "avatarpass123",
    "avatar": "data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
}

## Expected Successful Response Format:
{
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 43200,
    "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "john.doe@example.com",
        "full_name": "John Doe",
        "phone": "9876543210",
        "address": "123 Main Street, New York, NY 10001",
        "avatar": "https://supabase-url/storage/v1/object/public/avatars/user-id.jpg",
        "created_at": "2025-08-29T10:30:00Z",
        "updated_at": "2025-08-29T10:30:00Z",
        "is_active": true
    },
    "message": "Account created successfully"
}

## Testing Instructions:

1. **Using FastAPI Docs (localhost:8000/docs)**:
   - Navigate to /auth/signup endpoint
   - Click "Try it out"
   - Paste any of the above JSON payloads
   - Execute the request

2. **Using curl**:
```bash
curl -X POST "http://localhost:8000/auth/signup" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "full_name": "Test User",
       "password": "testpass123"
     }'
```

3. **Using Postman**:
   - Method: POST
   - URL: http://localhost:8000/auth/signup
   - Headers: Content-Type: application/json
   - Body: Raw JSON (any of the above payloads)

## Database Verification:
After successful signup, verify in Supabase that:
- User record is created in 'users' table
- Password is hashed (not plain text)
- Avatar URL is generated (if provided or default)
- All fields are properly stored