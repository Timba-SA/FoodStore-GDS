# FoodStore Frontend

React + TypeScript frontend for the FoodStore e-commerce platform.

## Requirements

- Node.js 18+
- npm or yarn

## Installation

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your backend API URL
```

## Configuration

Copy `.env.example` to `.env`:

```env
# Backend API
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## Running the Application

### Local Development
```bash
# Development (with hot reload)
npm run dev
```

### Docker Development
Para levantar el frontend junto con el backend y la base de datos:

```bash
# Desde la raíz del proyecto
docker-compose up -d
```

*El frontend estará disponible en `http://localhost:5173`*

### Build for production
```bash
npm run build
```

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── routes/
│   │   │   └── router.tsx          # React Router configuration
│   │   ├── App.tsx                 # Root component
│   │   └── main.tsx                # Entry point
│   ├── features/
│   │   └── auth/
│   │       ├── store/
│   │       │   └── authStore.ts    # Zustand auth store
│   │       ├── RegisterForm.tsx    # Registration form component
│   │       └── __tests__/
│   │           └── RegisterForm.test.tsx
│   ├── pages/
│   │   ├── RegisterPage.tsx        # Registration page
│   │   └── DashboardPage.tsx       # Dashboard page
│   ├── shared/
│   │   ├── api/
│   │   │   ├── auth.ts            # Auth API functions
│   │   │   └── client.ts          # Axios client configuration
│   │   └── components/            # Shared UI components
│   └── index.css                   # Global styles
├── public/                         # Static assets
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Features Implemented

### User Registration (US-001-auth)

**Page**: `/register`

The registration page allows users to create a new account with the following features:

- **Form Fields**:
  - Name (required, 2-100 characters)
  - Email (required, valid email format, unique)
  - Password (required, minimum 8 characters)
  - Confirm Password (must match)
  - Phone Number (optional, maximum 20 characters)

- **Validation**:
  - Client-side validation on all fields
  - Field-level error messages
  - Real-time error clearing when user corrects input
  - Server-side validation errors displayed

- **Success Flow**:
  - Tokens stored in localStorage + Zustand store
  - Auto-redirect to `/dashboard` on success
  - User data available in `useAuthStore()`

- **Error Handling**:
  - Duplicate email: "El email ya está registrado" (409)
  - Validation errors: Detailed field errors (400)
  - Server errors: Generic error message (500)
  - Loading state: Button disabled with "Registrando..." text

**Example Usage**:

```tsx
import RegisterForm from '@/features/auth/RegisterForm'

function RegisterPage() {
  return (
    <div>
      <RegisterForm />
    </div>
  )
}
```

## Authentication Store

Using **Zustand** for state management with localStorage persistence:

```tsx
import { useAuthStore } from '@/features/auth/store/authStore'

function MyComponent() {
  const { user, accessToken, isAuthenticated, logout } = useAuthStore()
  
  if (!isAuthenticated) {
    return <div>Please log in</div>
  }

  return (
    <div>
      <h1>Welcome, {user?.nombre}</h1>
      <button onClick={logout}>Log Out</button>
    </div>
  )
}
```

### API Methods

All auth API methods are in `src/shared/api/auth.ts`:

#### Register User

```tsx
import { registerUser } from '@/shared/api/auth'

const response = await registerUser({
  nombre: 'Juan',
  email: 'juan@example.com',
  password: 'SecurePass123!',
  numero_telefono: '+5491123456789'  // optional
})

// Returns:
// {
//   access_token: string
//   refresh_token: string
//   token_type: 'Bearer'
//   user: { id, nombre, email, roles, ... }
// }
```

#### Login (Coming soon - US-002)

```tsx
const response = await loginUser({
  email: 'juan@example.com',
  password: 'SecurePass123!'
})
```

#### Refresh Token (Coming soon - US-003)

```tsx
const newAccessToken = await refreshAccessToken()
```

#### Logout (Coming soon - US-004)

```tsx
await logoutUser()
```

## HTTP Client Configuration

Axios is configured with:

- **Base URL**: From `VITE_API_BASE_URL` env variable
- **Request Interceptor**: Adds `Authorization: Bearer <token>` header
- **Response Interceptor**: 
  - Handles 401 (Unauthorized) by refreshing token
  - Retries request with new token
  - Redirects to `/login` if refresh fails
  - Maps error status codes to user-friendly messages

## Testing

### Component Tests

```bash
# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

Tests are written with:
- **Vitest** - Test runner
- **React Testing Library** - Component testing
- **user-event** - User interaction simulation

### Test Example

```tsx
describe('RegisterForm', () => {
  it('should show error if email is invalid', async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)
    
    await user.type(screen.getByLabelText('Email'), 'not-an-email')
    await user.click(screen.getByRole('button', { name: /create/i }))
    
    expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
  })
})
```

## Styling

Using **Tailwind CSS** for styling with:
- Responsive design
- Dark mode support (optional)
- Built-in component classes

### Custom Styles

Add custom styles in `src/index.css` or individual component files.

## Development Guidelines

### Component Architecture

- Use **Feature-Sliced Design** (FSD):
  - `features/` - Feature-specific components
  - `pages/` - Page components
  - `shared/` - Shared utilities and components

- Use **Atomic Design** principles:
  - Small, focused, reusable components
  - Props for customization
  - No side effects in UI components

### State Management

- **Local State** (useState): Form input, UI state
- **Store (Zustand)**: Auth state, app-wide state
- **Server State (TanStack Query)**: API data (coming soon)

### API Integration

- Place API functions in `shared/api/`
- Use error boundaries for error handling
- Proper loading states for async operations
- Type-safe responses with TypeScript

## Scripts

```bash
npm run dev           # Start dev server
npm run build         # Build for production
npm run preview       # Preview production build
npm run type-check    # TypeScript type checking
npm run lint          # ESLint
npm run test          # Run tests
npm run test:watch    # Tests in watch mode
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Performance

- Code splitting by route
- Lazy loading of components
- Optimized images
- Caching with axios

## Troubleshooting

### CORS Errors

If you get CORS errors:
1. Check `VITE_API_BASE_URL` matches your backend URL
2. Ensure backend has CORS enabled for your frontend origin

### Tokens Not Persisting

- Ensure localStorage is enabled in browser
- Check that Zustand persist middleware is configured correctly

### API Requests Failing

- Verify backend is running on correct port (default 8000)
- Check network tab in DevTools for actual request/response
- Ensure `VITE_API_BASE_URL` is correct

## Production Deployment

```bash
# Build
npm run build

# Output is in `dist/` directory
# Deploy to your hosting (Vercel, Netlify, etc)
```

For Vercel deployment:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

## Contributing

1. Create feature branch: `git checkout -b feature/auth-improvements`
2. Make changes
3. Test locally
4. Commit with conventional commits: `git commit -m "feat(auth): add two-factor authentication"`
5. Push and create PR

## License

Internal use only.
