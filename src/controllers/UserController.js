// oop/src/controllers/UserController.js
const CoreController = require('./CoreController.js');
const UserService = require('../services/UserService.js');


/**
 * Controller Class for User Management.
 */
class UserController extends CoreController {
    constructor(config, req = null, res = null) {
        super(null, null, null); 
        this.service = new UserService(config);
        
        if (req) {
            this.req = req;
        }
        
        if (res) {
            this.res = res;
        } else {
            console.warn('UserController: No response object provided. Using mock response.');
            this.res = {
                status: function(code) {
                    this.statusCode = code;
                    return this;
                },
                json: function(data) {
                    console.log(`[Mock Response] Sending JSON with status ${this.statusCode || 200}:`, data);
                    return data;
                }
            };
        }
    }

    async handleRegister() {
        try {
            console.log('UserController: Processing user registration...');
            
            const data = this.req.body; 
            
            if (!data.Username || !data.Password || !data.Role) {
                throw new Error('Username, password, and role are required');
            }

            const result = await this.service.register(data);
            
            if (result.success) {
                return this.res.status(201).json({ 
                    message: 'User registered successfully',
                    id: result.ID 
                });
            } else {
                 throw new Error('Registration failed');
            }

        } catch (err) {
             console.error('UserController: Register error:', err.message);
             
             if (!this.res) {
                throw err; 
             } else {
                this.res.status(500).json({ error: 'Database insertion failed' });
             }
        }
    }


    async handleLogin() {
        try {
            console.log('UserController: Processing login request...');
            
            const { Username, password } = this.req.body;

            if (!Username || !password) {
                throw new Error('Username and password are required');
            }

            const result = await this.service.login(Username, password);
            
            if (result.success) {
                console.log('UserController: Login successful. Returning token...');
                return this.res.json(result);
            } else {
                 throw new Error('Login failed');
            }

        } catch (err) {
             console.error('UserController: Login error:', err.message);
             
             if (!this.res) {
                throw err; 
             } else {
                this.res.status(401).json({ error: 'Invalid credentials' });
             }
        }
    }

    async handleRead() {
        try {
            console.log('UserController: Fetching users list...');
            
            const result = await this.service.find(this.req.query || {});
            return this.res.json(result);

        } catch (err) {
             console.error('UserController: Read error:', err.message);
             
             if (!this.res) {
                throw err; 
             } else {
                this.res.status(500).json({ error: 'Database query failed' });
             }
        }
    }

    async handleReadByUsername() {
        try {
            console.log('UserController: Fetching user details...');
            
            const result = await this.service.readByUsername(this.req.params.username);
            
            if (result.length === 0) {
                throw new Error('User not found');
            }
            
            return this.res.json(result[0]);

        } catch (err) {
             console.error('UserController: Read by username error:', err.message);
             
             if (!this.res) {
                throw err; 
             } else {
                this.res.status(500).json({ error: 'Failed to fetch user details' });
             }
        }
    }

    async handleUpdate() {
        try {
            console.log('UserController: Updating user...');
            
            const id = this.req.params.ID;
            const updates = this.req.body; 
            
            if (!id || Object.keys(updates).length === 0) {
                throw new Error('Invalid update request');
            }

            const result = await this.service.update(id, updates);
            
            if (result.success) {
                console.log('UserController: User updated successfully:', id);
                return this.res.json({ message: 'User updated successfully' });
            } else {
                 throw new Error('Update failed');
            }

        } catch (err) {
             console.error('UserController: Update error:', err.message);
             
             if (!this.res) {
                throw err; 
             } else {
                this.res.status(500).json({ error: 'Failed to update user details' });
             }
        }
    }

    async handleDelete() {
        try {
            console.log('UserController: Deleting user...');
            
            const id = this.req.params.ID; 
            
            if (!id) {
                throw new Error('User ID is required for deletion');
            }

            const result = await this.service.remove(id);
            
            if (result.success) {
                console.log('UserController: User deleted successfully:', id);
                return this.res.json({ message: 'User deleted successfully' });
            } else {
                 throw new Error('Delete failed');
            }

        } catch (err) {
             console.error('UserController: Delete error:', err.message);
             
             if (!this.res) {
                throw err; 
             } else {
                this.res.status(500).json({ error: 'Failed to delete user' });
             }
        }
    }
}

module.exports = UserController;
