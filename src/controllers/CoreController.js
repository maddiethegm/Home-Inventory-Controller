// oop/src/controllers/CoreController.js


/**
 * Base Controller class.
 * Handles HTTP response formatting and basic error catching.
 */
class CoreController {
    /**
     * Constructor accepts a service instance and the Express Request/Response objects.
     * @param {CoreService} service - The instantiated service backing this controller.
     * @param {object} req - Express request object.
     * @param {object} res - Express response object.
     */
    constructor(service, req = null, res = null) {
        this.service = service;
        this.req = req || {}; // Default to empty object if not provided
        this.res = res;
        this.id = null; 
    }


    /**
     * Generic GET handler. Reads from the database and sends JSON response.
     */
    async handleGet() {
        try {
            const result = await this.service.find();
            this.res.json(result); 
        } catch (err) {
            console.error('Controller GET Error:', err.message);
            this.res.status(500).json({ error: 'Database query failed' });
        }
    }


    /**
     * Generic POST/Create handler.
     */
    async handlePost() {
        try {
            const result = await this.service.create(this.req.body);
            if (result.success) {
                this.res.status(201).json({ success: true, data: result });
            } else {
                throw new Error('Creation failed');
            }
        } catch (err) {
             console.error('Controller POST Error:', err.message);
             this.res.status(500).json({ error: 'Database insertion failed' });
        }
    }


    /**
     * Generic PUT/Update handler. Expects ID in path params or body.
     */
    async handlePut() {
        try {
            const result = await this.service.update(this.id, this.req.body);
            if (result.success) {
                this.res.json({ success: true });
            } else {
                 throw new Error('Update failed');
            }
        } catch (err) {
             console.error('Controller PUT Error:', err.message);
             this.res.status(500).json({ error: 'Database update failed' });
        }
    }


    /**
     * Generic DELETE handler.
     */
    async handleDelete() {
        try {
            const result = await this.service.remove(this.id);
            if (result.success) {
                this.res.json({ success: true });
            } else {
                 throw new Error('Deletion failed');
            }
        } catch (err) {
             console.error('Controller DELETE Error:', err.message);
             this.res.status(500).json({ error: 'Database deletion failed' });
        }
    }

    /**
     * Related Records handler. Fetches related data based on foreign key relationships.
     */
    async handleRelated(relationTable, joinField = null) {
        try {
            const filters = this.req.query || {};
            
            if (!relationTable) {
                return this.res.status(400).json({ error: 'Relation table is required' });
            }

            console.log(`CoreController: Fetching related records from ${relationTable}...`);
            const result = await this.service.findRelated(relationTable, joinField, null, filters);
            
            if (result) {
                this.res.json(result);
            } else {
                this.res.status(204).json({ message: 'No related records found' });
            }

        } catch (err) {
            console.error('Controller Related Error:', err.message);
            this.res.status(500).json({ error: 'Database query failed for related records' });
        }
    }
}

module.exports = CoreController;
