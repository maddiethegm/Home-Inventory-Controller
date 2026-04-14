// oop/src/controllers/TestController.js
const CoreController = require('./CoreController');

/**
 * Test Controller Class
 * Provides a simple interface for testing the controller logic against mocks.
 */
class TestController extends CoreController {
    constructor(req, res) {
        // We pass null service to force manual mocking or we can inject a mock here
        super(null, req, res); 
        this.isMock = true;
    }

    async handleGet() {
        console.log('TestController: Handling GET request...');
        
        if (this.isMock) {
            // Return dummy data directly from controller for testing speed
            return this.res.json({ message: 'This is a Mock Response', status: 'OK' });
        } else {
            await super.handleGet();
        }
    }

    async handlePost() {
        console.log('TestController: Handling POST request...');
        
        if (this.isMock) {
             this.res.status(201).json({ success: true, mockData: 'mocked creation' });
        } else {
            await super.handlePost();
        }
    }

    /**
     * Specific test for ItemController logic (e.g., checking if ID is valid)
     */
    async handleItemUpdate() {
        console.log('TestController: Handling Mock Item Update...');
        
        // Simulate an update
        const mockData = this.req.body;
        if (!mockData.Name) {
            return this.res.status(400).json({ error: 'Name required' });
        }

        this.res.json({ success: true, message: `Item '${mockData.Name}' updated successfully` });
    }
}

module.exports = TestController;
