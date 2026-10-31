const express = require('express');
const router = express.Router();
const { createAuthRateLimiter } = require('../middleware/authRateLimit');
const authController = require('../controllers/authController');

const registrationLimiter = createAuthRateLimiter({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    message: 'Demasiados intentos de registro. Inténtalo más tarde.'
});
const loginLimiter = createAuthRateLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    message: 'Demasiados intentos de acceso. Inténtalo más tarde.'
});

router.post('/registrar', registrationLimiter, authController.registrar);
router.post('/login', loginLimiter, authController.iniciarSesion);

module.exports = router;