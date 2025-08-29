# FastAPI Ecommerce Backend with Supabase

A complete FastAPI backend for an ecommerce website with Supabase integration, featuring user authentication, product management, shopping cart, and order processing.

## Features

- 🔐 **User Authentication** - JWT-based authentication with registration and login
- 👤 **User Management** - Profile management and user data
- 🛍️ **Product Management** - CRUD operations for products with categories and search
- 🛒 **Shopping Cart** - Add, update, remove items from cart
- 📦 **Order Management** - Create orders, track status, cancel orders
- 🔒 **Security** - Row Level Security (RLS) with Supabase
- 📝 **API Documentation** - Auto-generated with FastAPI/Swagger

## Tech Stack

- **FastAPI** - Modern Python web framework
- **Supabase** - Backend-as-a-Service with PostgreSQL
- **Pydantic** - Data validation and serialization
- **JWT** - JSON Web Tokens for authentication
- **PostgreSQL** - Relational database via Supabase
- **Uvicorn** - ASGI server

## Project Structure

```
fastapi-supabase/
├── app/
│   ├── __init__.py
│   ├── auth.py              # Authentication utilities
│   ├── database.py          # Supabase client configuration
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py          # User models
│   │   ├── product.py       # Product models
│   │   ├── cart.py          # Cart models
│   │   ├── order.py         # Order models
│   │   └── response.py      # Response models
│   └── routers/
│       ├── __init__.py
│       ├── auth.py          # Authentication endpoints
│       ├── users.py         # User management endpoints
│       ├── products.py      # Product endpoints
│       ├── cart.py          # Shopping cart endpoints
│       └── orders.py        # Order management endpoints
├── database_schema.sql      # Supabase database schema
├── main.py                  # FastAPI application entry point
├── requirements.txt         # Python dependencies
├── .env                     # Environment variables
└── README.md               # This file
```

## Setup Instructions

### 1. Clone and Setup Environment

```bash
# Navigate to your project directory
cd "fastapi supabase"

# Install dependencies (already done if using the created virtual environment)
pip install -r requirements.txt
```

### 2. Supabase Setup

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note down your project URL and API keys

2. **Setup Database**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `database_schema.sql`
   - Run the SQL to create tables, indexes, and sample data

3. **Configure Environment Variables**
   - Update the `.env` file with your Supabase credentials:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# JWT Configuration
SECRET_KEY=your-very-secure-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Application Settings
APP_NAME=Ecommerce API
APP_VERSION=1.0.0
DEBUG=True
```

### 3. Run the Application

```bash
# Using uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or run the main.py file
python main.py
```

The API will be available at:
- **API**: http://localhost:8000
- **Documentation**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login

### Users
- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update current user profile
- `GET /api/v1/users/profile/{user_id}` - Get user profile by ID

### Products
- `GET /api/v1/products/` - Get all products (with filters)
- `GET /api/v1/products/{product_id}` - Get specific product
- `POST /api/v1/products/` - Create new product (admin)
- `PUT /api/v1/products/{product_id}` - Update product (admin)
- `DELETE /api/v1/products/{product_id}` - Delete product (admin)
- `GET /api/v1/products/categories/list` - Get all categories

### Shopping Cart
- `GET /api/v1/cart/` - Get user's cart
- `POST /api/v1/cart/items` - Add item to cart
- `PUT /api/v1/cart/items/{item_id}` - Update cart item
- `DELETE /api/v1/cart/items/{item_id}` - Remove item from cart
- `DELETE /api/v1/cart/clear` - Clear entire cart

### Orders
- `GET /api/v1/orders/` - Get user's orders
- `GET /api/v1/orders/{order_id}` - Get specific order
- `POST /api/v1/orders/` - Create new order
- `POST /api/v1/orders/from-cart` - Create order from cart
- `PUT /api/v1/orders/{order_id}/cancel` - Cancel order

## Usage Examples

### 1. Register a User
```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "full_name": "John Doe",
    "phone": "+1234567890",
    "address": "123 Main St, City, State"
  }'
```

### 2. Login
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### 3. Get Products
```bash
curl -X GET "http://localhost:8000/api/v1/products/"
```

### 4. Add Item to Cart (requires authentication)
```bash
curl -X POST "http://localhost:8000/api/v1/cart/items" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "product_id": "product-uuid-here",
    "quantity": 2
  }'
```

## Database Schema

The application uses the following main tables:

- **users** - User accounts and profiles
- **products** - Product catalog
- **cart_items** - Shopping cart items
- **orders** - Customer orders
- **order_items** - Items within each order

All tables include proper relationships, constraints, and indexes for optimal performance.

## Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - Bcrypt for secure password storage
- **Row Level Security** - Supabase RLS policies for data isolation
- **Input Validation** - Pydantic models for request validation
- **CORS** - Configurable cross-origin resource sharing

## Development

### Adding New Endpoints
1. Create/update models in `app/models/`
2. Add router functions in `app/routers/`
3. Include router in `main.py`

### Database Migrations
When adding new tables or modifying schema:
1. Update `database_schema.sql`
2. Run the new SQL in Supabase SQL Editor
3. Update corresponding Pydantic models

## Production Deployment

### Environment Variables
Make sure to set secure values for production:
- Use a strong `SECRET_KEY`
- Set `DEBUG=False`
- Configure proper `CORS` origins
- Use environment-specific Supabase credentials

### Security Considerations
- Enable HTTPS in production
- Set up proper CORS policies
- Use strong passwords and JWT secrets
- Monitor and log API usage
- Implement rate limiting if needed

## Troubleshooting

### Common Issues

1. **Supabase Connection Error**
   - Check your SUPABASE_URL and API keys
   - Ensure your Supabase project is active

2. **Authentication Errors**
   - Verify JWT token is included in Authorization header
   - Check token expiration time

3. **Database Errors**
   - Ensure database schema is properly set up
   - Check Supabase RLS policies are correctly configured

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.