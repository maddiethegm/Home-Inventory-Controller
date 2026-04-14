// /services/dbconnector/queryConstructor.js

/**
 * Generates a SQL query string based on table, operation, and parameters.
 *
 * @param {string} table - The name of the database table.
 * @param {string} operation - CRUD operation (e.g., 'CREATE', 'READ').
 * @param {Object} params - Parameters for the SQL query.
 * @returns {Promise<string>} A promise that resolves with the constructed SQL query string.
 */
async function generateQuery(config, table, operation, params) {
    const { DB_TYPE } = config;
    let query = '';

    switch (operation.toUpperCase()) {
        case 'CREATE':
            validateCreateParams(params);
            query = generateCreateQuery(DB_TYPE, table, params); 
            break;
        case 'READ':
            validateReadParams(params);
            query = generateReadQuery(DB_TYPE, table, params);
            break;
        case 'UPDATE':
            validateUpdateParams(params);
            query = generateUpdateQuery(DB_TYPE, table, params);
            break;
        case 'DELETE':
            validateDeleteParams(params);
            query = generateDeleteQuery(DB_TYPE, table, params);
            break;
/*        case 'COMPARE':
            validateCompareParams(params);
            query = generateCompareQuery(DB_TYPE, table, params);
            break; */
        case 'TEST':
            query = generateTestQuery(DB_TYPE);
            break;
        default:
            throw new Error('Unsupported operation');
    }

    return query;
}
/*
/**
 * Validates parameters for CREATE operation.
 *
 * @param {Object} params - Parameters for the SQL query.
 */
function validateCreateParams(params) {
    if (!params || typeof params !== 'object' || Object.keys(params).length === 0) {
        throw new Error('Missing or invalid parameters for CREATE operation. Please provide a non-empty object with necessary fields.');
    }
}

/**
 * Validates parameters for READ operation.
 *
 * @param {Object} params - Parameters for the SQL query.
 */
function validateReadParams(params) {
    if (params && typeof params !== 'object') {
        throw new Error('Missing or invalid parameters for READ operation. Please provide an object with "ID" field.');
    }
}

/**
 * Validates parameters for UPDATE operation.
 *
 * @param {Object} params - Parameters for the SQL query.
 */
function validateUpdateParams(params) {
    if (!params || typeof params !== 'object' || !params.ID || Object.keys(params).length <= 1) {
        throw new Error('Missing or invalid parameters for UPDATE operation. Please provide an object with "ID" field and at least one other field to update.');
    }
}

/**
 * Validates parameters for DELETE operation.
 *
 * @param {Object} params - Parameters for the SQL query.
 */
function validateDeleteParams(params) {
    if (!params || typeof params !== 'object' || !params.ID) {
        throw new Error('Missing or invalid parameters for DELETE operation. Please provide an object with "ID" field.');
    }
}

/**
 * Validates parameters for COMPARE operation.
 *
 * @param {Object} params - Parameters for the SQL query.
 *
function validateCompareParams(params) {
    if (!params || typeof params !== 'object' || !params.compareTable || !params.idField) {
        throw new Error('Missing or invalid parameters for COMPARE operation. Please provide an object with "compareTable" and "idField" fields.');
    }
}*/ 

/**
 * Generates a CREATE SQL query string based on database type, table, and parameters.
 *
 * @param {string} dbType - Type of database (e.g., 'MSSQL', 'ORACLE').
 * @param {string} table - The name of the database table.
 * @param {Object} params - Parameters for the SQL query.
 * @returns {string} The constructed CREATE SQL query string.
 */
function generateCreateQuery(dbType, table, params) {
    const columns = Object.keys(params).join(', ');

    // Generate placeholders based on dbType
    let placeholders;
    switch (dbType.toUpperCase()) {
        case 'MSSQL':
            placeholders = Object.keys(params)
                .map(key => `@${key}`)
                .join(', ');
            break;
        case 'MARIADB':
            placeholders = Object.keys(params).map(() => `?`).join(', '); // Use ? for MariaDB
            break;
        default:
            throw new Error('Unsupported database type for this operation!');     
    }

    return `INSERT INTO ${table} (${columns}) VALUES (${placeholders});`;
}

