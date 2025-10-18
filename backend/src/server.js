require('dotenv').config();
const mongoose = require('mongoose');
const Redis = require('ioredis');
const app = require('./app');
// const logger = require('./utils/logger');

// Simple console logger until winston is configured
const logger = {
    info: console.log,
    error: console.error,
    warn: console.warn
};

// Database connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        logger.info('MongoDB connected successfully');
    } catch (error) {
        logger.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Redis connection
const redis = new Redis(process.env.REDIS_URL);

redis.on('connect', () => {
    logger.info('Redis connected successfully');
});

redis.on('error', (error) => {
    logger.error('Redis connection error:', error);
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        const server = app.listen(PORT, () => {
            logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
            logger.info(`API Version: ${process.env.API_VERSION || 'v1'}`);

            if (process.env.NODE_ENV === 'development') {
                logger.info(`Health Check: http://localhost:${PORT}/health`);
            }
        });

        // Set keepAliveTimeout
        server.keepAliveTimeout = 65000;
        server.headersTimeout = 66000;

    } catch (error) {
        logger.error('Server startup error:', error);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Promise Rejection:', err);
    mongoose.disconnect();
    redis.disconnect();
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    mongoose.disconnect();
    redis.disconnect();
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    await mongoose.disconnect();
    await redis.disconnect();
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('SIGINT received. Shutting down gracefully...');
    await mongoose.disconnect();
    await redis.disconnect();
    process.exit(0);
});

// Start the server
startServer();

module.exports = { app, redis };
