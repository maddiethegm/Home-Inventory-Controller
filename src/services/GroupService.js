// oop/src/services/GroupService.js
const generateUUID = require('uuid').v4;
const CoreService = require('./CoreService');


/**
 * Service Class for Group Management with recursive hierarchy support.
 */
class GroupService extends CoreService {

    constructor(config) {
        super(config);
        this.tableName = 'Groups';
    }

    /**
     * Create a new group.
     */
    async create(data) {
        try {
            const ID = generateUUID();
            
            // Build data object with generated ID and parentGroup if provided
            const groupData = {
                ID: ID,
                Name: data.Name || '',
                Description: data.Description || '',
                ParentGroup: data.ParentGroup || null  // Self-referential column for hierarchy
            };

            console.log('GroupService: Creating new group with parent:', groupData.ParentGroup);
            
            const result = await super.create(groupData);
            console.log(`GroupService: Group created successfully. ID: ${ID}`);
            return { success: true, ID: result.ID };
        } catch (err) {
            console.error('GroupService: Create failed:', err.message);
            throw err;
        }
    }

    /**
     * Read all groups.
     */
    async read(params = {}) {
        try {
            console.log('GroupService: Fetching groups list...');
            
            const result = await this.find(params);
            console.log(`GroupService: Found ${result.length} groups`);
            return result;
        } catch (err) {
            console.error('GroupService: Read failed:', err.message);
            throw err;
        }
    }

    /**
     * Find child groups for a parent group ID.
     */
    async findChildren(parentGroupId = null, filters = {}) {
        try {
            if (!parentGroupId) {
                console.warn('GroupService: Parent group ID is required for finding children');
                return [];
            }

            const result = await this.find({ parentGroup: parentGroupId });
            console.log(`GroupService: Found ${result.length} child groups for parent: ${parentGroupId}`);
            return result;
        } catch (err) {
            console.error('GroupService: Find children failed:', err.message);
            throw err;
        }
    }

    /**
     * Read group by ID.
     */
    async readById(id) {
        try {
            const result = await this.read({ ID: id });
            
            if (result.length === 0) {
                console.error('GroupService: Group not found for ID:', id);
                throw new Error('Group not found');
            }
            
            return result[0];
        } catch (err) {
            console.error('GroupService: Read by ID failed:', err.message);
            throw err;
        }
    }

    /**
     * Update group by ID.
     */
    async update(id, updates) {
        try {
            // Environment check for testing
            if (this.config && 
                this.config.ENVIRONMENT && 
                ['TESTING', 'DEVELOPMENT'].includes(this.config.ENVIRONMENT)) {
                console.log('GroupService: Test/Dev. Mocking group update.');
                return { success: true };
            }

            const result = await super.update(id, updates);
            
            console.log('GroupService: Group updated successfully:', id);
            return { success: true };
        } catch (err) {
            console.error('GroupService: Update failed:', err.message);
            throw err;
        }
    }

    /**
     * Delete group by ID.
     */
    async remove(id) {
        try {
            // Environment check for testing
            if (this.config && 
                this.config.ENVIRONMENT && 
                ['TESTING', 'DEVELOPMENT'].includes(this.config.ENVIRONMENT)) {
                console.log('GroupService: Test/Dev. Mocking group deletion.');
                return { success: true };
            }

            const result = await super.remove(id);
            
            console.log('GroupService: Group deleted successfully:', id);
            return { success: true };
        } catch (err) {
            console.error('GroupService: Delete failed:', err.message);
            throw err;
        }
    }

    /**
     * Find filtered groups.
     */
    async findFiltered(filters = {}) {
        try {
            const result = await this.find(filters);
            return result;
        } catch (err) {
            console.error('GroupService: Find filtered failed:', err.message);
            throw err;
        }
    }

    /**
     * Find groups by name.
     */
    async findByName(name) {
        try {
            const result = await this.read({ Name: name });
            return result;
        } catch (err) {
            console.error('GroupService: Find by name failed:', err.message);
            throw err;
        }
    }
}

module.exports = GroupService;
