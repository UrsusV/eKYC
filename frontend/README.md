# eKYC Frontend

A modern, production-ready React frontend for the eKYC (Electronic Know Your Customer) blockchain system. Built with React 18, TypeScript, Vite, Tailwind CSS, and React Query.

## ✨ Features

- 🔐 **Secure Authentication** - JWT-based with automatic token refresh
- 👥 **Multi-Role Support** - Customer, Bank Officer, and Admin roles
- 📱 **Responsive Design** - Mobile-first, works on all devices
- 🎨 **Modern UI** - Built with Tailwind CSS and Dark Mode support
- ⚡ **Fast Performance** - Vite for lightning-fast development
- 🔷 **Type-Safe** - Full TypeScript coverage
- 📊 **Data Management** - React Query for efficient server state
- 🌐 **Full Backend Integration** - Real-time API integration
- 🔄 **Smart Error Handling** - Comprehensive error handling and validation
- 🚀 **Production-Ready** - Optimized builds with code splitting

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Backend API running on port 5001

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will open at **http://localhost:3000**

### Build for Production

```bash
# Build with production optimizations
npm run build

# Preview production build locally
npm run preview
```

## 📁 Project Structure

```
src/
├── components/         # Reusable React components
│   ├── Layout.tsx     # Main layout wrapper
│   ├── PrivateRoute.tsx  # Protected route wrapper
│   ├── LoadingSpinner.tsx
│   └── ...
├── pages/             # Page components (routes)
│   ├── HomePage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterCustomerPage.tsx
│   ├── DashboardPage.tsx
│   ├── SubmitKycPage.tsx
│   ├── KycStatusPage.tsx
│   ├── CredentialsPage.tsx
│   ├── OfficerDashboardPage.tsx
│   └── ...
├── services/          # API service layer
│   ├── apiClient.ts   # Axios instance with interceptors
│   ├── authService.ts # Authentication endpoints
│   ├── kycService.ts  # KYC endpoints
│   ├── bankService.ts # Bank officer endpoints
│   ├── consentService.ts # Consent management
│   └── index.ts
├── contexts/          # React Context providers
│   └── AuthContext.tsx  # Global auth state
├── hooks/             # Custom React hooks
├── types/             # TypeScript type definitions
│   └── index.ts       # All interfaces and types
├── utils/             # Utility functions
│   ├── index.ts       # General utilities
│   └── errorHandler.ts # Error handling utilities
├── App.tsx            # Main app component with routing
├── main.tsx           # Application entry point
└── index.css          # Global styles and Tailwind
```

## ⚙️ Environment Variables

### Development (`.env.development`)

```env
VITE_API_BASE_URL=http://localhost:5001/api/v1
VITE_APP_NAME=eKYC Blockchain System
VITE_APP_DESCRIPTION=Secure Digital Identity Verification Platform
VITE_ENVIRONMENT=development
VITE_ENABLE_DEVTOOLS=true
```

### Production (`.env.production`)

```env
VITE_API_BASE_URL=https://your-production-api.com/api/v1
VITE_APP_NAME=eKYC Blockchain System
VITE_APP_DESCRIPTION=Secure Digital Identity Verification Platform
VITE_ENVIRONMENT=production
VITE_ENABLE_DEVTOOLS=false
```

**Important:** Update `VITE_API_BASE_URL` with your actual production backend URL.

## 📜 Available Scripts

| Command                    | Description                           |
| -------------------------- | ------------------------------------- |
| `npm run dev`              | Start development server with HMR     |
| `npm run build`            | Build for production                  |
| `npm run build:production` | Build with production mode explicitly |
| `npm run preview`          | Preview production build locally      |
| `npm run lint`             | Run ESLint checks                     |
| `npm run lint:fix`         | Auto-fix linting issues               |
| `npm run type-check`       | Run TypeScript type checking          |
| `npm run docker:build`     | Build Docker image                    |
| `npm run docker:run`       | Run Docker container                  |
| `npm run docker:stop`      | Stop and remove Docker container      |

## 🛠️ Tech Stack

### Core

- **React 18.3.1** - UI library with latest features
- **TypeScript 5.6.2** - Type safety and better DX
- **Vite 5.4.20** - Next-gen build tool

### Styling

- **Tailwind CSS 3.4.13** - Utility-first CSS framework
- **PostCSS** - CSS transformations
- **Autoprefixer** - Automatic vendor prefixing

### Routing & State

- **React Router 6.30.1** - Client-side routing
- **React Query 5.90.5** - Server state management
- **React Context** - Global state management

### Data Fetching

- **Axios 1.7.7** - HTTP client with interceptors
- **Custom API Client** - Centralized API handling

### UI/UX

