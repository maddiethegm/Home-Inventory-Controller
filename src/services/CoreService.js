// oop/src/services/CoreService.js
const { executeQuery } = require('./dbconnector/queryExecutor');


/**
 * Abstract base class for all Service classes.
 * Handles generic CRUD operations using the queryExecutor.
 */
class CoreService {
    constructor(config) {
        this.config = config;
        this.tableName = 'UnknownTable'; 
    }

    async find(filters = {}) {
        return executeQuery(this.config, this.tableName, 'READ', filters);
    }

    async create(data) {
        return executeQuery(this.config, this.tableName, 'CREATE', data);
    }

    async update(id, updates) {
        const params = { ...updates, ID: id }; 
        return executeQuery(this.config, this.tableName, 'UPDATE', params);
    }

    async remove(id) {
        return executeQuery(this.config, this.tableName, 'DELETE', { ID: id });
    }

    /**
     * Related Record Lookup Operation (Custom Read with JOINs/Foreign Keys).
     * Allows looking up related records by foreign key relationships.
     */
    async findRelated(relationTable = null, joinField = null, filterField = null, filters = {}) {
        console.log(`CoreService: Finding related records...`);
        
        // Build a custom query with JOIN or filtered subquery
        const queryParams = {};
        
        if (joinField && filters[joinField]) {
            queryParams[`${joinField}`] = filters[joinField];
        } else if (filterField && filters[filterField]) {
            queryParams[filterField] = filters[filterField];
        }
        
        const result = await executeQuery(this.config, this.tableName, 'READ', queryParams);
        
        console.log(`CoreService: Found ${result.length} related records.`);
        return result;
    }

    /**
     * Find all child items for a parent item ID (Item Hierarchies)
     */
    async findChildItems(parentItemId = null, filters = {}) {
        if (!parentItemId) {
            throw new Error('Parent item ID is required for finding children');
        }

        return this.findRelated(null, 'parentItem', null, { parentItem: parentItemId });
    }

    /**
     * Find all child locations for a parent location ID (Location Hierarchies)
     */
    async findChildLocations(parentLocId = null, filters = {}) {
        if (!parentLocId) {
            throw new Error('Parent location ID is required for finding children');
        }

        return this.findRelated(null, 'parentLoc', null, { parentLoc: parentLocId });
    }

    /**
     * Find all items owned by a specific user
     */
    async findUserItems(userId = null) {
        if (!userId) {
            throw new Error('User ID is required for finding user items');
        }

        return this.findRelated('Items', 'ownerId', null, { ownerId: userId });
    }

    /**
     * Find all items in a specific location
     */
    async findItemsByLocation(locationId = null) {
        if (!locationId) {
            throw new Error('Location ID is required for finding items by location');
        }

        return this.findRelated('Items', 'parentLoc', null, { parentLoc: locationId });
    }

    /**
     * Find the parent item or location for a given record
     */
    async findParent(parentTable = null, idField = null) {
        if (!idField || !this.tableName) {
            throw new Error('ID field and table name are required');
        }

        // Extract ID from current request context or params
        const requestId = this.req?.params?.ID || this.req?.query?.ID;
        
        return this.findRelated(null, `${parentTable}.${idField}`, null, { [`${idField}`]: requestId });
    }
}

module.exports = CoreService;
