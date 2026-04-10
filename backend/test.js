const { ejecutarQuery } = require('./db');
async function test() {
    try {
        const res = await ejecutarQuery('SELECT SYSDATE FROM DUAL');
        console.log(" CONEXIÓN EXITOSA. Fecha nube:", res.rows[0]);
    } catch (e) {
        console.error(" ERROR:", e.message);
    }
}
test();