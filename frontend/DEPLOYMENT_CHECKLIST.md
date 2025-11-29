# Production Deployment Checklist

## Pre-Deployment

### Environment Configuration

- [ ] Update `.env.production` with production API URL
- [ ] Verify all environment variables are set correctly
- [ ] Remove any development-only configurations
- [ ] Confirm `VITE_ENABLE_DEVTOOLS=false` in production

### Code Quality

- [ ] Run `npm run lint` - No linting errors
- [ ] Run `npm run type-check` - No TypeScript errors
- [ ] Review all console.log statements (should be removed in production)
- [ ] Check for any TODO or FIXME comments

### Security

- [ ] Ensure no API keys or secrets in frontend code
- [ ] Verify HTTPS is enforced
- [ ] Check CORS configuration matches frontend domain
- [ ] Review authentication flow
- [ ] Confirm JWT token handling is secure

### Build

- [ ] Run `npm run build` successfully
- [ ] Test production build locally with `npm run preview`
- [ ] Verify bundle sizes are reasonable (<500KB initial JS)
- [ ] Check for any build warnings

### Testing

- [ ] Test all user flows manually
- [ ] Test on different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile devices
- [ ] Test with slow 3G throttling
- [ ] Verify error handling works correctly

## Backend Integration

- [ ] Backend API is deployed and accessible
- [ ] API URL in `.env.production` matches deployed backend
- [ ] Test API calls from production build
- [ ] Verify authentication works
- [ ] Test file uploads work correctly
- [ ] Confirm WebSocket connections (if any) work

## Deployment Steps

### 1. Build Application

```bash
npm run build:production
```

### 2. Verify Build Output

- [ ] Check `dist` directory contents
- [ ] Verify `index.html` loads all assets
- [ ] Check asset filenames include hashes
- [ ] Verify source maps are not included (or are external)

### 3. Deploy to Hosting Platform

Choose your deployment method:

#### Option A: Netlify

- [ ] Connect GitHub repository
- [ ] Set build command: `npm run build`
- [ ] Set publish directory: `dist`
- [ ] Add environment variables
- [ ] Deploy

#### Option B: Vercel

- [ ] Import project
- [ ] Configure build settings
- [ ] Add environment variables
- [ ] Deploy

#### Option C: Docker

```bash
# Build image with production env
docker build \
  --build-arg VITE_API_BASE_URL=https://your-api.com/api/v1 \
  --build-arg VITE_ENVIRONMENT=production \
  -t ekyc-frontend:latest .

# Run container
docker run -d -p 80:80 ekyc-frontend:latest
```

#### Option D: Static Host (S3, etc.)

- [ ] Upload `dist` contents to hosting
- [ ] Configure for SPA (all routes → index.html)
- [ ] Set proper cache headers
- [ ] Enable HTTPS

## Post-Deployment

### Immediate Verification

- [ ] Visit production URL
- [ ] Test user registration
- [ ] Test user login
- [ ] Test KYC submission
- [ ] Test file uploads
- [ ] Verify dashboard loads
- [ ] Check browser console for errors
- [ ] Test logout

### Performance

- [ ] Run Lighthouse audit (target: 90+ score)
- [ ] Check First Contentful Paint (<1.8s)
- [ ] Check Time to Interactive (<3.8s)
- [ ] Verify images are optimized
- [ ] Check bundle sizes in Network tab

### SEO & Metadata

- [ ] Verify page title
- [ ] Check meta descriptions
- [ ] Test Open Graph tags
- [ ] Verify favicon loads

### Monitoring Setup

- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Configure analytics (Google Analytics, Plausible)
- [ ] Set up uptime monitoring
- [ ] Configure alerts for errors

### Documentation

- [ ] Update README with production URL
- [ ] Document any deployment-specific steps
- [ ] Update API documentation references
- [ ] Create runbook for common issues

## SSL/HTTPS

- [ ] HTTPS is enabled
- [ ] SSL certificate is valid
- [ ] HTTP redirects to HTTPS
- [ ] Mixed content warnings resolved
- [ ] Secure cookies configured

## Domain & DNS

- [ ] Domain configured correctly
- [ ] DNS records propagated
- [ ] www and non-www both work
- [ ] SSL certificate covers all domains

## CDN & Caching

- [ ] Static assets served from CDN (if applicable)
- [ ] Cache headers set correctly
  - HTML: no-cache
  - JS/CSS: immutable, 1 year
  - Images: 1 year
- [ ] Gzip/Brotli compression enabled

## Rollback Plan

- [ ] Previous version tagged in Git
- [ ] Rollback procedure documented
- [ ] Database migration rollback plan (if applicable)
- [ ] DNS rollback plan if needed

## Communication

- [ ] Notify team of deployment
- [ ] Update status page
- [ ] Prepare announcement if needed
- [ ] Document deployment date/time

## Post-Launch Monitoring (First 24 Hours)

- [ ] Monitor error rates
- [ ] Watch performance metrics
- [ ] Review user feedback
- [ ] Check server logs
- [ ] Monitor API usage
- [ ] Track conversion funnel

## Week 1 Follow-up

- [ ] Review analytics data
- [ ] Check for new bugs
- [ ] Analyze performance metrics
- [ ] Gather user feedback
- [ ] Plan optimizations if needed

## Common Issues & Solutions

### Issue: White screen on load

**Solution:**

- Check browser console for errors
- Verify API URL is correct
- Check network requests

### Issue: API calls failing

**Solution:**

- Verify backend is running
- Check CORS configuration
- Verify API URL in environment

### Issue: 404 on page refresh

**Solution:**

- Configure server for SPA routing
- Ensure all routes fallback to index.html

### Issue: Slow performance

**Solution:**

- Check bundle sizes
- Enable compression
- Optimize images
- Use CDN

## Emergency Contacts

- DevOps Team: [contact info]
- Backend Team: [contact info]
- On-call Engineer: [contact info]

## Deployment Sign-off

Deployed by: ******\_\_\_******
Date: ******\_\_\_******
Time: ******\_\_\_******
Version: ******\_\_\_******

Approved by: ******\_\_\_******
Date: ******\_\_\_******

---

**Remember:** Always test in staging before deploying to production!
