// serverConfig.js
const fs = require('fs');
const yaml = require('js-yaml');

let config; // Module-level variable to hold the configuration

/**
 * Function to set up the server configuration with optional overrides.
 * @param {Object} overrideConfig - Optional object containing config values to overwrite.
 */
function setupServerConfig(overrideConfig = {}) {
    const configPath = './config.yaml';

    if (!fs.existsSync(configPath)) {
        console.log(`Config file ${configPath} not found. Initializing with default settings.`);

        // Default configuration
        const defaultConfig = `
# API Server Configuration
PORT: 3102

# DB Config
DB_USER: testapp
DB_PASSWORD: testapp1234
DB_SERVER: localhost
DB_DATABASE: inventoryapp
DB_TYPE: MSSQL
MARIA_NAMED_PLACEHOLDERS: true

# JWT Configuration
JWT_SECRET: your_secret_key_here
TOKEN_EXPIRY: '8h'

# LDAP Config
LDAP_URL: ldap://ucs1.madshouse.xyz
LDAP_DOMAIN_COMPONENTS: 'cn=users,dc=madshouse,dc=xyz'
LDAP_USER_ATTRIBUTE: 'cn'

# Logging level
LOGGING: high
        `;

        // Write default configuration to the file
        fs.writeFileSync(configPath, defaultConfig);
    }

    if (!config) {
        // Read and parse the config file if it hasn't been loaded yet
        const configFile = fs.readFileSync(configPath, 'utf8');
        config = yaml.load(configFile);
    }

    // Merge override configuration with existing configuration
    if (Object.keys(overrideConfig).length > 0) {
        console.log('Overriding configuration with provided values.');
        config = { ...config, ...overrideConfig };

        // Write the updated configuration back to the file
        const updatedConfigYaml = yaml.dump(config);
        fs.writeFileSync(configPath, updatedConfigYaml);
    }

    return config;
}

module.exports = {
    setupServerConfig,
    getConfig: () => config // Export a function to get the current global config
};
