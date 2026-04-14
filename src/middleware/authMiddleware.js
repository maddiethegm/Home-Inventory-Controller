// oop/src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate a user using JWT token.
 * 
 * In TESTING mode, this middleware will bypass strict verification 
 * and allow requests through (simulating a logged-in state).
 *
 * @param {Object} config - Configuration object containing ENVIRONMENT flag.
 * @function authenticateToken
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Next middleware function.
 */
function authenticateToken(config) {
    return (req, res, next) => {
        // === TEST MODE OVERRIDE ===
        if (config && config.ENVIRONMENT && ['TESTING', 'DEVELOPMENT'].includes(config.ENVIRONMENT)) {
            console.log(`Auth Bypass: Environment is ${config.ENVIRONMENT}. Skipping token verification.`);
            return next(); // Allow request through immediately
        }

        /**
         * Extracts the token from the Authorization header.
         */
        const token = req.headers['authorization']?.split(' ')[1];
        
        if (!token) return res.sendStatus(401);

        // Use config.JWT_SECRET instead of process.env.JWT_SECRET
        const secretKey = config.JWT_SECRET; 

        jwt.verify(token, secretKey, (err, user) => {
            if (err) return res.sendStatus(403);
            
            /**
             * Attaches the decoded user to the request object.
             */
            req.user = user;
            next();
        });
    };
}

/**
 * Middleware to authorize a user based on their role.
 * 
 * @param {Object} config - Configuration object (optional, mainly for logging).
 * @param {string} requiredRole - The required role for access.
 */
function authorizeRole(config, requiredRole) {
    return function (req, res, next) {
        // In test mode, we can also bypass role checks if desired, 
        // but for now let's stick to the strict check unless explicitly told otherwise.
        
        if (!req.user || req.user.role !== requiredRole) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    };
}

module.exports = { authenticateToken, authorizeRole };
