// userRoutes.js

require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { authenticate } = require('ldap-authentication');
const generateUUID = require('uuid').v4;
const { authenticateToken } = require('./services/authMiddleware');
const { createRateLimiter } = require('./services/rateLimiter');
const { logTransaction } = require('./services/logger');
const queryExecutor = require('./services/dbconnector/queryExecutor');
const loginRateLimiter = createRateLimiter();

// This is the worst version of LDAP authentication, do better
/**
 * Authenticates a user using LDAP.
 *
 * @param {string} username - The username to authenticate.
 * @param {string} password - The password for the user.
 * @returns {Promise<boolean>} - Returns true if authentication succeeds, otherwise false.
 */
async function authenticateLDAP(username, password) {
    const userDnConstructed = `${process.env.LDAP_USER_ATTRIBUTE}=${username},${process.env.LDAP_DOMAIN_COMPONENTS}`;
    console.log('Constructed User DN:', userDnConstructed);
    const options = {
        ldapOpts: { 
            url: process.env.LDAP_URL,
            rejectUnauthorized: false, 
        },
        userDn: userDnConstructed,
        userPassword: password,
        starttls: true
    };

    try {
        const user = await authenticate(options);
        return true;
    } catch (error) {
        console.error('LDAP authentication error:', error);
        return false;
    }
}

/**
 * Sets up authentication routes for app.
 *
 * @param {import('express').Application} app - The Express application object.
 * @param {object} config - Configuration settings defined in server.js.
 */
