const { Router } = require('express');
const { login, me } = require('./auth.controller');
const { authRequired } = require('../../middlewares/auth');

const router = Router();

router.post('/login', login);
router.get('/me', authRequired, me);

module.exports = router;
