// /services/dbconnector/connectionManager.js
const sql = require('mssql');
const mysql = require('mysql2/promise');

/**
 * Gets a connection based on the configured database type.
 *
 * @returns {Promise<Object>} A promise that resolves with the database connection.
 */
async function getConnection(config) {
    const dbType = config.DB_TYPE;
    const dbconfig = getDBConfig(config, dbType);

    switch (dbType) {
        case 'MSSQL':
            return await sql.connect(dbconfig);
        case 'MARIADB':
            return await mysql.createConnection(dbconfig);
        default:
            throw new Error('Unsupported database type');
    }
}

/**
 * Fetches the configuration for a specified database type from environment variables.
 *
 * @param {string} dbType - Type of database (e.g., 'MSSQL', 'ORACLE').
 * @returns {Object} The database configuration object.
 */
function getDBConfig(config, dbType) {
    switch (dbType) {
        case 'MSSQL':
            return {
                user: config.DB_USER,
                password: config.DB_PASSWORD,
                server: config.DB_SERVER,
                database: config.DB_DATABASE,
                options: {
                    encrypt: true, // for secure connection
                    trustServerCertificate: true
                }
            };
        case 'MARIADB':
            return {
                host: config.DB_SERVER,
                port: parseInt(config.DB_PORT, 10) || 3006,
                user: config.DB_USER,
                password: config.DB_PASSWORD,
                database: config.DB_DATABASE,
                namedPlaceholders: true
            };
        default:
            throw new Error('Unsupported database type');
    }
}

module.exports = { getConnection };
