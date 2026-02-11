// /services/dbconnector/paramLibrary.js

const sql = require('mssql');

// Load paramsConfig.json once at the start
let paramsConfig;
try {
    paramsConfig = require('./paramsConfig.json');
} catch (error) {
    console.error('Error reading JSON config:', error);
}

/**
 * Formats query parameters based on their keys and types, specific to each database type.
 *
 * @param {Object} params - An object containing the parameters to format.
 * @returns {Promise<Object>} A promise that resolves with formatted parameters.
 */
async function formatQueryParams(params) {
    const { DB_TYPE } = process.env;
    let formattedParams = {};

    console.log(`Formatting query parameters for ${DB_TYPE.toUpperCase()}...`); // Debugging log
    console.log('Raw params:', params); // Log the raw parameters received

    switch (DB_TYPE.toUpperCase()) {
        case 'MSSQL':
            formattedParams = formatMSSQLParams(params, paramsConfig.mssql);
            break;
        case 'ORACLE':
            formattedParams = formatOracleParams(params, paramsConfig.oracle);
            break;
        case 'MARIADB':
            formattedParams = formatMariaDBParams(params, paramsConfig.mariaDB);
            break;
        case 'POSTGRES':
            formattedParams = formatPostgresParams(params, paramsConfig.postgres);
            break;
        default:
            throw new Error('Unsupported database type');
    }

    console.log('Formatted params:', formattedParams); // Log the formatted parameters
    return formattedParams;
}

/**
 * Formats query parameters for MSSQL.
 *
 * @param {Object} params - An object containing the parameters to format.
 * @param {Object} config - Database-specific configuration from JSON.
 * @returns {Object} Formatted parameters.
 */
function formatMSSQLParams(params, config) {
    const formattedParams = {};
    for (const key in params) {
        if (!config[key]) {
            console.warn(`Parameter '${key}' not defined in the configuration.`);
            continue;
        }

        const paramConfig = config[key];
        let type;

        switch (paramConfig.type.toLowerCase()) {
            case 'uniqueidentifier':
                type = sql.UniqueIdentifier;
                break;
            case 'nvarchar':
                if (!paramConfig.maxLength) {
                    throw new Error(`Parameter '${key}' is missing maxLength in configuration.`);
                }
                type = sql.NVarChar(paramConfig.maxLength);
                break;
            case 'text':
                type = sql.Text;
                break;
            case 'int':
                type = sql.Int;
                break;
            case 'bit':
                type = sql.Bit;
                break;
            default:
                throw new Error(`Unsupported parameter type: ${paramConfig.type} for parameter '${key}'`);
        }

        formattedParams[key] = { type, value: params[key] };
    }
    return formattedParams;
}

/**
 * Formats query parameters for MariaDB.
 *
 * @param {Object} params - An object containing the parameters to format.
 * @param {Object} config - Database-specific configuration from JSON.
 * @returns {Object} Formatted parameters.
 */
function formatMariaDBParams(params, config) {
    const formattedParams = {};
    for (const key in params) {
        if (!config[key]) {
            console.warn(`Parameter '${key}' not defined in the configuration.`);
            continue;
        }

        const paramConfig = config[key];
        let type;

        switch (paramConfig.type.toLowerCase()) {
            case 'char':
                if (!paramConfig.length) {
                    throw new Error(`Parameter '${key}' is missing length in configuration.`);
                }
                type = { type: 'CHAR', length: paramConfig.length };
                break;
            case 'uuid':
                type = 'uuid';
                break;
            case 'string':
                type = 'string';
                break;
            case 'text':
                type = 'text';
                break;
            case 'int':
                type = 'int';
                break;
            case 'boolean':
                type = 'boolean';
                break;
            default:
                throw new Error(`Unsupported parameter type: ${paramConfig.type} for parameter '${key}'`);
        }

        formattedParams[key] = { type, value: params[key] };
    }
    return formattedParams;
}

/**
 * Formats query parameters for PostgreSQL.
 *
 * @param {Object} params - An object containing the parameters to format.
 * @param {Object} config - Database-specific configuration from JSON.
 * @returns {Object} Formatted parameters.
 */
function formatPostgresParams(params, config) {
    const formattedParams = {};
    for (const key in params) {
        if (!config[key]) {
            console.warn(`Parameter '${key}' not defined in the configuration.`);
            continue;
        }

        const paramConfig = config[key];
        let type;

        switch (paramConfig.type.toLowerCase()) {
            case 'uuid':
                type = 'uuid';
                break;
            case 'varchar':
                if (!paramConfig.length) {
                    throw new Error(`Parameter '${key}' is missing length in configuration.`);
                }
                type = { type: 'VARCHAR', length: paramConfig.length };
                break;
            case 'text':
                type = 'text';
                break;
            case 'int':
                type = 'int';
                break;
            case 'boolean':
                type = 'boolean';
                break;
            default:
                throw new Error(`Unsupported parameter type: ${paramConfig.type} for parameter '${key}'`);
        }

        formattedParams[key] = { type, value: params[key] };
    }
    return formattedParams;
}

module.exports = { formatQueryParams };

