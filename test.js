// oop/test.js

const axios = require('axios'); 
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');


/**
 * Reads the server configuration from config.yaml.
 */
function getConfig() {
    const configPath = './config.yaml';
    
    if (!fs.existsSync(configPath)) {
        console.warn(`Warning: ${configPath} not found. Using default port 3001.`);
        return { PORT: 3001, ENVIRONMENT: 'TESTING' };
    }

    const configFileContent = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(configFileContent);
    
    if (!config.PORT) {
        console.warn('Warning: No PORT found in config.yaml. Defaulting to 3001.');
        return { ...config, PORT: 3001 };
    }

    return config;
}


/**
 * Helper function to make HTTP requests with error handling.
 */
async function request(endpoint, method = 'GET', payload = null) {
    const url = `http://localhost:${getConfig().PORT}${endpoint}`;
    
    try {
        let response;
        
        if (method.toUpperCase() === 'GET') {
            response = await axios.get(url);
        } 
        else if (method.toUpperCase() === 'POST' && payload) {
            response = await axios.post(url, payload);
        } 
        else if (method.toUpperCase() === 'PUT' && payload) {
            response = await axios.put(url, payload);
        } 
        else if (method.toUpperCase() === 'DELETE') {
            response = await axios.delete(url);
        } 
        else {
            console.error(`Error: Unsupported method ${method}`);
            return null;
        }
        
        console.log(`\n[${response.status}] ${endpoint} (${method})`);
        return response.data;

    } catch (error) {
        if (error.response) {
            console.error(`Status: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        } else if (error.code === 'ECONNREFUSED') {
            console.error('Connection refused. Is the server running?');
        } else {
            console.error(`Request failed: ${error.message}`);
        }
        return null;
    }
}


/**
 * Helper function to randomly pick n items from an array.
 */
function randomPick(items, count) {
  if (!items || items.length < count) {
    console.warn('Not enough items to pick randomly.');
    return items.slice(0, Math.min(count, items.length));
  }
  
  const shuffled = [...items].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}


/**
 * Main execution block.
 */
async function main() {
    console.log('Starting OOP Service Test Suite...\n');
    
    const config = getConfig();
    console.log(`Config loaded. Port: ${config.PORT}`);

    // 1. Test CoreController (Mock Mode)
    console.log('\n--- Testing CoreController (Mock Mode) ---');
    const getResponse = await request('/api/test', 'GET');
    
    // 2. Test Mock Controller POST
    console.log('\n--- Testing CoreController (Post Mode) ---');
    const postPayload = { Name: "TestItem", Quantity: 1 };
    const postResponse = await request('/api/test', 'POST', postPayload);

    // 3. Test Original Inventory Routes
    console.log('\n--- Testing Original Inventory Route ---');
    const inventoryResponse = await request('/api/inventory', 'GET');

    // 4. Test Auth Route
    console.log('\n--- Testing Original Auth Route ---');
    const loginPayload = { Username: `${config.testUserID}`, password: `${config.testUserPW}` };
    console.log(loginPayload);
    const loginResponse = await request('/api/auth/login', 'POST', loginPayload);

    // 5. Test NEW ItemController Routes (Optional)
    
    console.log('\n--- Testing New ItemController GET ---');
    const itemGetResponse = await request('/api/inventory', 'GET');
    
    console.log('\n--- Testing New ItemController POST (Create) ---');
    const createPayload = { Name: `TestItem-${Date.now()}`, Quantity: 10 };
    const itemPostResponse = await request('/api/inventory', 'POST', createPayload);

   // 6. TEST ITEM UPDATE WORKFLOW
   console.log('\n--- Testing New ItemController PUT (Update) ---');
   
   // 6a. Get all items and filter for TestItem- names
   const allItems = itemGetResponse || [];
   const testItems = allItems.filter(item => item.Name && item.Name.startsWith('Updated Item -') || (item.Name.startsWith('TestItem-')));
   
   if (testItems.length === 0) {
     console.warn('No test items found with "TestItem-" prefix. Creating some for testing...');
     
     const numToCreate = Math.min(5, allItems.length);
     for (let i = 0; i < numToCreate; i++) {
       const newItemPayload = { Name: `TestItem-${Date.now()}-${i}`, Quantity: 10 };
       await request('/api/inventory', 'POST', newItemPayload);
     }
   }
   
   // 6b. Randomly pick two test items
   const selectedItems = randomPick(testItems, 2);
   
   console.log(`Selected ${selectedItems.length} test items:`);
   selectedItems.forEach((item, idx) => {
     console.log(`  Item ${idx + 1}: Name="${item.Name}", ID="${item.ID}"`);
   });
   
   if (selectedItems.length < 2) {
     console.error('Need at least 2 test items to continue.');
     return;
   }
    // 11a. Test Item Hierarchies - Find Child Items under a Parent Item
    console.log('\n--- Testing NEW ItemController GET /children ---');
    if (selectedItems.length > 0) {
      const PARENT_ITEM_ID = selectedItems[1].ID;
      const childrenResponse = await request(`/api/inventory/${PARENT_ITEM_ID}/children`, 'GET');
      console.log(`Item Hierarchy: Found ${childrenResponse ? childrenResponse.length : 0} child items.`);
    }
   // 12. TEST USER OWNED ITEMS (NEW)
    console.log('\n--- Testing NEW ItemController GET /user-owned/:userId ---');
    // In a real scenario, you'd pass an actual user ID from the database

    const userItemsResponse = await request(`/api/inventory/user-owned/${config.testUserId}`, 'GET');
    console.log(`User Owned Items: Found ${userItemsResponse ? userItemsResponse.length : 0} items for this user.`);

   // Store selected IDs for PUT/DELETE operations
   const selectedIds = selectedItems.map(item => item.ID);
   
   // 6c. Update both items with new names via PUT
   for (let i = 0; i < selectedIds.length; i++) {
     const id = selectedIds[i];
     const namePrefix = i === 0 ? 'Updated Item - Apple' : 'Updated Item - Butter' ;
     
     const updates = { Name: namePrefix };
     const updateResponse = await request('/api/inventory/' + id, 'PUT', updates);
   }

    // 7. Test DELETE Operation
    const DEL = selectedIds[0];
    console.log('\n--- Testing New ItemController DELETE ---');
    const deleteResponse = await request('/api/inventory/' + DEL, 'DELETE');

    // 8. TEST LOCATION ROUTES
    console.log('\n--- Testing New LocationController GET ---');
    const locationGetResponse = await request('/api/locations', 'GET');
    
    console.log('\n--- Testing New LocationController POST (Create) ---');
    const locationCreatePayload = { Name: `TestLocation-${Date.now()}`, Building: "Building A", Description: "Test description" };
    const locationPostResponse = await request('/api/locations', 'POST', locationCreatePayload);

    // 9. TEST LOCATION UPDATE WORKFLOW
    console.log('\n--- Testing New LocationController PUT (Update) ---');
    
    var allLocations = locationGetResponse || [];
    var testLocations = allLocations.filter(loc => loc.Name && loc.Name.startsWith('TestLocation-') || loc.Name.startsWith('Updated Location -'));
    
    if (testLocations.length === 0) {
     console.warn('No test locations found with "TestLocation-" prefix. Creating some for testing...');
     
     const numToCreate = Math.min(5, allLocations.length);
     for (let i = 0; i < numToCreate; i++) {
       const newLocPayload = { Name: `TestLocation-${Date.now()}-${i}`, Building: `Building B`, Description: 'Test description' };
       await request('/api/locations', 'POST', newLocPayload);
     }
   }
   
   // 9b. Randomly pick two test locations
   const selectedLocations = randomPick(testLocations, 2);
   
   console.log(`Selected ${selectedLocations.length} test locations:`);
   selectedLocations.forEach((loc, idx) => {
     console.log(`  Location ${idx + 1}: Name="${loc.Name}", ID="${loc.ID}"`);
   });
   
   if (selectedLocations.length < 2) {
     console.error('Need at least 2 test locations to continue.');
     return;
   }
   
   // Store selected IDs for PUT operations
   const selectedLocationIds = selectedLocations.map(loc => loc.ID);
   
   // 9c. Update both locations with new names via PUT
   for (let i = 0; i < selectedLocationIds.length; i++) {
     const id = selectedLocationIds[i];
     const namePrefix = i === 0 ? `Updated Location - Alpha -${Date.now()}-${i}` : `Updated Location - Beta -${Date.now()}-${i}` ;
     
     const updates = { Name: namePrefix };
     const updateResponse = await request('/api/locations/' + id, 'PUT', updates);
   }

    // 10. Test DELETE Operation on Locations
    console.log('\n--- Testing New LocationController DELETE ---');
    if (selectedLocations.length > 0) {
      const LOC_DELETE_ID = selectedLocations[0].ID;
      const locDeleteResponse = await request('/api/locations/' + LOC_DELETE_ID, 'DELETE');
      console.log('Location deleted successfully!');
    }

    // 11. TEST HIERARCHICAL LOOKUPS (NEW)
    


    // 11b. Test Location Hierarchies - Find Child Locations under a Parent Location
    console.log('\n--- Testing NEW LocationController GET /children ---');
    if (selectedLocations.length > 0) {
      const PARENT_LOCATION_ID = selectedLocations[1].ID;
      const childrenResponse = await request(`/api/locations/${PARENT_LOCATION_ID}/children`, 'GET');
      console.log(`Location Hierarchy: Found ${childrenResponse ? childrenResponse.length : 0} child locations.`);
    }
// Add at the end of main() in oop/test.js

console.log('\n--- Testing NEW UserController ---');
console.log('\n--- Testing Register ---');
const registerPayload = { 
    Username: `testuser-${Date.now()}`, 
    Password: 'password123', 
    Role: 'User'
};
const registerResponse = await request('/api/auth/register', 'POST', registerPayload);
console.log(`Register Result:`, registerResponse ? registerResponse.message : 'Failed');


console.log('\n--- Testing Login ---');

console.log(`Login Result:`, loginResponse ? `Token: ${loginResponse.token}` : 'Failed');


console.log('\n--- Testing Read Users ---');
const usersResponse = await request('/api/users', 'GET');
console.log(`Users List:`, usersResponse ? `Found ${usersResponse.length} users` : 'Failed');
console.log('\n--- Testing NEW GroupController ---');


console.log('\n--- Testing GroupController GET (All Groups) ---');
const groupsResponse = await request('/api/groups', 'GET');
console.log(`Groups List:`, groupsResponse ? `Found ${groupsResponse.length} groups` : 'Failed');


console.log('\n--- Testing GroupController POST (Create Group) ---');
const createGroupPayload = { Name: `TestGroup-${Date.now()}`, Description: 'Test description', parentGroup: null };
const groupPostResponse = await request('/api/groups', 'POST', createGroupPayload);
console.log(`Group Create Result:`, groupPostResponse ? `Success: ${groupPostResponse.success}` : 'Failed');


// Test Update Group
console.log('\n--- Testing GroupController PUT (Update Group) ---');
if (groupsResponse && groupsResponse.length > 0) {
    const groupId = groupsResponse[0].ID;
    const updateGroupPayload = { Name: `Updated ${createGroupPayload.Name}` };
    const groupPutResponse = await request(`/api/groups/${groupId}`, 'PUT', updateGroupPayload);
    console.log(`Group Update Result:`, groupPutResponse ? 'Success' : 'Failed');
}


// Test Delete Group
console.log('\n--- Testing GroupController DELETE ---');
if (groupsResponse && groupsResponse.length > 0) {
    const groupId = groupsResponse[0].ID;
    const groupDeleteResponse = await request(`/api/groups/${groupId}`, 'DELETE');
    console.log(`Group Delete Result:`, groupDeleteResponse ? 'Success' : 'Failed');
}


console.log('\n--- Testing GroupController GET /children ---');
// Test with existing group ID (you'll need to create a parent-child relationship first)
const childGroupsResponse = await request('/api/groups/00000000-0000-0000-0000-000000000000/children', 'GET');
console.log(`Child Groups: Found ${childGroupsResponse ? childGroupsResponse.length : 0} groups`);


console.log('\n--- Testing NEW RoleController ---');


console.log('\n--- Testing RoleController GET (All Roles) ---');
const rolesResponse = await request('/api/roles', 'GET');
console.log(`Roles List:`, rolesResponse ? `Found ${rolesResponse.length} roles` : 'Failed');


console.log('\n--- Testing RoleController POST (Create Role) ---');
const createRolePayload = { Name: `TestRole-${Date.now()}`, Description: 'Test description', parentRole: null };
const rolePostResponse = await request('/api/roles', 'POST', createRolePayload);
console.log(`Role Create Result:`, rolePostResponse ? `Success: ${rolePostResponse.success}` : 'Failed');


// Test Update Role
console.log('\n--- Testing RoleController PUT (Update Role) ---');
if (rolesResponse && rolesResponse.length > 0) {
    const roleId = rolesResponse[0].ID;
    const updateRolePayload = { Name: `Updated ${createRolePayload.Name}` };
    const rolePutResponse = await request(`/api/roles/${roleId}`, 'PUT', updateRolePayload);
    console.log(`Role Update Result:`, rolePutResponse ? 'Success' : 'Failed');
}


// Test Delete Role
console.log('\n--- Testing RoleController DELETE ---');
if (rolesResponse && rolesResponse.length > 0) {
    const roleId = rolesResponse[0].ID;
    const roleDeleteResponse = await request(`/api/roles/${roleId}`, 'DELETE');
    console.log(`Role Delete Result:`, roleDeleteResponse ? 'Success' : 'Failed');
}


console.log('\n--- Testing RoleController GET /children ---');
// Test with existing role ID (you'll need to create a parent-child relationship first)
const childRolesResponse = await request('/api/roles/00000000-0000-0000-0000-000000000000/children', 'GET');
console.log(`Child Roles: Found ${childRolesResponse ? childRolesResponse.length : 0} roles`);

    console.log('\n--- Test Suite Complete ---\n'); 
}


main().catch(err => {
    console.error('Fatal error in test script:', err);
});
