# Kosmix Spaces - Workspace Marketplace

A full-stack application for finding and booking workspace solutions, built with React (frontend) and FastAPI (backend).

## Project Structure

```
├── frontend/          # React + TypeScript frontend
├── backend/           # FastAPI Python backend
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.8+ and pip
- MongoDB (configured in backend/.env)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Start the backend server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

   The backend will be available at: http://localhost:8000
   API documentation: http://localhost:8000/docs

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will be available at: http://localhost:8080

## API Connection

The frontend is configured to connect to the backend at `http://192.168.1.18:8000` (as set in `frontend/.env`).

### Testing the Connection

1. Visit http://localhost:8080/api-test to test the API connection
2. The connection status indicator will appear in the bottom-right corner if there are connection issues
3. Check the browser console for any network errors

## Complete Partner & Admin Workflow

### 🔐 **Admin Credentials**
- **Email**: `swatikapoor@kosmixspaces.in`
- **Password**: `Kosmix@30`

### 📋 **Workflow Steps**

#### 1. Partner Registration
1. Visit http://localhost:8080/partner/login
2. Click "Register" tab
3. Fill in partner details:
   - Workspace Brand Name
   - Contact Name
   - Phone
   - Email
   - Password (min 6 characters)
4. Submit registration → Partner account created with `PENDING` status

#### 2. Admin Approval Process
1. Visit http://localhost:8080/admin/login
2. Login with admin credentials above
3. Navigate to "Partners" section
4. View pending partner registrations
5. Click on partner to update status:
   - **ACTIVE**: Partner can submit listings
   - **SUSPENDED**: Partner access blocked
   - **PENDING**: Awaiting approval (default)

#### 3. Partner Dashboard Access
1. Partner logs in at http://localhost:8080/partner/login
2. **If PENDING**: Dashboard shows approval message, no listing access
3. **If ACTIVE**: Full access to submit and manage listings
4. **If SUSPENDED**: Dashboard shows suspension notice

### 🗄️ **Database Collections**

#### Partners Collection (`partners`)
```json
{
  "_id": ObjectId,
  "workspaceBrandName": "string",
  "contactName": "string", 
  "phone": "string",
  "email": "string",
  "passwordHash": "string",
  "status": "PENDING|ACTIVE|SUSPENDED",
  "adminNotes": "string (optional)",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

#### Admin Users (Environment-based for MVP)
- Single admin user configured via environment variables
- Email and password hash stored in `.env` file
- Future: Can be moved to database collection

### 🔧 **API Endpoints**

#### Partner Authentication
- `POST /api/partner/auth/register` - Partner registration
- `POST /api/partner/auth/login` - Partner login
- `GET /api/partner/auth/me` - Get partner profile

#### Admin Authentication  
- `POST /api/admin/auth/login` - Admin login
- `GET /api/admin/auth/me` - Get admin profile

#### Admin Partner Management
- `GET /api/admin/partners` - List all partners (with filters)
- `GET /api/admin/partners/{id}` - Get partner details
- `PATCH /api/admin/partners/{id}/status` - Update partner status
- `DELETE /api/admin/partners/{id}` - Delete partner

### 🎯 **Key Features Implemented**

#### Frontend
- ✅ Real partner registration with validation
- ✅ JWT-based authentication for partners and admin
- ✅ Partner status checking and dashboard restrictions
- ✅ Admin partner management interface
- ✅ Secure password handling with show/hide
- ✅ Status badges and visual indicators
- ✅ Responsive design for all screens

#### Backend
- ✅ Partner registration with password hashing
- ✅ JWT token generation and validation
- ✅ Partner status management (PENDING/ACTIVE/SUSPENDED)
- ✅ Admin authentication with environment credentials
- ✅ Partner CRUD operations for admin
- ✅ MongoDB integration with proper schemas
- ✅ CORS configuration for frontend

#### Security
- ✅ Bcrypt password hashing
- ✅ JWT tokens with expiration
- ✅ Role-based access control (Partner/Admin)
- ✅ Input validation and sanitization
- ✅ Secure admin credentials in environment

## Environment Configuration

### Frontend (.env)
```
VITE_API_BASE_URL=http://192.168.1.18:8000
```

### Backend (.env)
```
MONGODB_URI=mongodb+srv://...
CORS_ORIGINS=http://192.168.1.18:8080,http://localhost:8080,http://localhost:5173
API_HOST=0.0.0.0
API_PORT=8000
```

## Troubleshooting

### Backend Not Starting
- Check if Python dependencies are installed: `pip install -r requirements.txt`
- Verify MongoDB connection in backend/.env
- Check if port 8000 is available

### Frontend API Errors
- Ensure backend is running at the configured URL
- Check CORS settings in backend/.env
- Visit /api-test page to diagnose connection issues
- Check browser network tab for detailed error messages

### Connection Issues
- Verify the VITE_API_BASE_URL in frontend/.env matches your backend URL
- Check firewall settings if using different machines
- Ensure both servers are running on the correct ports

## Next Steps

1. Start the backend server
2. Start the frontend server  
3. Visit http://localhost:8080 to see the application
4. Test API connection at http://localhost:8080/api-test
5. Check the partner registration button in the navbar