const { rateLimit } = require('express-rate-limit');

function createAuthRateLimiter({ windowMs, limit, message }) {
    return rateLimit({
        windowMs,
        limit,
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true,
        handler: (req, res) => res.status(429).json({ error: message })
    });
}

module.exports = { createAuthRateLimiter };