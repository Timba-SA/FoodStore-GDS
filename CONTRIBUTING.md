# Contributing to FoodStore

Welcome to the FoodStore e-commerce platform! This guide will help you set up the development environment and understand our development workflow.

## Table of Contents

- [Development Environment Setup](#development-environment-setup)
- [Project Structure](#project-structure)
- [Commit Conventions](#commit-conventions)
- [Branch Naming](#branch-naming)
- [Development Workflow](#development-workflow)

## Development Environment Setup

### Prerequisites

- **Python 3.11+** (for backend)
- **Node.js 18+** (for frontend)
- **PostgreSQL 15+** (for database)
- **Git** (for version control)

### Backend Setup

1. **Create a Python virtual environment:**

```bash
cd backend
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

2. **Install dependencies:**

```bash
pip install -r requirements.txt
```

3. **Configure environment variables:**

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your local configuration
# Especially update DATABASE_URL to point to your PostgreSQL instance
```

4. **Database setup:**

```bash
# Run migrations to create the database schema
python -m alembic upgrade head

# Seed the database with initial data (roles, order states, payment methods, admin user)
python -m app.db.seed
```

5. **Start the development server:**

```bash
# Run the FastAPI server
python -m app

# Server will be available at http://localhost:8000
# API docs at http://localhost:8000/docs
```

### Frontend Setup

1. **Install dependencies:**

```bash
cd frontend
npm install
```

2. **Configure environment variables:**

```bash
# Copy the example file
cp .env.example .env

# Edit .env if needed (usually defaults work for local development)
```

3. **Start the development server:**

```bash
npm run dev

# Server will be available at http://localhost:5173
```

4. **Available npm scripts:**

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
```

## Project Structure

### Backend Structure

```
backend/
├── app/
│   ├── core/              # Core configuration
│   │   ├── config.py      # Application settings
│   │   ├── middleware.py  # CORS, logging, exception handlers
│   │   └── dependencies.py# Dependency injection
│   ├── db/                # Database layer
│   │   ├── base.py        # SQLModel base classes
│   │   ├── models/        # Database models (entities)
│   │   ├── session.py     # Database connection management
│   │   └── seed.py        # Database seeding script
│   ├── modules/           # Feature modules
│   │   └── [module]/
│   │       ├── router.py  # API routes
│   │       ├── service.py # Business logic
│   │       ├── schema.py  # Pydantic schemas
│   │       └── repository.py # Data access
│   ├── main.py           # FastAPI application factory
│   └── __main__.py       # Entry point for python -m app
├── alembic/              # Database migrations
├── requirements.txt      # Python dependencies
├── pyproject.toml       # Project metadata
├── .env.example         # Example environment variables
└── .gitignore          # Git ignore rules
```

### Frontend Structure (Feature-Sliced Design)

```
frontend/
├── src/
│   ├── app/              # Application layer
│   │   ├── routes/       # Router configuration
│   │   ├── App.tsx       # Root component
│   │   └── index.css     # Global styles
│   ├── pages/            # Page components (one per route)
│   ├── widgets/          # Complex reusable components
│   ├── features/         # Feature modules
│   │   └── auth/
│   │       ├── store/    # Zustand stores
│   │       └── api/      # API calls
│   ├── entities/         # Domain models
│   ├── shared/           # Shared utilities
│   │   ├── api/          # Axios client
│   │   └── query/        # React Query configuration
│   └── index.tsx         # Entry point
├── index.html           # HTML template
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── tailwind.config.js   # Tailwind configuration
├── postcss.config.js    # PostCSS configuration
├── package.json         # Dependencies
└── .gitignore          # Git ignore rules
```

## Database Schema

The project includes 17 tables organized in three domains:

### User Management
- `usuarios` - User accounts
- `roles` - Role definitions
- `usuario_roles` - User-role associations
- `refresh_tokens` - JWT refresh tokens
- `direcciones_entrega` - Delivery addresses

### Products & Inventory
- `categorias` - Product categories
- `productos` - Product catalog
- `ingredientes` - Product ingredients
- `productos_categorias` - Product-category associations
- `productos_ingredientes` - Product-ingredient associations

### Orders & Payments
- `formas_pago` - Payment methods
- `estados_pedido` - Order statuses
- `pedidos` - Customer orders
- `detalles_pedido` - Order line items
- `historial_estados_pedido` - Order status history
- `pagos` - Payment records

### Key Features
- **Soft Delete Pattern**: All tables include `deleted_at` field for soft deletes
- **Audit Trail**: All tables have `created_at` and `updated_at` timestamps
- **Normalized Design**: All tables follow 3NF principles
- **Strategic Indexes**: Performance indexes on frequently queried columns
- **Referential Integrity**: Foreign keys maintain data consistency

## Database Migrations

### Creating a new migration:

```bash
# Make sure your models are updated
cd backend

# Generate migration from model changes
alembic revision --autogenerate -m "Description of changes"

# Review the generated migration file in alembic/versions/

# Apply the migration
alembic upgrade head
```

### Reverting migrations:

```bash
# Downgrade to previous version
alembic downgrade -1

# Or downgrade to specific revision
alembic downgrade <revision_id>
```

### Database seeding:

```bash
# Seed database with initial data (idempotent)
python -m app.db.seed

# This will create:
# - 4 roles (admin, customer, seller, moderator)
# - 6 order states (pendiente, confirmado, enviado, entregado, cancelado, devuelto)
# - 3 payment methods (mercado_pago, tarjeta_credito, transferencia)
# - 1 admin user (admin@foodstore.local / admin123)
```

## Commit Conventions

We use **Conventional Commits** for clear, semantic commit messages.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (formatting, semicolons, etc.)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to build process, dependencies, or tooling

### Examples

```bash
# Feature
git commit -m "feat(auth): add JWT refresh token endpoint"

# Bug fix
git commit -m "fix(products): correct price calculation for bulk orders"

# Documentation
git commit -m "docs: update API response schemas in README"

# Backend infrastructure
git commit -m "chore(backend): upgrade FastAPI to 0.110.0"

# With body and footer
git commit -m "feat(orders): implement order status tracking

Add comprehensive order status history tracking with timestamps
and status transition validation.

Closes #123"
```

### Scope Examples

- **Backend scopes**: `auth`, `users`, `products`, `orders`, `payments`, `db`, `config`
- **Frontend scopes**: `auth`, `products`, `cart`, `checkout`, `ui`, `router`
- **Infrastructure**: `backend`, `frontend`, `docker`, `ci`

## Branch Naming

Branch names should follow this pattern:

```
<type>/<ticket-or-feature-name>
```

### Types

- `feature/` - New feature development
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions
- `chore/` - Build/tool/dependency updates

### Examples

```bash
# Feature branch
git checkout -b feature/user-authentication

# Bug fix branch
git checkout -b fix/product-filter-bug

# Documentation branch
git checkout -b docs/api-setup-guide

# Create and push a new branch
git checkout -b feature/cart-functionality
git push -u origin feature/cart-functionality
```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/my-feature
```

### 2. Make Changes

```bash
# Backend changes
cd backend
# ... make your changes ...

# Frontend changes
cd frontend
# ... make your changes ...
```

### 3. Test Your Changes

```bash
# Test backend
cd backend
pytest  # (when tests are available)

# Test frontend
cd frontend
npm run lint
npm run type-check
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat(scope): description of changes"
```

### 5. Push to Remote

```bash
git push origin feature/my-feature
```

### 6. Create a Pull Request

- Create PR on GitHub
- Add a clear description of the changes
- Reference related issues with `Closes #123`
- Request review from team members

### 7. Code Review & Merge

- Address review comments
- Ensure CI/CD checks pass
- Merge when approved

## API Documentation

Once the backend is running, access the interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Useful Commands

### Backend

```bash
# Run migrations
alembic upgrade head
alembic downgrade -1

# Seed database
python -m app.db.seed

# Run development server
python -m app

# Format code
black app
ruff check app --fix

# Type checking
mypy app
```

### Frontend

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Check types
npm run type-check

# Format code
npm run format

# Lint code
npm run lint
```

### Git

```bash
# View commit history
git log --oneline -10

# Create a tag
git tag -a v0.1.0 -m "Release version 0.1.0"
git push origin v0.1.0

# Check branch status
git status
git branch -a
```

## Troubleshooting

### Database Connection Issues

```bash
# Verify PostgreSQL is running
# Check DATABASE_URL in .env
# Ensure credentials are correct
# Try connecting with psql: psql -U foodstore -d foodstore_db
```

### Python Virtual Environment

```bash
# If packages not found, reactivate venv
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate      # Windows

# Reinstall packages if needed
pip install -r requirements.txt
```

### Node Modules Issues

```bash
# Clear cache and reinstall
rm -rf node_modules
npm install

# Or use npm ci for production
npm ci
```

### Port Already in Use

```bash
# Backend (8000)
# Ensure no other service is using port 8000
# Or change in .env or uvicorn command

# Frontend (5173)
# Ensure no other service is using port 5173
# Or change in vite.config.ts
```

## Questions?

If you have questions or encounter issues:

1. Check existing documentation and READMEs
2. Review API documentation in Swagger UI
3. Check git history for similar changes
4. Reach out to the team

Happy coding! 🚀
