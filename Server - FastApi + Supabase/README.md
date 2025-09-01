# ShopZone Ecommerce API Server

A complete FastAPI backend for an e-commerce platform with Supabase integration, designed for serverless deployment on Vercel.

## 🚀 Features

- **FastAPI Framework** - High-performance, easy-to-use, fast to code
- **Supabase Integration** - Database, authentication, and storage
- **JWT Authentication** - Secure user authentication and authorization
- **RESTful API Design** - Clean, intuitive API endpoints
- **Serverless Ready** - Optimized for Vercel deployment
- **CORS Enabled** - Cross-origin resource sharing for frontend integration
- **Pydantic Models** - Data validation and serialization
- **Error Handling** - Comprehensive error handling and logging

## 📋 Prerequisites

- Python 3.12+
- Supabase account and project
- Vercel account (for deployment)

## 🛠 Installation

### Local Development

1. **Clone the repository**
```bash
git clone <repository-url>
cd "Server - FastApi + Supabase"
```

2. **Create virtual environment**
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Environment Setup**
Copy `.env.example` to `.env` and fill in your values:
```env
# App Configuration
APP_NAME=ShopZone Ecommerce API
APP_VERSION=1.0.0

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET_KEY=your_jwt_secret_key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# Frontend URL (for CORS)
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

5. **Run the development server**
```bash
python main.py
```

The API will be available at `http://localhost:8000`
- Interactive API docs: `http://localhost:8000/docs`
- ReDoc documentation: `http://localhost:8000/redoc`

## 🚀 Deployment

### Vercel Deployment

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
vercel --prod
```

4. **Environment Variables**
Set these environment variables in your Vercel dashboard:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET_KEY`
- `JWT_ALGORITHM`
- `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`
- `FRONTEND_URL`

## 📁 Project Structure

```
Server - FastApi + Supabase/
├── api/
│   └── index.py                 # Vercel serverless entry point
├── app/
│   ├── __init__.py
│   ├── auth.py                  # Authentication utilities
│   ├── database.py              # Database connection
│   ├── models/                  # Pydantic models
│   │   ├── user.py
│   │   ├── product.py
│   │   ├── cart.py
│   │   ├── order.py
│   │   └── response.py
│   ├── routers/                 # API route handlers
│   │   ├── auth.py              # Authentication routes
│   │   ├── users.py             # User management
│   │   ├── products.py          # Product catalog
│   │   ├── cart.py              # Shopping cart
│   │   ├── orders.py            # Order management
│   │   └── payments.py          # Payment processing
│   └── utils/
│       └── storage.py           # File storage utilities
├── main.py                      # FastAPI application
├── requirements.txt             # Python dependencies
├── vercel.json                  # Vercel configuration
├── database_schema.sql          # Database schema
└── README.md                    # This file
```

## 🔗 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout

### Products
- `GET /api/v1/products` - Get all products
- `GET /api/v1/products/{id}` - Get product by ID
- `GET /api/v1/products/categories` - Get product categories
- `GET /api/v1/products/category/{category}` - Get products by category

### Cart
- `GET /api/v1/cart` - Get user's cart
- `POST /api/v1/cart/add` - Add item to cart
- `PUT /api/v1/cart/update` - Update cart item
- `DELETE /api/v1/cart/remove/{item_id}` - Remove item from cart
- `DELETE /api/v1/cart/clear` - Clear entire cart

### Orders
- `GET /api/v1/orders` - Get user's orders
- `POST /api/v1/orders/create` - Create new order
- `GET /api/v1/orders/{id}` - Get order by ID
- `PUT /api/v1/orders/{id}/status` - Update order status

### Users
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `POST /api/v1/users/upload-avatar` - Upload profile picture

### Payments
- `POST /api/v1/payments/process` - Process payment
- `GET /api/v1/payments/history` - Get payment history

## 🧪 Health Checks

- `GET /` - API welcome message
- `GET /health` - Health check endpoint
- `GET /api/v1/test` - Test API functionality

## 🔧 Technologies Used

- **FastAPI** - Modern, fast web framework for building APIs
- **Supabase** - Backend-as-a-Service with PostgreSQL
- **Pydantic** - Data validation using Python type annotations
- **JWT** - JSON Web Token for authentication
- **Mangum** - ASGI adapter for running on AWS Lambda/Vercel
- **SQLAlchemy** - SQL toolkit and ORM
- **Uvicorn** - ASGI server implementation
- **Python-Jose** - JavaScript Object Signing and Encryption library
- **Passlib** - Password hashing library
- **Pillow** - Image processing library

## 🛡 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Input validation with Pydantic
- SQL injection prevention
- Rate limiting ready

## 📝 Development

### Adding New Routes

1. Create route handler in `app/routers/`
2. Define Pydantic models in `app/models/`
3. Include router in `main.py`
4. Update this README

### Database Schema

Run the SQL commands in `database_schema.sql` to set up your Supabase database tables.

## 🐛 Troubleshooting

### Common Issues

1. **Import Errors**: Ensure all dependencies are installed
2. **Database Connection**: Check Supabase credentials
3. **CORS Issues**: Verify frontend URL in environment variables
4. **Deployment Failures**: Check Vercel logs and environment variables

### Vercel Deployment Issues

- Ensure Python version matches vercel.json (3.12)
- Check that all environment variables are set
- Verify Mangum is included in requirements.txt
- Check function timeout limits

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Last Updated**: September 1, 2025
**Python Version**: 3.12+
**FastAPI Version**: 0.104.1+