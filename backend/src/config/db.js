const oracledb = require('oracledb');
require('dotenv').config();

oracledb.thin = true;

const isLocal = !process.env.WALLET_LOCATION;

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionString: process.env.DB_CONNECTION_STRING,
    poolMin: 2,
    poolMax: 10,
    poolIncrement: 1,
    ...(isLocal ? {} : {
        configDir: process.env.WALLET_LOCATION,
        walletLocation: process.env.WALLET_LOCATION,
        walletPassword: process.env.WALLET_PASSWORD
    })
};

async function initPool() {
    try {
        await oracledb.createPool(dbConfig);
        console.log(`Pool Oracle iniciado (${isLocal ? 'LOCAL' : 'CLOUD'})`);
    } catch (err) {
        console.error('Error al iniciar pool Oracle:', err);
        process.exit(1);
    }
}

async function getConnection() {
    return await oracledb.getConnection();
}

module.exports = { initPool, getConnection };