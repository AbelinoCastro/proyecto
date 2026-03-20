const success = (res, data, message = 'OK', statusCode = 200) => {
    return res.status(statusCode).json({
        ok: true,
        message,
        data
    });
};

const error = (res, message = 'Error interno', statusCode = 500, details = null) => {
    return res.status(statusCode).json({
        ok: false,
        message,
        details
    });
};

module.exports = { success, error };