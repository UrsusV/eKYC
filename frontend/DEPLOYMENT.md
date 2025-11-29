# Frontend Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the eKYC Frontend to production.

## Prerequisites

- Node.js 18+ and npm 9+
- Backend API deployed and accessible
- Environment variables configured

## Environment Configuration

### Development Environment

Located in `.env.development`:

```env
VITE_API_BASE_URL=http://localhost:5001/api/v1
VITE_APP_NAME=eKYC Blockchain System
VITE_APP_DESCRIPTION=Secure Digital Identity Verification Platform
VITE_ENVIRONMENT=development
VITE_ENABLE_DEVTOOLS=true
```

### Production Environment

Located in `.env.production`:

```env
VITE_API_BASE_URL=https://your-production-api.com/api/v1
VITE_APP_NAME=eKYC Blockchain System
VITE_APP_DESCRIPTION=Secure Digital Identity Verification Platform
VITE_ENVIRONMENT=production
VITE_ENABLE_DEVTOOLS=false
```

**Important:** Update `VITE_API_BASE_URL` with your actual production backend URL.

## Build Process

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist` directory with:

- Minified JavaScript and CSS
- Code splitting for better performance
- Removed console logs and debugger statements
- Optimized assets

### 3. Preview Production Build Locally

```bash
npm run preview
```

Access at `http://localhost:3000` to test the production build locally.

## Deployment Options

### Option 1: Static Hosting (Recommended)

#### Netlify

1. Connect your repository to Netlify
2. Configure build settings:
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`
   - **Environment Variables:** Add from `.env.production`
3. Deploy

#### Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the frontend directory
3. Follow prompts to configure
4. Set environment variables in Vercel dashboard

#### AWS S3 + CloudFront

1. Build the project: `npm run build`
2. Create S3 bucket
3. Enable static website hosting
4. Upload `dist` folder contents
5. Configure CloudFront distribution
6. Update DNS records

### Option 2: Docker Deployment

#### Dockerfile

Create `Dockerfile` in frontend directory:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

#### Build and Run Docker Image

```bash
# Build image
docker build -t ekyc-frontend .

# Run container
docker run -d -p 80:80 --name ekyc-frontend ekyc-frontend

# Or with docker-compose
docker-compose up -d
```

### Option 3: Nginx Server

1. Build the project
2. Copy `dist` folder to server
3. Configure nginx:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/ekyc-frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

4. Enable HTTPS with Let's Encrypt:

```bash
sudo certbot --nginx -d yourdomain.com
```

## Post-Deployment Checklist

### 1. Verify Environment Variables

- [ ] API base URL is correct
- [ ] All required environment variables are set
- [ ] Production mode is enabled

### 2. Test Core Functionality

- [ ] User registration works
- [ ] User login works
- [ ] KYC submission works
- [ ] Dashboard displays correctly
- [ ] API calls succeed
- [ ] Error handling works properly

### 3. Performance Checks

- [ ] Run Lighthouse audit (aim for 90+ score)
- [ ] Check bundle sizes
- [ ] Verify lazy loading works
- [ ] Test on slow 3G connection

### 4. Security Checks

- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] No sensitive data in client-side code
- [ ] API keys not exposed
- [ ] CORS configured correctly

### 5. Browser Compatibility

- [ ] Test on Chrome
- [ ] Test on Firefox
- [ ] Test on Safari
- [ ] Test on Edge
- [ ] Test on mobile browsers

## Monitoring and Maintenance

### Analytics

Consider integrating:

- Google Analytics
- Plausible Analytics
- Mixpanel

### Error Tracking

Recommended services:

- Sentry
- LogRocket
- Bugsnag

### Performance Monitoring

- New Relic
- Datadog
- Google PageSpeed Insights

## Troubleshooting

### Build Fails

1. Clear node_modules: `rm -rf node_modules package-lock.json`
2. Reinstall: `npm install`
3. Try again: `npm run build`

### API Connection Issues

1. Verify `VITE_API_BASE_URL` is correct
2. Check CORS configuration on backend
3. Ensure backend is accessible from frontend domain
4. Check browser console for errors

### Routing Issues (404 on Refresh)

1. Ensure server is configured for SPA routing
2. Check nginx/server configuration
3. Verify index.html fallback is working

### White Screen on Load

1. Check browser console for errors
2. Verify all assets loaded correctly
3. Check for JavaScript errors
4. Ensure API is accessible

## Rollback Procedure

### Netlify/Vercel

- Use platform's built-in rollback feature
- Redeploy previous version from dashboard

### Docker

```bash
# Stop current container
docker stop ekyc-frontend

# Run previous version
docker run -d -p 80:80 --name ekyc-frontend ekyc-frontend:previous-tag
```

### Manual

1. Backup current deployment
2. Replace with previous `dist` folder
3. Restart web server

## Continuous Deployment

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Build
        working-directory: ./frontend
        env:
          VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}
        run: npm run build

      - name: Deploy to Netlify
        uses: netlify/actions/cli@master
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
        with:
          args: deploy --prod --dir=frontend/dist
```

## Support and Resources

- Documentation: `/docs`
- Issues: GitHub Issues
- Backend API Documentation: `/backend/API_DOCUMENTATION.md`

## Version History

- **v1.0.0** - Initial production release
- Production-ready with full backend integration
- Optimized build configuration
- Comprehensive error handling
