// oop/src/services/UserService.js
const generateUUID = require('uuid').v4;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authenticate = require('ldap-authentication');
const CoreService = require('./CoreService');


/**
 * Service Class for User Management.
 */
class UserService extends CoreService {

    constructor(config) {
        super(config);
        this.tableName = 'Users';
        this.JWT_SECRET = config.JWT_SECRET || 'default-secret';
    }

    /**
     * Register a new user.
     */
    async register(data) {
        try {
            const ID = generateUUID();
            const normalizedUsername = data.Username.toLowerCase();
            
            // Check if user already exists
            const checkResult = await this.read({ Username: normalizedUsername });
            if (checkResult && checkResult.length > 0) {
                console.log('UserService: User already exists:', normalizedUsername);
                throw new Error('User already exists');
            }

            // Hash password
            const saltRounds = 10;
            const PasswordHash = await bcrypt.hash(data.Password, saltRounds);

            const userData = {
                ID: ID,
                Username: normalizedUsername,
                PasswordHash: PasswordHash,
                Role: data.Role || 'User',
                Email: data.Email || '',
                DisplayName: data.DisplayName || '',
                AvatarURL: data.AvatarURL || '',
                UITheme: data.UITheme || '',
                Team: data.Team || '',
                Bio: data.Bio || '',
                SQL_USER: data.SQL_USER || false
            };

            const result = await this.create(userData); // This calls CoreService's create() via super
            return { success: true, ID: result.ID };
        } catch (err) {
            console.error('UserService: Registration failed:', err.message);
            throw err;
        }
    }

    /**
     * Login user and generate JWT token.
     */
    async login(username, password) {
        try {
            const normalizedUsername = username.toLowerCase();
            
            // Environment check for testing
            if (this.config && 
                this.config.ENVIRONMENT && 
                ['TESTING', 'DEVELOPMENT'].includes(this.config.ENVIRONMENT)) {
                console.log('Environment: Test/Dev. Bypassing authentication.');
                
                const payload = { Username: normalizedUsername, role: 'User' };
                const token = jwt.sign(payload, this.JWT_SECRET, { expiresIn: '1h' });
                
                return { 
                    success: true, 
                    token: token,
                    user: { Username: normalizedUsername, role: 'User' }
                };
            }

            // Fetch user from database
            const result = await this.read({ Username: normalizedUsername });
            
            if (!result || result.length === 0) {
                console.error('UserService: User not found for username:', normalizedUsername);
                throw new Error('Invalid credentials');
            }
            
            const user = result[0];

            // Check if SQL_USER bypass enabled
            if (user.SQL_USER === true) {
                const passwordMatch = await bcrypt.compare(password, user.PasswordHash);
                
                if (!passwordMatch) {
                    console.error('UserService: Password mismatch for username:', normalizedUsername);
                    throw new Error('Invalid credentials');
                }

                // Generate JWT token
                const payload = { 
                    Username: user.Username, 
                    role: user.Role || 'User' 
                };
                const token = jwt.sign(payload, this.JWT_SECRET, { 
                    expiresIn: this.config.TOKEN_EXPIRY || '1h' 
                });
                
                console.log('UserService: Login successful for username:', normalizedUsername);
                return { 
                    success: true, 
                    token: token,
                    user: { Username: user.Username, role: user.Role }
                };

            } else {
                // LDAP authentication
                try {
                    const ldapAuthOptions = {
                        ldapOpts: { 
                            url: this.config.LDAP_URL,
                            rejectUnauthorized: false, 
                        },
                        userDn: `${this.config.LDAP_USER_ATTRIBUTE}=${normalizedUsername},${this.config.LDAP_DOMAIN_COMPONENTS}` || '',
                        userPassword: password,
                        starttls: true
                    };

                    const isLdapAuthenticated = await authenticate(ldapAuthOptions);
                    
                    if (!isLdapAuthenticated) {
                        throw new Error('LDAP authentication failed');
                    }

                    // Generate JWT token after successful LDAP auth
                    const payload = { 
                        Username: user.Username, 
                        role: user.Role || 'User' 
                    };
                    const token = jwt.sign(payload, this.JWT_SECRET, { 
                        expiresIn: this.config.TOKEN_EXPIRY || '1h' 
                    });
                    
                    console.log('UserService: LDAP login successful for username:', normalizedUsername);
                    return { 
                        success: true, 
                        token: token,
                        user: { Username: user.Username, role: user.Role }
                    };

                } catch (ldapError) {
                    console.error('UserService: LDAP authentication error:', ldapError.message);
                    throw new Error('Invalid credentials');
                }
            }

        } catch (err) {
            console.error('UserService: Login failed:', err.message);
            throw err;
        }
    }

    /**
     * Read users list.
     */
    async read(params = {}) {
        try {
            console.log('UserService: Fetching users list...');
            
            const result = await this.find(params); // Use parent class method
            console.log(`UserService: Found ${result.length} users`);
            return result;
        } catch (err) {
            console.error('UserService: Read failed:', err.message);
            throw err;
        }
    }

    /**
     * Read user by username.
     */
    async readByUsername(username) {
        try {
            const normalizedUsername = username.toLowerCase();
            
            // Environment check for testing
            if (this.config && 
                this.config.ENVIRONMENT && 
                ['TESTING', 'DEVELOPMENT'].includes(this.config.ENVIRONMENT)) {
                console.log('Environment: Test/Dev. Returning dummy user.');
                return [{ Username: normalizedUsername, Role: 'User' }];
            }

            const result = await this.read({ Username: normalizedUsername });
            if (result.length === 0) {
                throw new Error('User not found');
            }
            
            console.log('UserService: User details retrieved:', result[0].Username);
            return result;
        } catch (err) {
            console.error('UserService: Read by username failed:', err.message);
            throw err;
        }
    }

    /**
     * Update user by ID.
     */
    async update(id, updates) {
        try {
            // Environment check for testing
            if (this.config && 
                this.config.ENVIRONMENT && 
                ['TESTING', 'DEVELOPMENT'].includes(this.config.ENVIRONMENT)) {
                console.log('Environment: Test/Dev. Mocking user update.');
                return { success: true };
            }

            const result = await super.update(id, updates); // Call parent's update directly!
            console.log('UserService: User updated successfully:', id);
            return { success: true };

        } catch (err) {
            console.error('UserService: Update failed:', err.message);
            throw err;
        }
    }

    /**
     * Delete user by ID.
     */
    async remove(id) {
        try {
            // Environment check for testing
            if (this.config && 
                this.config.ENVIRONMENT && 
                ['TESTING', 'DEVELOPMENT'].includes(this.config.ENVIRONMENT)) {
                console.log('Environment: Test/Dev. Mocking user deletion.');
                return { success: true };
            }

            const result = await super.remove(id); // Call parent's remove directly!
            console.log('UserService: User deleted successfully:', id);
            return { success: true };

        } catch (err) {
            console.error('UserService: Delete failed:', err.message);
            throw err;
        }
    }

    /**
     * Create user.
     */
    async create(data) {
        try {
            const result = await super.create(data); // Call parent's create directly!
            return result;
        } catch (err) {
            console.error('UserService: Create failed:', err.message);
            throw err;
        }
    }

    /**
     * Find filtered users.
     */
    async findFiltered(filters = {}) {
        try {
            const result = await this.find(filters);
            return result;
        } catch (err) {
            console.error('UserService: Find filtered failed:', err.message);
            throw err;
        }
    }
}

module.exports = UserService;
