require('dotenv').config();
const generateUUID = require('uuid').v4;
const { executeQuery } = require('./dbconnector/queryExecutor');

/**
 * Logs a transaction to the database.
 *
 * @param {string} route - The API route that was called.
 * @param {Object} requestPayload - Payload of the request.
 * @param {string} authenticatedUsername - Username of the authenticated user.
 */
async function logTransaction(route, requestPayload, authenticatedUsername) {
    try {
        const ID = generateUUID();
        const table = 'Transactions';
        const operation = 'CREATE';
        const params = {
            ID: ID,
            Route: route,
            RequestPayload: JSON.stringify(requestPayload),
            AuthenticatedUsername: authenticatedUsername || 'none'
        };
        
        await executeQuery(table, operation, params);
    } catch (err) {
        console.error('Transaction log error:', err);
    }
}

module.exports = { logTransaction };