function setupUserRoutes(app, config) {
    /**
     * Route to register a new user.
     *
     * @route POST /api/auth/register
     * @param {string} req.body.Username - The username of the new user.
     * @param {string} req.body.Password - The password for the new user.
     * @param {string} req.body.Role - The role of the new user.
     */
    app.post('/api/auth/register', authenticateToken, async (req, res) => {
        try {
            const ID = generateUUID();
            const { Username, Password, Role, Email, DisplayName, AvatarURL, UITheme, Team, Bio, SQL_USER } = req.body;
            console.log('Registration request received:', { Username, Password, Role, Email, DisplayName, AvatarURL, UITheme, Team, Bio, SQL_USER });
            
            if (!Username || !Password || !Role) {
                return res.status(400).json({ error: 'Username, password, and role are required' });
            }

            // Normalize username to lowercase
            const normalizedUsername = Username.toLowerCase();

            console.log('Normalized username:', normalizedUsername);

            // Check if the user already exists
            let params = { ID }
            const table = 'Users'
            let operation = 'READ'

            const resultCheck = await queryExecutor.executeQuery(table, operation, params);
            console.log('User check result:', resultCheck.length);
            logTransaction(req.route.path, req.query, req.user ? req.user.Username : null);            
            if (resultCheck.length > 0) {
                return res.status(409).json({ error: 'User already exists' });
            }

            // Hash the password
            const saltRounds = 10;
            const PasswordHash = await bcrypt.hash(Password, saltRounds);
            console.log('Hashed password:', PasswordHash);
            params = { ID, Username, PasswordHash, Role, Email, DisplayName, AvatarURL, UITheme, Team, Bio, SQL_USER }
            operation = 'CREATE'
            await queryExecutor.executeQuery(table, operation, params);
            logTransaction(req.route.path, req.query, req.user ? req.user.Username : null);
            console.log('User registered successfully:', { Username });
            res.status(201).json({ message: 'User registered successfully' });
        } catch (err) {
            if (err.code === 'EREQUEST') {
                console.error('Database query failed:', err.originalError.info.message);
                return res.status(500).json({ error: 'Database query failed' });
            }
            console.error('Registration error:', err);
            res.status(500).json({ error: 'Registration failed' });
        }
    });

    /**
     * Route to authenticate a user and generate a JWT token.
     *
     * @route POST /api/auth/login
     * @param {string} req.body.Username - The username of the user.
     * @param {string} req.body.password - The password for the user.
     */
    app.post('/api/auth/login', loginRateLimiter, async (req, res) => {
        const { Username, password } = req.body;

        if (!Username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Normalize username to lowercase
        const normalizedUsername = Username.toLowerCase();

        console.log('Login request received:', { Username });

        try {
            // Fetch user details from SQL Server
            let params = {
                'Username': Username
            }
            const table = 'Users'
            const operation = 'READ'
            const result = await queryExecutor.executeQuery(table, operation, params);
            if (result.length === 0) {
                console.error('User not found for username:', normalizedUsername);
                return res.status(401).json({ error: 'Invalid credentials' });
            };
            const user = result[0];
            console.log('User retrieved from database:', user);

            // Check if SQL_USER is set to 1 to bypass LDAP authentication
            if (user.SQL_USER === true) {
                const passwordMatch = await bcrypt.compare(password, user.PasswordHash);

                if (!passwordMatch) {
                    console.error('Password mismatch for username:', normalizedUsername);
                    return res.status(401).json({ error: 'Invalid credentials' });
                }

                // If password matches and SQL_USER is 1, generate JWT token
                const payload = {
                    Username: user.Username,
                    role: user.Role
                };

                // Specify token expiry duration in TOKEN_EXPIRY variable
                const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.TOKEN_EXPIRY || '1h' });
                console.log('Login successful for username:', normalizedUsername);
                return res.json({ token });
            }

            // If SQL_USER is not 1, authenticate with LDAP
            try {
                const isAuthenticatedLDAP = await authenticateLDAP(normalizedUsername, password);

                if (!isAuthenticatedLDAP) {
                    return res.status(401).json({ message: 'Invalid credentials' });
                };
                console.log('The current user is: ' + user.Username );
                // If authenticated, generate a JWT token or set session
                const payload = {
                    Username: user.Username,
                    role: user.Role
                };
                const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
                console.log('Login successful for username:', normalizedUsername);
                res.json({ token });

            } catch (ldapError) {
                console.error('LDAP authentication error:', ldapError);
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            logTransaction(req.route.path, req.query, req.user ? req.user.Username : null);            
        } catch (err) {
            if (err.code === 'EREQUEST') {
                console.error('Database query failed:', err.originalError.info.message);
                return res.status(500).json({ error: 'Database query failed' });
            }
            console.error('Login error:', err);
            res.status(500).json({ error: 'Authentication failed' });
        }
    });

    /**
     * Route to fetch a list of all users.
     *
     * @route GET /api/users
     */
    app.get('/api/users', authenticateToken, async (req, res) => {
        try {
            let params = req.body;
            const table = 'Users';
            const operation = 'READ';
            const result = await queryExecutor.executeQuery(table, operation, params);
            res.json(result);
            if (process.env.LOGGING === 'high') {
                logTransaction(req.route.path, req.query, req.user ? req.user.Username : null);            }
            console.log(result);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Database query failed' });
        }
    });

    /**
     * Route to fetch user details by username.
     *
     * @route GET /api/users/:username
     */
    app.get('/api/users/:username', authenticateToken, async (req, res) => {
        try {           
            let params = {
                'Username': req.params.username
            }
            const table = 'Users'
            const operation = 'READ'
            const result = await queryExecutor.executeQuery(table, operation, params);
            if (typeof result !== 'object') {
                return res.status(404).json({ error: 'User not found' });
            }

            const user = result[0];
            console.log('User details retrieved:', user);
            res.json(user);
            logTransaction(req.route.path, req.query, req.user ? req.user.Username : null);
        } catch (err) {
            if (err.code === 'EREQUEST') {
                console.error('Database query failed:', err.originalError.info.message);
                return res.status(500).json({ error: 'Database query failed' });
            }
            console.error('Fetch user details error:', err);
            res.status(500).json({ error: 'Failed to fetch user details' });
        }
    });

    /**
     * Route to update user details by ID.
     *
     * @route PUT /api/users/:ID
     */
    app.put('/api/users/:ID', authenticateToken, async (req, res) => {
        const { ID } = req.params;
        const { Username, Email, DisplayName, AvatarURL, UITheme, Team, Bio, SQL_USER } = req.body;
        let params = { ID, Username, Email, DisplayName, AvatarURL, UITheme, Team, Bio, SQL_USER }
        const table = 'Users'
        const operation = 'Update'
        try {
            if (!ID) {
                return res.status(400).json({ error: 'User ID is required'});
            }
            await queryExecutor.executeQuery(table, operation, params)
            logTransaction(req.route.path, req.query, req.user ? req.user.Username : null);
            console.log('User updated successfully:', { ID });
            res.json({ message: 'User updated successfully' });

        } catch (err) {
            if (err.code === 'EREQUEST') {
                console.error('Database query failed:', err.originalError.info.message);
                return res.status(500).json({ error: 'Database query failed' });
            }
            console.error('Update user details error:', err);
            res.status(500).json({ error: 'Failed to update user details' });
        }
    });

    /**
     * Route to delete a user by ID.
     *
     * @route DELETE /api/users/:id
     */
    app.delete('/api/users/:ID', authenticateToken, async (req, res) => {
        try {
            const { ID } = req.params;
            let params = { ID };
            const table = 'Users';
            const operation = 'DELETE';
            await queryExecutor.executeQuery(table, operation, params);
            logTransaction(req.route.path, req.query, req.user ? req.user.Username : null);
            console.log('User deleted successfully:', { id });
            res.json({ message: 'User deleted successfully' });

        } catch (err) {
            if (err.code === 'EREQUEST') {
                console.error('Database query failed:', err.originalError.info.message);
                return res.status(500).json({ error: 'Database query failed' });
            }
            console.error('Delete user error:', err);
            res.status(500).json({ error: 'Failed to delete user' });
        }
    });
};

module.exports = setupUserRoutes;
