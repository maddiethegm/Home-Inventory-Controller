// invRoutes.js

require('dotenv').config();
const generateUUID = require('uuid').v4;
const queryExecutor = require('./services/dbconnector/queryExecutor');
const { logTransaction } = require('./services/logger');
const { authenticateToken } = require('./services/authMiddleware');

/**
 * Sets up inventory routes for app.
 *
 * @param {import('express').Application} app - The Express application object.
 * @param {object} config - Configuration settings for the database connection.
 */
function setupInvRoutes(app, config) {
    /**
     * Route to get inventory items based on query parameters.
     * Next up-to-do: filter by multiple columns
     *
     * @route GET /api/inventory
     * @param {string} req.query.filterColumn - The column to filter by.
     * @param {string} req.query.searchValue - The value to search for.
     * @param {boolean} req.query.exactMatch - Whether to perform an exact match.
     */
    app.get('/api/inventory', authenticateToken, async (req, res) => {
        try {
            const params = req.query;
            const table = 'Items';
            const operation = 'READ';
            const result = await queryExecutor.executeQuery(table, operation, params);
            res.json(result);
            if (process.env.LOGGING === 'high') {
                logTransaction(req.route.path, req.query, req.user ? req.user.Username : null);
            }
            console.log(result);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Database query failed' });
        }
    });

    /**
     * Route to update an inventory item.
     *
     * @route PUT /api/inventory/:ID
     * @param {string} req.params.ID - The ID of the item to update.
     * @param {object} req.body - The updated item data.
     */
    app.put('/api/inventory/:ID', authenticateToken, async (req, res) => {
        try {
            const { ID } = req.params;
            const { Name, Description, Location, Bin, Quantity, Image, Owner } = req.body;
            const params = { ID, Name, Description, Location, Bin, Quantity, Image, Owner };
            const table = 'Items';
            const operation = 'UPDATE';
            await queryExecutor.executeQuery(table, operation, params);
            res.json({ success: true });
            params['OPER'] = operation;
            const path = 'PUT ' + req.route.path;
            const neatPath = path.slice(0, path.length - 3) + ID;
            logTransaction(neatPath, params, req.user ? req.user.Username : null);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Database update failed' });
        }
    });

    /**
     * Route to delete an inventory item.
     *
     * @route DELETE /api/inventory/:ID
     * @param {string} req.params.ID - The ID of the item to delete.
     */
    app.delete('/api/inventory/:ID', authenticateToken, async (req, res) => {
        try {
            const { ID } = req.params;
            const params = { ID };
            const table = 'Items';
            const operation = 'DELETE';
            await queryExecutor.executeQuery(table, operation, params);
            res.json({ success: true });
            logTransaction(req.route.path + ID, req.query, req.user ? req.user.Username : null);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Database deletion failed' });
        }
    });

    /**
     * Route to add a new inventory item.
     *
     * @route POST /api/inventory
     * @param {object} req.body - The new item data.
     */
    app.post('/api/inventory', authenticateToken, async (req, res) => {
        try {
            const { Name, Description, Location, Bin, Quantity, Image, Owner } = req.body;
            const ID = generateUUID();
            const params = { ID, Name, Description, Location, Bin, Quantity, Image, Owner };
            const table = 'Items';
            const operation = 'CREATE';
            await queryExecutor.executeQuery(table, operation, params);
            res.status(201).json({ success: true });
            const path = 'POST ' + req.route.path;
            const neatPath = path.slice(0, path.length - 3) + ID;
            logTransaction(neatPath, params, req.user ? req.user.Username : null);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Database insertion failed' });
        }
    });

    /**
     * Route to get locations based on query parameters.
     *
     * @route GET /api/locations
     * @param {string} req.query.filterColumn - The column to filter by.
     * @param {string} req.query.searchValue - The value to search for.
     * @param {boolean} req.query.exactMatch - Whether to perform an exact match.
     */
    app.get('/api/locations', authenticateToken, async (req, res) => {
        try {
            const params = req.body;
            const table = 'Locations';
            const operation = 'READ';
            const result = await queryExecutor.executeQuery(table, operation, params);
            res.json(result);
            if (process.env.LOGGING === 'high') {
                logTransaction(req.route.path, req.query, req.user ? req.user.Username : null);
            }
            console.log(result);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Database query failed' });
        }
    });

    /**
     * Route to update a location.
     *
     * @route PUT /api/locations/:ID
     * @param {string} req.params.ID - The ID of the location to update.
     * @param {object} req.body - The updated location data.
     */
    app.put('/api/locations/:ID', authenticateToken, async (req, res) => {
        try {
            const { ID } = req.params;
            const { Name, Description, Building, Owner, Image } = req.body;
            const params = { ID, Name, Description, Building, Owner, Image };
            const table = 'Locations';
            const operation = 'UPDATE';
            await queryExecutor.executeQuery(config, query, { ID, Name, Description, Building, Owner, Image });
            res.json({ success: true });
            logTransaction(req.route.path, req.query, req.user ? req.user.Username : null);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Database update failed' });
        }
    });

    /**
     * Route to delete a location.
     *
     * @route DELETE /api/locations/:ID
     * @param {string} req.params.ID - The ID of the location to delete.
     */
    app.delete('/api/locations/:ID', authenticateToken, async (req, res) => {
        try {
            const { ID } = req.params;
            const params = { ID };
            const table = 'Locations';
            const operation = 'DELETE';
            await queryExecutor.executeQuery(table, operation, params);
            res.json({ success: true });
            logTransaction(config, req.route.path, `delete ${ID}`, req.user ? req.user.Username : null);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Database deletion failed' });
        }
    });

    /**
     * Route to add a new location.
     *
     * @route POST /api/locations
     * @param {object} req.body - The new location data.
     */
    app.post('/api/locations', authenticateToken, async (req, res) => {
        try {
            const { Name, Description, Building, Owner } = req.body;
            const ID = generateUUID();
            const params = { ID, Name, Description, Building, Owner };
            const table = 'Locations';
            const operation = 'CREATE';
            await queryExecutor.executeQuery(table, operation, params);
            res.status(201).json({ success: true });
            logTransaction(req.route.path, req.query, req.user ? req.user.Username : null);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Database insertion failed' });
        }
    });
}

module.exports = setupInvRoutes;
