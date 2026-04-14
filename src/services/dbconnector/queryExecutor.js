// /services/dbconnector/queryExecutor.js

const connectionManager = require('./connectionManager');
const queryConstructor = require('./queryConstructor');
const paramLibrary = require('./paramLibrary');

/**
 * Executes a query against the configured database type.
 *
 * @param {string} table - The name of the database table.
 * @param {string} operation - CRUD operation (e.g., 'CREATE', 'READ').
 * @param {Object} config - Database configuration object.
 * @param {Object} params - Parameters for the SQL query.
 * @returns {Promise<Object>} A promise that resolves with the result of the query execution.
 */
async function executeQuery(config, table, operation, params) {
    console.log(`Executing query for ${operation.toUpperCase()} on table ${table}...`); // Debugging log
    console.log('Raw parameters:', params); // Log the raw parameters received

    const query = await queryConstructor.generateQuery(config, table, operation, params);

    let result;

    try {
        const formattedParams = await paramLibrary.formatQueryParams(config, params);
        const connection = await connectionManager.getConnection(config);

        switch (config.DB_TYPE.toUpperCase()) {
            case 'MSSQL':
                console.log('Executing MSSQL query:', query); // Debugging log
                console.log('Formatted parameters for MSSQL:', formattedParams); // Log the formatted parameters
                result = await executeMSSQLQuery(connection, query, formattedParams);
                break;
            case 'MARIADB':
                console.log('Executing MariaDB query:', query); // Debugging log
                console.log('Formatted parameters for MariaDB:', formattedParams); // Log the formatted parameters
                result = await executeMariaDBQuery(connection, query, formattedParams);
                break;
            default:
                throw new Error('Unsupported database type');
        }
    } catch (err) {
        console.error('Error executing query:', err.message);
        throw err;
    }
    switch (operation.toUpperCase()) {
        case 'READ':
            return result.recordset || [];
        case 'UPDATE':
            return { success: true, affectedRows: result.affectedRows };
        case 'DELETE':
            return { success: true, affectedRows: result.affectedRows };
        case 'CREATE':
            return { success: true };
        case 'TEST':
            return result.recordset || [];
    }
    return result;
}

async function executeMSSQLQuery(connection, query, params) {
    console.log('Binding parameters for MSSQL:', params); // Debugging log

    const request = connection.request();

    // Bind each parameter with its name and value
    for (const key in params) {
        if (params[key]) {
            request.input(key, params[key].type, params[key].value);
        }
    }

    try {
        console.log('Executing MSSQL query:', query); // Debugging log
        const result = await request.query(query);
        return { recordset: result.recordset, affectedRows: result.rowsAffected };
    } catch (error) {
        console.error('Error executing MSSQL query:', error.message);
        throw error;
    }
}

async function executeMariaDBQuery(connection, query, params) {
    try {
        // Extract parameter values in order
        const paramValues = Object.keys(params).map(key => params[key].value);

        console.log('Executing MariaDB query:', query); // Debugging log
        console.log('Binding parameters for MariaDB:', paramValues); // Debugging log

        const [result] = await connection.execute(query, paramValues);
        return { recordset: result };
    } finally {
        await connection.end();
    }
}

module.exports = { executeQuery }; 