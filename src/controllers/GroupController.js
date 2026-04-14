// oop/src/controllers/GroupController.js
const CoreController = require('./CoreController');
const GroupService = require('../services/GroupService');


/**
 * Controller Class for Group Management with recursive hierarchy support.
 */
class GroupController extends CoreController {
    constructor(config, req = null, res = null) {
        super(null, null, null); 
        this.service = new GroupService(config);
        
        if (req) {
            this.req = req;
        }
        
        if (res) {
            this.res = res;
        } else {
            console.warn('GroupController: No response object provided. Using mock response.');
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
            console.log('GroupController: Fetching groups list...');
            
            const path = this.req.route.path || '';
            let filterValue = null;
            
            // Check for hierarchical request
            if (path.includes('/children')) {
                // Extract parent group ID from the route pattern
                // /api/groups/:ID/children -> extract :ID as parentGroup
                const segments = path.split('/').filter(s => s);
                const lastSegment = segments[segments.length - 2]; // Skip '/children'
                
                if (lastSegment) {
                    filterValue = lastSegment;
                    console.log('GroupController: Fetching child groups for parent:', filterValue);
                    
                    const result = await this.service.findChildren(filterValue);
                    return this.res.json(result || []);
                }
            } else {
                // Standard read all with filters
                const filters = this.req?.query || {};
                
                if (Object.keys(filters).length > 0) {
                    console.log('GroupController: Applying filter parameters:', filters);
                    const result = await this.service.findFiltered(filters);
                    return this.res.json(result);
                } else {
                    // Standard read all
                    console.log('GroupController: Fetching all groups...');
                    const result = await this.service.read();
                    return this.res.json(result);
                }
            }

        } catch (err) {
            console.error('GroupController: GET Error:', err.message);
            
            if (!this.res) {
                throw err; 
            } else {
                this.res.status(500).json({ error: 'Database query failed' });
            }
        }
    }

    async handlePost() {
        try {
            console.log('GroupController: Creating new group...');
            
            const data = this.req.body; 
            
            // Validate required fields
            if (!data.Name) {
                throw new Error('Name is required for group creation');
            }

            const result = await this.service.create(data);
            
            if (result.success) {
                return this.res.status(201).json({ 
                    success: true, 
                    id: result.ID,
                    message: 'Group created successfully'
                });
            } else {
                 throw new Error('Creation failed');
            }

        } catch (err) {
             console.error('GroupController: POST error:', err.message);
             
             if (!this.res) {
                throw err; 
             } else {
                this.res.status(500).json({ error: 'Database insertion failed' });
             }
        }
    }

    async handlePut() {
        try {
            console.log('GroupController: Updating group...');
            
            const id = this.req.params.ID;
            const updates = this.req.body; 
            
            if (!id || !Object.keys(updates).length > 0) {
                throw new Error('Invalid update request');
            }

            const result = await this.service.update(id, updates);
            
            if (result.success) {
                console.log('GroupController: Group updated successfully:', id);
                return this.res.json({ message: 'Group updated successfully' });
            } else {
                 throw new Error('Update failed');
            }

        } catch (err) {
             console.error('GroupController: PUT error:', err.message);
             
             if (!this.res) {
                throw err; 
             } else {
                this.res.status(500).json({ error: 'Database update failed' });
             }
        }
    }

    async handleDelete() {
        try {
            console.log('GroupController: Deleting group...');
            
            const id = this.req.params.ID; 
            
            if (!id) {
                throw new Error('Group ID is required for deletion');
            }

            const result = await this.service.remove(id);
            
            if (result.success) {
                console.log('GroupController: Group deleted successfully:', id);
                return this.res.json({ message: 'Group deleted successfully' });
            } else {
                 throw new Error('Delete failed');
            }

        } catch (err) {
             console.error('GroupController: DELETE error:', err.message);
             
             if (!this.res) {
                throw err; 
             } else {
                this.res.status(500).json({ error: 'Database deletion failed' });
             }
        }
    }
}

module.exports = GroupController;
