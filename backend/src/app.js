const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');

// Import custom middleware (will be created later)
// const errorHandler = require('./middleware/errorHandler');
// const notFound = require('./middleware/notFound');

// Import routes (will be created later)
// const authRoutes = require('./routes/auth.routes');
// const kycRoutes = require('./routes/kyc.routes');
// const credentialRoutes = require('./routes/credential.routes');
// const consentRoutes = require('./routes/consent.routes');
// const adminRoutes = require('./routes/admin.routes');

// Initialize express app
const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS - Updated approach
app.use((req, res, next) => {
    // Only sanitize string values
    const sanitizeObject = (obj) => {
        if (!obj) return obj;
        if (typeof obj === 'string') return xss(obj);
        if (Array.isArray(obj)) return obj.map(sanitizeObject);
        if (typeof obj === 'object') {
            const sanitized = {};
            for (const key in obj) {
                sanitized[key] = sanitizeObject(obj[key]);
            }
            return sanitized;
        }
        return obj;
    };

    req.body = sanitizeObject(req.body);
    req.query = sanitizeObject(req.query);
    req.params = sanitizeObject(req.params);
    next();
});

// Prevent HTTP Parameter Pollution
app.use(hpp());

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes (uncomment when routes are created)
const apiVersion = process.env.API_VERSION || 'v1';
// app.use(`/api/${apiVersion}/auth`, authRoutes);
// app.use(`/api/${apiVersion}/kyc`, kycRoutes);
// app.use(`/api/${apiVersion}/credentials`, credentialRoutes);
// app.use(`/api/${apiVersion}/consent`, consentRoutes);
// app.use(`/api/${apiVersion}/admin`, adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API documentation
if (process.env.NODE_ENV === 'development') {
    const swaggerUi = require('swagger-ui-express');
    // const swaggerSpec = require('./config/swagger');
    // app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// Temporary root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'eKYC Blockchain API',
        version: process.env.API_VERSION || 'v1',
        status: 'running'
    });
});

// Error handling (uncomment when middleware is created)
// app.use(notFound);
// app.use(errorHandler);

module.exports = app;
