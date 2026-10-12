const oracledb = require('oracledb');
const path = require('path');
require('dotenv').config();

const isCloud = Boolean(process.env.WALLET_LOCATION);
const walletLocation = isCloud
    ? path.resolve(__dirname, process.env.WALLET_LOCATION)
    : undefined;

const connectionConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECTION_STRING,
    ...(isCloud ? {
        configDir: walletLocation,
        walletLocation,
        walletPassword: process.env.WALLET_PASSWORD,
    } : {}),
};

async function getConnection() {
    return oracledb.getConnection(connectionConfig);
}

async function ejecutarQuery(sql, binds = {}, options = {}) {
    const connection = await getConnection();
    try {
        return await connection.execute(sql, binds, options);
    } finally {
        await connection.close();
    }
}

module.exports = getConnection;
module.exports.getConnection = getConnection;
module.exports.ejecutarQuery = ejecutarQuery;
