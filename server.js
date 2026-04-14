// oop/server.js
const dotenv = require('dotenv');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const yaml = require('js-yaml'); 

const ItemController = require('./src/controllers/ItemController'); 
const TestController = require('./src/controllers/TestController');
const LocationController = require('./src/controllers/LocationController');
const UserController = require('./src/controllers/UserController');
const GroupController = require('./src/controllers/GroupController');
const RoleController = require('./src/controllers/RoleController');



/**
 * Load environment variables (if .env exists) and config YAML.
 */
dotenv.config();


let config; 
try {
    const fs = require('fs');
    const path = require('path');
    
    // Attempt to load serverConfig logic (copying it here for standalone execution)
    const configPath = './config.yaml';
    if (fs.existsSync(configPath)) {
        const configFile = fs.readFileSync(configPath, 'utf8');
        config = yaml.load(configFile);
    } else {
        // Fallback to default config structure if file not found
        config = {
            PORT: process.env.PORT || 3102,
            DB_USER: 'testapp',
            DB_PASSWORD: 'testapp1234',
            DB_SERVER: 'localhost',
            DB_DATABASE: 'inventoryapp',
            DB_TYPE: 'MSSQL',
            TOKEN_EXPIRY: '8h'
        };
    }


} catch (e) {
    console.error("Failed to load configuration:", e.message);
    config = {}; // Empty config for demo purposes
}


const app = express();
const port = config.PORT || 3001;


// Middleware
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));
app.use(cors());


// --- OOP TEST ROUTES ---

/**
 * Mount TestController for verification.
 */
app.get('/api/test', (req, res) => {
    console.log('Testing Core Controller GET...');
    const testCtrl = new TestController(req, res);
    return testCtrl.handleGet();
});


app.post('/api/test', async (req, res) => {
    console.log('Testing Core Controller POST...');
    const testCtrl = new TestController(req, res);
    await testCtrl.handlePost();
});


/**
 * Mount ItemController for inventory management.
 */
app.get('/api/inventory', async (req, res) => { // Pass req and res here!
    console.log('Server: Handling GET /api/inventory via ItemController...');
    
    const itemCtrl = new ItemController(config, req, res); 
    
    await itemCtrl.handleGet();
});


app.post('/api/inventory', async (req, res) => { // Pass req and res here!
    console.log('Server: Handling POST /api/inventory via ItemController...');
    
    const itemCtrl = new ItemController(config, req, res); 
    
    await itemCtrl.handlePost();
});


// Standard PUT endpoint for updating a specific item by ID
app.put('/api/inventory/:ID', async (req, res) => { 
    console.log('Server: Handling PUT /api/inventory/:ID via ItemController...');
    
    const itemCtrl = new ItemController(config, req, res); 
    
    await itemCtrl.handlePut();
});


// Standard DELETE endpoint for deleting a specific item by ID
app.delete('/api/inventory/:ID', async (req, res) => { 
    console.log('Server: Handling DELETE /api/inventory/:ID via ItemController...');
    
    const itemCtrl = new ItemController(config, req, res); 
    
    await itemCtrl.handleDelete();
});

/**
 * Mount LocationController for location management.
 */
app.get('/api/locations', async (req, res) => { 
    console.log('Server: Handling GET /api/locations via LocationController...');
    
    const locCtrl = new LocationController(config, req, res); 
    
    await locCtrl.handleGet();
});


app.post('/api/locations', async (req, res) => { 
    console.log('Server: Handling POST /api/locations via LocationController...');
    
    const locCtrl = new LocationController(config, req, res); 
    
    await locCtrl.handlePost();
});


// Standard PUT endpoint for updating a location by ID
app.put('/api/locations/:ID', async (req, res) => { 
    console.log('Server: Handling PUT /api/locations/:ID via LocationController...');
    
    const locCtrl = new LocationController(config, req, res); 
    
    await locCtrl.handlePut();
});


// Standard DELETE endpoint for deleting a location by ID
app.delete('/api/locations/:ID', async (req, res) => { 
    console.log('Server: Handling DELETE /api/locations/:ID via LocationController...');
    
    const locCtrl = new LocationController(config, req, res); 
    
    await locCtrl.handleDelete();
});

/**
 * Item Hierarchies - Find Child Items under a Parent Item
 */
app.get('/api/inventory/:ID/children', async (req, res) => { 
    console.log('Server: Handling GET /api/inventory/:ID/children via ItemController...');
    
    const itemCtrl = new ItemController(config, req, res); 
    
    await itemCtrl.handleGet(); // Uses handleGet to find children based on parentItem field
});

/**
 * Location Hierarchies - Find Child Locations under a Parent Location
 */
app.get('/api/locations/:ID/children', async (req, res) => { 
    console.log('Server: Handling GET /api/locations/:ID/children via LocationController...');
    
    const locCtrl = new LocationController(config, req, res); 
    
    await locCtrl.handleGet(); // Uses handleGet to find children based on parentLoc field
});

/**
 * User Owned Items - Find all items owned by a specific user
 */
