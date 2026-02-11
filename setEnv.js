const fs = require('fs');

/**
 * Default environment configuration content for API server settings.
 * @type {string}
 */
const defaultEnvContent = `
### API Server Configuration
#### Save these variables in /.env
The following environment variables are used to configure the application:
PORT=
#    API server listening port.
#    Default: 3001

### DB Config
DB_USER=homeinvuser
#
#    DB username for read/write access
DB_PASSWORD=homeinvpassword
#
#    Password to login as DB_USER
DB_SERVER=localhost
#
#    DB server URL
#    Example: sql.example.tld
#    Example: localhost
DB_DATABASE=homeinv
#
#    Your database name
DB_TYPE=MSSQL
#
#    Options: mssql, oracle, mariadb, postgres

### JWT Configuration
JWT_SECRET=YOURSECRETKEY
#
#    Example: your_secret_key
TOKEN_EXPIRY='1h'
#
#    Example: '8h'
#    Default: '1h'

### LDAP Config
LDAP_URL=ldap://localhost
#
#    Example: ldap://example.tld
LDAP_DOMAIN_COMPONENTS=
#
#    Example: 'cn=users,dc=example,dc=tld'
LDAP_USER_ATTRIBUTE='cn=users,dc=example,dc=tld'
#
#    Example: 'cn'
`;

/**
 * Default environment configuration content for React client settings.
 * @type {string}
 */
const defaultClientEnvContent = `
### React App Config
#Save these variables client folder - default /client/.env
### API Config
REACT_APP_API_URL=http://localhost:3001
#
#    URL to reach your API backend. This is relative to your client, not the frontend server.
#    Example: http://homeinv.example.tld/api:3001

### Footer details
REACT_APP_SUPPORT_CONTACT=admin@example.mail
#    
#    Example: "Me"
#    Example: "admin@example.tld"
#REACT_APP_FOOTER_IMG_URL=http://example.tld/footer.png
#
#    Example: http://example.tld/footer.png
`;

/**
 * Path to the server environment file.
 * @type {string}
 */
const envPath = process.env.ENV_PATH || './.env';

/**
 * Path to the client environment file.
 * @type {string}
 */
const clientEnvPath = process.env.CLIENT_ENV_PATH || './client/.env';

/**
 * Checks if the server environment file exists and creates it with default values if not.
 */
if (!fs.existsSync(envPath)) {
    console.log('.env file not found, creating one with default values...');
    fs.writeFileSync(envPath, defaultEnvContent);
} else {
    console.log('.env file already exists.');
}

/**
 * Checks if the client environment file exists and creates it with default values if not.
 */
if (!fs.existsSync(clientEnvPath)) {
    console.log('.env file not found, creating one with default values...');
    fs.writeFileSync(clientEnvPath, defaultClientEnvContent);
} else {
    console.log('./client/.env file already exists.');
}