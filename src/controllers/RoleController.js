// oop/src/controllers/RoleController.js
const CoreController = require('./CoreController');
const RoleService = require('../services/RoleService');


/**
 * Controller Class for Role Management with recursive hierarchy support.
 */
class RoleController extends CoreController {
    constructor(config, req = null, res = null) {
        super(null, null, null); 
        this.service = new RoleService(config);
        
        if (req) {
            this.req = req;
        }
        
        if (res) {
            this.res = res;
        } else {
            console.warn('RoleController: No response object provided. Using mock response.');
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

    async handleGet() {
        try {
            console.log('RoleController: Fetching roles list...');
            
            const path = this.req.route.path || '';
            let filterValue = null;
            
            // Check for hierarchical request
            if (path.includes('/children')) {
                // Extract parent role ID from the route pattern
                // /api/roles/:ID/children -> extract :ID as parentRole
                const segments = path.split('/').filter(s => s);
                const lastSegment = segments[segments.length - 2]; // Skip '/children'
                
                if (lastSegment) {
                    filterValue = lastSegment;
                    console.log('RoleController: Fetching child roles for parent:', filterValue);
                    
                    const result = await this.service.findChildren(filterValue);
                    return this.res.json(result || []);
                }
            } else {
                // Standard read all with filters
                const filters = this.req?.query || {};
                
                if (Object.keys(filters).length > 0) {
                    console.log('RoleController: Applying filter parameters:', filters);
                    const result = await this.service.findFiltered(filters);
                    return this.res.json(result);
                } else {
                    // Standard read all
                    console.log('RoleController: Fetching all roles...');
                    const result = await this.service.read();
                    return this.res.json(result);
                }
            }

        } catch (err) {
            console.error('RoleController: GET Error:', err.message);
            
            if (!this.res) {
                throw err; 
            } else {
                this.res.status(500).json({ error: 'Database query failed' });
            }
        }
    }

    async handlePost() {
        try {
            console.log('RoleController: Creating new role...');
            
            const data = this.req.body; 
            
            // Validate required fields
            if (!data.Name) {
                throw new Error('Name is required for role creation');
            }

            const result = await this.service.create(data);
            
            if (result.success) {
                return this.res.status(201).json({ 
                    success: true, 
                    id: result.ID,
                    message: 'Role created successfully'
                });
            } else {
                 throw new Error('Creation failed');
            }

        } catch (err) {
             console.error('RoleController: POST error:', err.message);
             
             if (!this.res) {
                throw err; 
             } else {
                this.res.status(500).json({ error: 'Database insertion failed' });
             }
        }
    }

    async handlePut() {
        try {
            console.log('RoleController: Updating role...');
            
            const id = this.req.params.ID;
            const updates = this.req.body; 
            
            if (!id || !Object.keys(updates).length > 0) {
                throw new Error('Invalid update request');
            }

            const result = await this.service.update(id, updates);
            
            if (result.success) {
                console.log('RoleController: Role updated successfully:', id);
                return this.res.json({ message: 'Role updated successfully' });
            } else {
                 throw new Error('Update failed');
            }

        } catch (err) {
             console.error('RoleController: PUT error:', err.message);
             
             if (!this.res) {
                throw err; 
             } else {
                this.res.status(500).json({ error: 'Database update failed' });
             }
        }
    }

    async handleDelete() {
        try {
            console.log('RoleController: Deleting role...');
            
            const id = this.req.params.ID; 
            
            if (!id) {
                throw new Error('Role ID is required for deletion');
            }

            const result = await this.service.remove(id);
            
            if (result.success) {
                console.log('RoleController: Role deleted successfully:', id);
                return this.res.json({ message: 'Role deleted successfully' });
            } else {
                 throw new Error('Delete failed');
            }

        } catch (err) {
             console.error('RoleController: DELETE error:', err.message);
             
             if (!this.res) {
                throw err; 
             } else {
                this.res.status(500).json({ error: 'Database deletion failed' });
             }
        }
    }
}

module.exports = RoleController;
