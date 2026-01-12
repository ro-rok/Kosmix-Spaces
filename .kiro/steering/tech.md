# Technology Stack

## Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with SWC for fast compilation
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with shadcn/ui
- **State Management**: TanStack Query for server state, React Context for auth
- **Routing**: React Router v6 with lazy loading
- **Forms**: React Hook Form with Zod validation

## Backend
- **Framework**: FastAPI (Python)
- **Database**: MongoDB with Motor (async driver)
- **Authentication**: JWT with bcrypt password hashing
- **File Storage**: Cloudinary for image management
- **API Documentation**: Auto-generated OpenAPI/Swagger docs

## Development Tools
- **Package Manager**: npm (frontend), pip (backend)
- **Code Quality**: ESLint, TypeScript strict mode
- **Environment**: Docker Compose for local development

## Common Commands

### Frontend Development
```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Start dev server (port 8080)
npm run build        # Production build
npm run preview      # Preview production build
```

### Backend Development
```bash
cd backend
pip install -r requirements.txt    # Install dependencies
uvicorn app.main:app --reload      # Start dev server (port 8000)
python -m pytest                   # Run tests (if available)
```

### Full Stack Development
```bash
# Use provided batch files for Windows
start-dev.bat        # Start both frontend and backend
# Or use PowerShell script
start-dev.ps1
```

## Environment Configuration
- Frontend: `.env` with `VITE_API_BASE_URL`
- Backend: `.env` with MongoDB, JWT, Cloudinary, and CORS settings
- Docker: `docker-compose.yml` for containerized development

## Performance Optimizations
- Code splitting with lazy loading for admin/partner routes
- Image compression and optimization
- Bundle optimization with manual chunks
- Performance monitoring and analytics