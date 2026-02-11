// authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Secret key for JWT verification.
 * @type {string}
 */
const secretKey = process.env.JWT_SECRET;

/**
 * Middleware to authenticate a user using JWT token.
 *
 * @function authenticateToken
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Next middleware function.
 */
function authenticateToken(req, res, next) {
    /**
     * Extracts the token from the Authorization header.
     * @type {string|null}
     */
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) return res.sendStatus(401);

    jwt.verify(token, secretKey, (err, user) => {
        if (err) return res.sendStatus(403);
        /**
         * Attaches the decoded user to the request object.
         * @type {Object}
         */
        req.user = user;
        next();
    });
}

/**
 * Middleware to authorize a user based on their role.
 *
 * @function authorizeRole
 * @param {string} requiredRole - The required role for access.
 * @returns {Function} - The middleware function that checks the role.
 */
function authorizeRole(requiredRole) {
    /**
     * Inner function to check the user's role.
     *
     * @inner
     * @function
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     * @param {Function} next - Next middleware function.
     */
    return function (req, res, next) {
        if (!req.user || req.user.role !== requiredRole) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    };
}

module.exports = { authenticateToken, authorizeRole };
