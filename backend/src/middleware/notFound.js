/**
 * 404 Not Found Handler Middleware
 * Handles requests to undefined routes
 */

const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};

module.exports = notFound;
