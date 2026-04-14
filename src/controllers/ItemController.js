// oop/src/controllers/ItemController.js
const CoreController = require('./CoreController');
const ItemService = require('../services/ItemService');

/**
 * Controller Class for Inventory Items.
 */
class ItemController extends CoreController {
    constructor(config = null, req = null, res = null) {
        super(null, null, null); 
        this.service = new ItemService(config); 
        
        if (req) {
            this.req = req;
        }
        
        if (res) {
            this.res = res;
        } else {
            console.warn('ItemController: No response object provided. Using mock response.');
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

    /**
     * Handles GET /api/inventory requests.
     */
    async handleGet() {
        try {
            console.log('ItemController: Fetching inventory list...');
            
            // Check for hierarchical routes by looking at Express params
            const isUserOwnedRoute = !!this.req.params.userId;
            const isChildrenRoute = !!this.req.params.ID;
            
            if (isUserOwnedRoute && this.req.params.userId) {
                console.log('ItemController: Fetching user-owned items for user:', this.req.params.userId);
                
                // Verify it's actually a user-owned route by checking path pattern
                const path = this.req.route.path || '';
                if (!path.includes('/user-owned')) {
                    throw new Error('Route path mismatch for user-owned operation');
                }
                
                const result = await this.service.findUserOwnedItems(this.req.params.userId);
                return this.res.json(result || []);
            } else if (isChildrenRoute && this.req.params.ID) {
                console.log('ItemController: Fetching child items for item:', this.req.params.ID);
                
                // Verify path pattern
                const path = this.req.route.path || '';
                if (!path.includes('/children')) {
                    throw new Error('Route path mismatch for children operation');
                }
                
                const result = await this.service.findChildren(this.req.params.ID);
                return this.res.json(result || []);
            } else {
                // Standard read all with filters
                const filters = this.req?.query || {};
                
                if (Object.keys(filters).length > 0) {
                    console.log('ItemController: Applying filter parameters:', filters);
                    const result = await this.service.findFiltered(filters);
                    return this.res.json(result);
                } else {
                    // Standard read all
                    console.log('ItemController: Fetching all items...');
                    const result = await this.service.find();
                    return this.res.json(result);
                }
            }

        } catch (err) {
            console.error('ItemController: GET Error:', err.message);
            
            if (!this.res) {
                throw err; 
            } else {
                this.res.status(500).json({ error: 'Database query failed' });
            }
        }
    }

    async handlePost() {
        try {
            console.log('ItemController: Adding new inventory item...');
            
            const data = this.req.body; 
            
            if (!data.Name) {
                throw new Error('Name is required');
            }

            const result = await this.service.create(data);
            
            if (result.success) {
                return this.res.status(201).json({ success: true, id: result.ID });
            } else {
                 throw new Error('Creation failed');
            }

        } catch (err) {
             console.error('ItemController: POST Error:', err.message);
             
             if (!this.res) {
                throw err; 
             } else {
                this.res.status(500).json({ error: 'Database insertion failed' });
             }
        }
    }

    async handlePut() {
        try {
            console.log('ItemController: Updating inventory item...');
            
            const { ID } = this.req.params; 
            const updates = this.req.body; 

            if (!ID || !Object.keys(updates).length > 0) {
                throw new Error('Invalid update request');
            }

            const result = await this.service.update(ID, updates);
            
            if (result.success) {
                return this.res.json({ success: true });
            } else {
                 throw new Error('Update failed');
            }

        } catch (err) {
             console.error('ItemController: PUT Error:', err.message);
             
             if (!this.res) {
                throw err; 
             } else {
                this.res.status(500).json({ error: 'Database update failed' });
             }
        }
    }

    async handleDelete() {
        try {
            console.log('ItemController: Deleting inventory item...');
            
            const { ID } = this.req.params; 
            
            if (!ID) {
                throw new Error('Item ID is required for deletion');
            }

            const result = await this.service.remove(ID);
            
            if (result.success) {
                return this.res.json({ success: true });
            } else {
                 throw new Error('Deletion failed');
            }

        } catch (err) {
             console.error('ItemController: DELETE Error:', err.message);
             
             if (!this.res) {
                throw err; 
             } else {
                this.res.status(500).json({ error: 'Database deletion failed' });
             }
        }
    }
}

module.exports = ItemController;