app.get('/api/inventory/user-owned/:userId', async (req, res) => { 
    console.log('Server: Handling GET /api/inventory/user-owned/:userId via ItemController...');
    
    const itemCtrl = new ItemController(config, req, res); 
    
    await itemCtrl.handleGet(); // Uses handleGet to find user items based on ownerId field
});

/**
 * Mount UserController for user management.
 */
app.post('/api/auth/register', async (req, res) => { // Auth middleware would go here
    console.log('Server: Handling POST /api/auth/register via UserController...');
    
    const userCtrl = new UserController(config, req, res); 
    await userCtrl.handleRegister();
});



app.post('/api/auth/login', async (req, res) => { // Rate limiter middleware would go here
    console.log('Server: Handling POST /api/auth/login via UserController...');
    
    const userCtrl = new UserController(config, req, res); 
    await userCtrl.handleLogin();
});



app.get('/api/users', async (req, res) => { // Auth middleware would go here
    console.log('Server: Handling GET /api/users via UserController...');
    
    const userCtrl = new UserController(config, req, res); 
    await userCtrl.handleRead();
});



app.get('/api/users/:username', async (req, res) => { // Auth middleware would go here
    console.log('Server: Handling GET /api/users/:username via UserController...');
    
    const userCtrl = new UserController(config, req, res); 
    await userCtrl.handleReadByUsername();
});



app.put('/api/users/:ID', async (req, res) => { // Auth middleware would go here
    console.log('Server: Handling PUT /api/users/:ID via UserController...');
    
    const userCtrl = new UserController(config, req, res); 
    await userCtrl.handleUpdate();
});



app.delete('/api/users/:ID', async (req, res) => { // Auth middleware would go here
    console.log('Server: Handling DELETE /api/users/:ID via UserController...');
    
    const userCtrl = new UserController(config, req, res); 
    await userCtrl.handleDelete();
});


/**
 * Mount GroupController for group management.
 */
app.get('/api/groups', async (req, res) => { 
    console.log('Server: Handling GET /api/groups via GroupController...');
    
    const groupCtrl = new GroupController(config, req, res); 
    await groupCtrl.handleGet();
});



app.post('/api/groups', async (req, res) => { 
    console.log('Server: Handling POST /api/groups via GroupController...');
    
    const groupCtrl = new GroupController(config, req, res); 
    await groupCtrl.handlePost();
});



// Standard PUT endpoint for updating a group by ID
app.put('/api/groups/:ID', async (req, res) => { 
    console.log('Server: Handling PUT /api/groups/:ID via GroupController...');
    
    const groupCtrl = new GroupController(config, req, res); 
    await groupCtrl.handlePut();
});



// Standard DELETE endpoint for deleting a group by ID
app.delete('/api/groups/:ID', async (req, res) => { 
    console.log('Server: Handling DELETE /api/groups/:ID via GroupController...');
    
    const groupCtrl = new GroupController(config, req, res); 
    await groupCtrl.handleDelete();
});


/**
 * Group Hierarchies - Find Child Groups under a Parent Group
 */
app.get('/api/groups/:ID/children', async (req, res) => { 
    console.log('Server: Handling GET /api/groups/:ID/children via GroupController...');
    
    const groupCtrl = new GroupController(config, req, res); 
    await groupCtrl.handleGet(); // Uses handleGet to find children based on parentGroup field
});


/**
 * Mount RoleController for role management.
 */
app.get('/api/roles', async (req, res) => { 
    console.log('Server: Handling GET /api/roles via RoleController...');
    
    const roleCtrl = new RoleController(config, req, res); 
    await roleCtrl.handleGet();
});



app.post('/api/roles', async (req, res) => { 
    console.log('Server: Handling POST /api/roles via RoleController...');
    
    const roleCtrl = new RoleController(config, req, res); 
    await roleCtrl.handlePost();
});



// Standard PUT endpoint for updating a role by ID
app.put('/api/roles/:ID', async (req, res) => { 
    console.log('Server: Handling PUT /api/roles/:ID via RoleController...');
    
    const roleCtrl = new RoleController(config, req, res); 
    await roleCtrl.handlePut();
});



// Standard DELETE endpoint for deleting a role by ID
app.delete('/api/roles/:ID', async (req, res) => { 
    console.log('Server: Handling DELETE /api/roles/:ID via RoleController...');
    
    const roleCtrl = new RoleController(config, req, res); 
    await roleCtrl.handleDelete();
});


/**
 * Role Hierarchies - Find Child Roles under a Parent Role
 */
app.get('/api/roles/:ID/children', async (req, res) => { 
    console.log('Server: Handling GET /api/roles/:ID/children via RoleController...');
    
    const roleCtrl = new RoleController(config, req, res); 
    await roleCtrl.handleGet(); // Uses handleGet to find children based on parentRole field
});


// Start Server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    
    // Self-test: Hit the test endpoint immediately after starting
    setTimeout(async () => {
        try {
            const response = await fetch(`http://localhost:${port}/api/test`);
            const data = await response.json();
            console.log('Test Response:', data);
        } catch (err) {
            console.error('Self-test failed:', err.message);
        }
    }, 500); // Wait half a second for server to bind
});


module.exports = app;