/**
 * Generates a READ SQL query string based on database type, table, and parameters.
 *
 * @param {string} dbType - Type of database (e.g., 'MSSQL', 'ORACLE').
 * @param {string} table - The name of the database table.
 * @param {Object} params - Parameters for the SQL query.
 * @returns {string} The constructed READ SQL query string.
 */
function generateReadQuery(dbType, table, params) {
    // Start with the basic SELECT statement
    let query = `SELECT * FROM ${table}`;

    // Prepare an array to hold WHERE conditions
    const whereConditions = [];

    for (const key in params) {
        if (params[key]) {
            let condition;
            if (key === 'partialMatch') continue; // Skip the partialSearch flag

            switch (dbType.toUpperCase()) {
                case 'MSSQL':
                    if (params.partialMatch) {
                        condition = `${key} LIKE '%' + @${key} + '%'`;
                        params[key] = `%${params[key]}%`; // Add % wildcard in params
                    } else {
                        condition = `${key} = @${key}`;
                    }
                    break;
                case 'MARIADB':
                    if (params.partialMatch) {
                        condition = `${key} LIKE ?`;
                        params[key] = `%${params[key]}%`; // Add % wildcard in params
                    } else {
                        condition = `${key} = ?`;
                    }
                    break;
                default:
                    throw new Error('Unsupported database type');
            }

            whereConditions.push(condition);
        }
    }

    // If there are any WHERE conditions, append them to the query
    if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    return query;
}

/**
 * Generates a UPDATE SQL query string based on database type, table, and parameters.
 *
 * @param {string} dbType - Type of database (e.g., 'MSSQL', 'ORACLE').
 * @param {string} table - The name of the database table.
 * @param {Object} params - Parameters for the SQL query.
 * @returns {Promise<string>} The constructed UPDATE SQL query string.
 */
async function generateUpdateQuery(dbType, table, params) {
    const updateClause = Object.keys(params)
        .filter(key => key !== 'ID') // Exclude ID from update clause
        .map(key => {
            switch (dbType.toUpperCase()) {
                case 'MSSQL':
                    return `${key} = @${key}`;
                case 'POSTGRES':
                    return `${key} = $1`;
                case 'MARIADB':
                    return `${key} = ?`;
                default:
                    throw new Error('Unsupported database type');
            }
        })
        .join(', ');

    let whereClause;
    switch (dbType.toUpperCase()) {
        case 'MSSQL':
            whereClause = `WHERE ID = @ID`;
            break;
        case 'MARIADB':
            whereClause = `WHERE ID = ?`;
            break;
        default:
            throw new Error('Unsupported database type');
    }

    return `UPDATE ${table} SET ${updateClause} ${whereClause};`;
}

/**
 * Generates a DELETE SQL query string based on database type, table, and parameters.
 *
 * @param {string} dbType - Type of database (e.g., 'MSSQL', 'ORACLE').
 * @param {string} table - The name of the database table.
 * @param {Object} params - Parameters for the SQL query.
 * @returns {Promise<string>} The constructed DELETE SQL query string.
 */
async function generateDeleteQuery(dbType, table, params) {
    let idParam = params.ID || 'ID';
    
    switch (dbType.toUpperCase()) {
        case 'MSSQL':
            return `DELETE FROM ${table} WHERE ID = @ID;`;
        case 'MARIADB':
            return `DELETE FROM ${table} WHERE ID = ?;`;
        default:
            throw new Error('Unsupported database type!');
    }
}

/**
 * Generates a TEST SQL query string based on database type, table, and parameters.
 *
 * @param {string} dbType - Type of database (e.g., 'MSSQL', 'ORACLE').
 * @returns {Promise<string>} The constructed DELETE SQL query string.
 */
async function generateTestQuery(dbType) {
    switch (dbType.toUpperCase()) {
        case 'MSSQL':
            return `SELECT @@SPID;`;
        case 'MARIADB':
            return `SELECT CONNECTION_ID();`;
        default:
            throw new Error('Unsupported database type!');
    }
}
module.exports = { generateQuery };
