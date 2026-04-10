const oracledb = require("oracledb");

const walletPath = "C:/Users/Abelino/oracle21/proyecto-nomina/backend/wallet";

async function getConnection() {
return await oracledb.getConnection({
    user: "nomina_admin",
    password: "NominaGT_2026!",
    connectString: "proyectodb_tp",
    configDir: walletPath,
    walletLocation: walletPath,
    walletPassword: "Proyecto2026#Gt"
});
}

module.exports = getConnection;
