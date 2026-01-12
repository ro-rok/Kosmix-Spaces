# Project Structure

## Root Organization
```
├── frontend/          # React TypeScript application
├── backend/           # FastAPI Python application
├── .kiro/            # Kiro configuration and steering
└── *.md              # Documentation files
```

## Frontend Structure (`frontend/`)
```
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── ui/              # shadcn/ui base components
│   │   └── *.tsx            # Custom components
│   ├── pages/               # Public page components
│   ├── admin/               # Admin-specific components and pages
│   │   └── pages/           # Admin page components
│   ├── partner/             # Partner-specific components and pages
│   │   └── pages/           # Partner page components
│   ├── contexts/            # React contexts (AuthContext)
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions and configurations
│   ├── types/               # TypeScript type definitions
│   └── assets/              # Static assets
├── public/                  # Public static files
└── package.json             # Dependencies and scripts
```

## Backend Structure (`backend/`)
```
├── app/
│   ├── core/                # Core configuration and utilities
│   │   ├── config.py        # Settings and environment config
│   │   ├── security.py      # Authentication utilities
│   │   └── errors.py        # Custom exception classes
│   ├── db/                  # Database layer
│   │   ├── mongodb.py       # Database connection
│   │   └── indexes.py       # Database indexes
│   ├── models/              # Pydantic models for data validation
│   ├── schemas/             # API request/response schemas
│   ├── routers/             # FastAPI route handlers
│   ├── services/            # Business logic layer
│   ├── middleware/          # Custom middleware
│   └── main.py              # FastAPI application entry point
├── requirements.txt         # Python dependencies
└── docker-compose.yml       # Docker configuration
```

## Key Architectural Patterns

### Frontend
- **Route-based code splitting**: Admin and partner routes are lazy-loaded
- **Component composition**: UI components built with Radix primitives
- **Custom hooks**: Reusable logic for API calls, authentication, and form handling
- **Context providers**: Global state management for authentication
- **Type-safe API**: TypeScript interfaces for all API interactions

### Backend
- **Layered architecture**: Routers → Services → Models → Database
- **Dependency injection**: Settings and database connections injected via FastAPI
- **Error handling**: Centralized error handling with custom exception classes
- **Authentication middleware**: JWT-based auth with role-based access control
- **Database abstraction**: Motor async driver with Pydantic models

## File Naming Conventions
- **Frontend**: PascalCase for components (`UserProfile.tsx`), camelCase for utilities (`apiClient.ts`)
- **Backend**: snake_case for all Python files (`user_service.py`)
- **Types**: Descriptive interfaces (`UserProfile`, `ApiResponse<T>`)

## Import Patterns
- **Frontend**: Use `@/` alias for src imports, relative imports for same-directory files
- **Backend**: Absolute imports from app root (`from app.core.config import settings`)

## Environment Files
- **Frontend**: `.env` with `VITE_` prefixed variables
- **Backend**: `.env` with uppercase environment variables
- **Docker**: Environment variables defined in `docker-compose.yml`