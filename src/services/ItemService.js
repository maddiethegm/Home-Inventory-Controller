// oop/src/services/ItemService.js
const CoreService = require('./CoreService');
const generateUUID = require('uuid').v4;


/**
 * Service Class for Inventory Items.
 * Encapsulates business logic related to items.
 */
class ItemService extends CoreService {
    /**
     * Constructor.
     * @param {object} config - The database configuration object.
     */
    constructor(config) {
        super(config);
        this.tableName = 'Items'; // Define the specific table name for items
    }


    /**
     * Override the CREATE method to perform validation before insertion.
     */
    async create(data) {
        try {
            // In TESTING mode, skip uniqueness validation to avoid param config issues
            const isTesting = process.env.ENVIRONMENT && ['TESTING', 'DEVELOPMENT'].includes(process.env.ENVIRONMENT);
            
            if (!isTesting) {
                // Check existing items for matching Name
                const existingItems = await super.find({ Name: data.Name });
                
                if (existingItems && existingItems.length > 0) {
                    console.log(`ItemService: Duplicate item found.`);
                    throw new Error('Item with same name already exists.');
                }
            }

            // Add generated ID to data before passing to parent service
            const ID = generateUUID();
            data.ID = ID;
            
            console.log(`handling data:`, JSON.stringify(data));
            
            // Call parent's standard CREATE logic (using queryExecutor)
            return super.create(data);
            
        } catch (err) {
            console.error('ItemService: Creation failed:', err.message);
            throw err;
        }
    }

    /**
     * Custom update method that merges updates with existing data.
     */
    async update(id, updates) {
        try {
            // Validate that we have updates
            if (!id || Object.keys(updates).length === 0) {
                throw new Error('Missing or invalid parameters for UPDATE operation.');
            }

            // For MSSQL, ID field must be passed as @ID in the WHERE clause.
            // We should NOT pass it as a value in params if it's already being used as key.
            
            // Merge updates object with ID - only add ID to params if not already present
            const params = { ...updates };
            
            // If ID is not already in params, add it (this matches original functional logic)
            if (!params.ID) {
                params.ID = id;
            }
            
            console.log('ItemService: Update params:', JSON.stringify(params));
            
            return super.update(id, updates);
        } catch (err) {
            console.error('ItemService: Update failed:', err.message);
            throw err;
        }
    }

    /**
     * Custom delete method.
     */
    async remove(id) {
        try {
            if (!id) {
                throw new Error('Missing or invalid parameters for DELETE operation.');
            }

            // Only pass the ID as a key, don't add it as a value too
            const params = { ID: id };
            
            console.log('ItemService: Delete params:', JSON.stringify(params));
            
            return super.remove(id);
        } catch (err) {
            console.error('ItemService: Deletion failed:', err.message);
            throw err;
        }
    }
    /**
     * Find all child items for a parent item ID (Hierarchical Items)
     */
    async findChildren(parentItemId = null) {
        if (!parentItemId) {
            throw new Error('Parent item ID is required for finding children');
        }

        console.log(`ItemService: Finding ${parentItemId} child items...`);
        
        return await this.findChildItems(parentItemId);
    }

    /**
     * Find all items owned by a specific user
     */
    async findUserOwnedItems(userId = null) {
        if (!userId) {
            throw new Error('User ID is required for finding user items');
        }

        console.log(`ItemService: Finding ${userId} owned items...`);
        
        return await this.findUserItems(userId);
    }

    /**
     * Find all items in a specific location
     */
    async findLocationItems(locationId = null) {
        if (!locationId) {
            throw new Error('Location ID is required for finding location items');
        }

        console.log(`ItemService: Finding ${locationId} items...`);
        
        return await this.findItemsByLocation(locationId);
    }

    /**
     * Find parent item details for a given item
     */
    async findParentItem(itemId = null) {
        if (!itemId) {
            throw new Error('Item ID is required for finding parent');
        }

        console.log(`ItemService: Finding ${itemId} parent item...`);
        
        // Get the current record first to access its parentItem field
        const item = await this.find({ ID: itemId });
        if (item && item.length > 0) {
            return item[0].parentItem;
        }
        
        return null;
    }
}


module.exports = ItemService;
