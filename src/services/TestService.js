// oop/src/services/TestService.js
const CoreService = require('./CoreService');

/**
 * Test Service Class
 * Handles test-specific logic, such as mocking or returning dummy data.
 */
class TestService extends CoreService {
    constructor(config) {
        super(config); // Inherit standard methods like find/create/update/remove
    }

    /**
     * Simulates a database query for testing purposes without hitting the DB.
     * @param {string} tableName - Name of the table to simulate.
     * @returns {Promise<object>} Returns dummy data.
     */
    async mockQuery(tableName) {
        // Create fake recordset structure similar to MSSQL result
        const fakeRecord = {
            ID: 'TEST-123',
            [tableName]: `Mocked ${tableName}`,
            Status: 'Active'
        };

        return { 
            success: true, 
            recordset: [fakeRecord], 
            affectedRows: 0 
        };
    }

    /**
     * Mock Create: Returns a dummy ID for the new item.
     */
    async mockCreate(data) {
        const fakeID = `MOCK-${Math.floor(Math.random() * 10000)}`;
        return { success: true, ID: fakeID };
    }

    /**
     * Mock Update/Delete for items.
     */
    async mockUpdate(id, data) {
        console.log(`MockItemService: Updating item ${id}...`);
        return { success: true };
    }

    async mockRemove(id) {
        console.log(`MockItemService: Deleting item ${id}...`);
        return { success: true };
    }
}

module.exports = TestService;
