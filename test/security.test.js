
const test = require('node:test');
const assert = require('node:assert/strict');

process.env.SESSION_SECRET = 'test-session-secret';

const { createToken, verifyToken } = require('../src/middleware/auth');
const { hashPassword, verifyPassword } = require('../src/utils/password');

test('password hashes verify and reject incorrect passwords', async () => {
	const password = 'hospital-password-123';
	const hash = await hashPassword(password);

	assert.notEqual(hash, password);
	assert.match(hash, /^scrypt\$/);
	assert.equal(await verifyPassword(password, hash), true);
	assert.equal(await verifyPassword('wrong-password', hash), false);
});

test('legacy plain-text passwords can be checked for migration', async () => {
	assert.equal(await verifyPassword('legacy-password', 'legacy-password'), true);
	assert.equal(await verifyPassword('wrong-password', 'legacy-password'), false);
});

test('session tokens reject tampering', () => {
	const token = createToken({ id: 7, nombre: 'Personal', rol: 'Enfermera' });

	assert.deepEqual(verifyToken(token), { id: 7, nombre: 'Personal', rol: 'Enfermera' });
	assert.equal(verifyToken(`${token}x`), null);
	assert.equal(verifyToken('invalid'), null);
});