- **Lucide React** - Beautiful SVG icons
- **date-fns 4.1.0** - Modern date utilities
- **clsx 2.1.1** - Conditional className utility

### Development

- **ESLint** - Code linting
- **TypeScript ESLint** - TS-specific linting
- **Vite Plugin React** - Fast Refresh support

## 🎯 Features by Role

### 👤 Customer Features

- ✅ User registration and authentication
- ✅ Submit KYC requests with document uploads
- ✅ Real-time KYC status tracking
- ✅ View KYC submission history
- ✅ Manage blockchain credentials
- ✅ Grant/revoke data consents
- ✅ View and update profile
- ✅ Multi-step KYC form with validation

### 🏦 Bank Officer Features

- ✅ View pending KYC requests queue
- ✅ Review KYC applications in detail
- ✅ Approve or reject KYC requests
- ✅ Issue blockchain credentials
- ✅ View issued credentials history
- ✅ Search and filter requests
- ✅ Access customer documents

### 🔐 Security Features

- ✅ JWT authentication with auto-refresh
- ✅ Protected routes with role-based access
- ✅ Secure token storage
- ✅ Automatic session management
- ✅ HTTPS-ready configuration
- ✅ Input validation and sanitization

## 📡 API Integration

The frontend is fully integrated with the backend API:

### Authentication

- POST `/auth/register/customer` - Customer registration
- POST `/auth/register/bank-officer` - Bank officer registration
- POST `/auth/login` - User login
- POST `/auth/refresh` - Refresh access token
- GET `/auth/me` - Get current user
- POST `/auth/logout` - Logout

### KYC Operations

- POST `/kyc/submit` - Submit KYC request
- GET `/kyc/status/:requestId` - Get KYC status
- GET `/kyc/history` - Get KYC history
- GET `/kyc/credentials` - Get user credentials

### Bank Officer Operations

- GET `/bank/kyc-requests` - Get KYC requests queue
- GET `/bank/kyc-request/:id` - Get request details
- POST `/bank/verify/:requestId` - Approve/reject KYC
- POST `/bank/issue-credential` - Issue blockchain credential

### Consent Management

- GET `/consent/my-consents` - Get user consents
- GET `/consent/:consentId` - Get consent details
- POST `/consent/:consentId/grant` - Grant consent
- POST `/consent/:consentId/revoke` - Revoke consent
- POST `/consent/bulk-grant` - Grant multiple consents

## 🐳 Docker Deployment

### Build and Run

```bash
# Build Docker image
npm run docker:build

# Run container
npm run docker:run

# Access at http://localhost:3000
```

### Docker Compose

```bash
# Using docker-compose
docker-compose up -d

# Stop
docker-compose down
```

## 🚀 Deployment Guide

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions including:

- Static hosting (Netlify, Vercel, AWS S3)
- Docker deployment
- Nginx configuration
- CI/CD setup
- Environment configuration
- Performance optimization

## 🔧 Configuration

### Vite Configuration

- Path aliases configured for clean imports
- Development proxy to backend
- Production build optimizations
- Code splitting for vendors
- Terser minification with console removal
- Source maps disabled in production

### TypeScript Configuration

- Strict type checking enabled
- Path mapping for `@` imports
- React JSX support
- Modern ES features

## 📱 Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🐛 Error Handling

Comprehensive error handling includes:

- API error interceptors
- User-friendly error messages
- Validation error display
- Network error detection
- Automatic retry logic
- Authentication error handling with redirect

## 📊 Performance Optimizations

- Code splitting by route
- Lazy loading components
- Optimized bundle sizes
- Tree shaking
- Asset compression (gzip)
- Efficient re-renders with React Query
- Memoization where needed

## 🔄 State Management

- **React Query** - Server state, caching, synchronization
- **React Context** - Global auth state
- **Local State** - Component-level state with hooks
- **URL State** - Route parameters and query strings

## 🧪 Testing Recommendations

```bash
# Add testing libraries
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest

# Run tests
npm run test
```

## 📝 Contributing

1. Follow TypeScript best practices
2. Use functional components with hooks
3. Maintain consistent code style
4. Add proper error handling
5. Write meaningful commit messages
6. Keep components small and focused

## 📄 License

MIT License - See LICENSE file for details

## 🆘 Support

For issues, questions, or contributions:

- Check the [Backend API Documentation](../backend/API_DOCUMENTATION.md)
- Review [Deployment Guide](./DEPLOYMENT.md)
- Create an issue in the repository

## 🎯 Roadmap

- [ ] Add comprehensive test coverage
- [ ] Implement progressive web app (PWA) features
- [ ] Add internationalization (i18n)
- [ ] Performance monitoring integration
- [ ] Analytics integration
- [ ] Enhanced accessibility features

---

**Built with ❤️ for secure digital identity verification**
