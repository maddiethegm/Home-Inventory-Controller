// oop/src/services/RoleService.js
const generateUUID = require('uuid').v4;
const CoreService = require('./CoreService');


/**
 * Service Class for Role Management with recursive hierarchy support.
 */
class RoleService extends CoreService {

    constructor(config) {
        super(config);
        this.tableName = 'Roles';
    }

    /**
     * Create a new role.
     */
    async create(data) {
        try {
            const ID = generateUUID();
            
            // Build data object with generated ID and parentRole if provided
            const roleData = {
                ID: ID,
                Name: data.Name || '',
                Description: data.Description || '',
                ParentRole: data.ParentRole || null  // Self-referential column for hierarchy
            };

            console.log('RoleService: Creating new role with parent:', roleData.ParentRole);
            
            const result = await super.create(roleData);
            console.log(`RoleService: Role created successfully. ID: ${ID}`);
            return { success: true, ID: result.ID };
        } catch (err) {
            console.error('RoleService: Create failed:', err.message);
            throw err;
        }
    }

    /**
     * Read all roles.
     */
    async read(params = {}) {
        try {
            console.log('RoleService: Fetching roles list...');
            
            const result = await this.find(params);
            console.log(`RoleService: Found ${result.length} roles`);
            return result;
        } catch (err) {
            console.error('RoleService: Read failed:', err.message);
            throw err;
        }
    }

    /**
     * Find child roles for a parent role ID.
     */
    async findChildren(parentRoleId = null, filters = {}) {
        try {
            if (!parentRoleId) {
                console.warn('RoleService: Parent role ID is required for finding children');
                return [];
            }

            const result = await this.find({ parentRole: parentRoleId });
            console.log(`RoleService: Found ${result.length} child roles for parent: ${parentRoleId}`);
            return result;
        } catch (err) {
            console.error('RoleService: Find children failed:', err.message);
            throw err;
        }
    }

    /**
     * Read role by ID.
     */
    async readById(id) {
        try {
            const result = await this.read({ ID: id });
            
            if (result.length === 0) {
                console.error('RoleService: Role not found for ID:', id);
                throw new Error('Role not found');
            }
            
            return result[0];
        } catch (err) {
            console.error('RoleService: Read by ID failed:', err.message);
            throw err;
        }
    }

    /**
     * Update role by ID.
     */
    async update(id, updates) {
        try {
            // Environment check for testing
            if (this.config && 
                this.config.ENVIRONMENT && 
                ['TESTING', 'DEVELOPMENT'].includes(this.config.ENVIRONMENT)) {
                console.log('RoleService: Test/Dev. Mocking role update.');
                return { success: true };
            }

            const result = await super.update(id, updates);
            
            console.log('RoleService: Role updated successfully:', id);
            return { success: true };
        } catch (err) {
            console.error('RoleService: Update failed:', err.message);
            throw err;
        }
    }

    /**
     * Delete role by ID.
     */
    async remove(id) {
        try {
            // Environment check for testing
            if (this.config && 
                this.config.ENVIRONMENT && 
                ['TESTING', 'DEVELOPMENT'].includes(this.config.ENVIRONMENT)) {
                console.log('RoleService: Test/Dev. Mocking role deletion.');
                return { success: true };
            }

            const result = await super.remove(id);
            
            console.log('RoleService: Role deleted successfully:', id);
            return { success: true };
        } catch (err) {
            console.error('RoleService: Delete failed:', err.message);
            throw err;
        }
    }

    /**
     * Find filtered roles.
     */
    async findFiltered(filters = {}) {
        try {
            const result = await this.find(filters);
            return result;
        } catch (err) {
            console.error('RoleService: Find filtered failed:', err.message);
            throw err;
        }
    }

    /**
     * Find roles by name.
     */
    async findByName(name) {
        try {
            const result = await this.read({ Name: name });
            return result;
        } catch (err) {
            console.error('RoleService: Find by name failed:', err.message);
            throw err;
        }
    }
}

module.exports = RoleService;
