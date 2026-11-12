/**
 * Skips middleware in test environment (e.g. rate limiting).
 */
const conditionalMiddleware = (middleware) => {
    return process.env.NODE_ENV === 'test'
        ? (req, res, next) => next()
        : middleware;
};

module.exports = conditionalMiddleware;
