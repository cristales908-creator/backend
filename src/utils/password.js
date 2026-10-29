const crypto = require('node:crypto');
const { promisify } = require('node:util');

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;

async function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const key = await scrypt(password, salt, KEY_LENGTH);
    return `scrypt$${salt}$${key.toString('hex')}`;
}

async function verifyPassword(password, storedPassword) {
    if (typeof storedPassword !== 'string') return false;

    if (!storedPassword.startsWith('scrypt$')) {
        const submitted = crypto.createHash('sha256').update(password).digest();
        const stored = crypto.createHash('sha256').update(storedPassword).digest();
        return crypto.timingSafeEqual(submitted, stored);
    }

    const [, salt, storedKey] = storedPassword.split('$');
    if (!salt || !/^[a-f0-9]{128}$/i.test(storedKey || '')) return false;

    const submittedKey = await scrypt(password, salt, KEY_LENGTH);
    return crypto.timingSafeEqual(submittedKey, Buffer.from(storedKey, 'hex'));
}

module.exports = { hashPassword, verifyPassword };