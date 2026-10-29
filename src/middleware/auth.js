const crypto = require('node:crypto');

const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_LIFETIME_SECONDS = 8 * 60 * 60;

function sign(value) {
    return crypto.createHmac('sha256', sessionSecret).update(value).digest();
}

function createToken(user) {
    const payload = Buffer.from(JSON.stringify({
        id: user.id,
        nombre: user.nombre,
        rol: user.rol,
        exp: Math.floor(Date.now() / 1000) + TOKEN_LIFETIME_SECONDS
    })).toString('base64url');

    return `${payload}.${sign(payload).toString('base64url')}`;
}

function verifyToken(token) {
    if (typeof token !== 'string') return null;

    const [payload, signature, extra] = token.split('.');
    if (!payload || !signature || extra) return null;

    const expected = sign(payload);
    const supplied = Buffer.from(signature, 'base64url');
    if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) return null;

    try {
        const user = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        if (!Number.isInteger(user.id) || typeof user.rol !== 'string' || user.exp <= Math.floor(Date.now() / 1000)) {
            return null;
        }
        return { id: user.id, nombre: user.nombre, rol: user.rol };
    } catch {
        return null;
    }
}

function requireAuth(req, res, next) {
    const authorization = req.get('authorization') || '';
    const match = authorization.match(/^Bearer\s+(.+)$/i);
    const user = match ? verifyToken(match[1]) : null;

    if (!user) return res.status(401).json({ error: 'Sesión inválida o vencida.' });
    req.user = user;
    next();
}

function allowRoles(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.rol)) {
            return res.status(403).json({ error: 'No tienes permisos para realizar esta acción.' });
        }
        next();
    };
}

module.exports = { allowRoles, createToken, requireAuth, verifyToken };