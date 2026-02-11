// rateLimitMiddleware.js
/**
 *
 * Middleware module to limit the number of requests from a single IP.
 */
const rateLimit = require('express-rate-limit');

/**
 * Creates and returns a rate limiter middleware.
 *
 * @returns {function} The rate limiter middleware function.
 */
function createRateLimiter() {
    /**
     * Rate limiting options.
     * @type {Object}
     */
    const rateLimiterOptions = {
        windowMs: 60 * 1000, // 1 minute
        max: 10, // Limit each IP to 10 requests per `window` (here, per 1 minute)
        message: {
            message: 'You\'re doing this too much, please try again after a few minutes',
            statusCode: 429,
        },
        handler: (req, res, /*next*/) => {
            res.status(429).json({
                success: false,
                message: "Too many requests. Try again later."
            });
        }
    };

    /**
     * Returns the rate limiter middleware.
     * @type {function}
     */
    return rateLimit(rateLimiterOptions);
}

module.exports = { createRateLimiter };

