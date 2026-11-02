
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { once } = require('node:events');
const path = require('node:path');
const express = require('express');

process.env.SESSION_SECRET = 'test-session-secret-with-at-least-32-bytes';

const { allowRoles, createToken, verifyToken } = require('../src/middleware/auth');
const { createAuthRateLimiter } = require('../src/middleware/authRateLimit');
const { hashPassword, verifyPassword } = require('../src/utils/password');
const Usuario = require('../src/models/usuario');
const Paciente = require('../src/models/paciente');
const HistorialInternacion = require('../src/models/historialInternacion');
const Menu = require('../src/models/menu');
const ConsumoMenu = require('../src/models/consumoMenu');

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

test('session signing refuses missing or short secrets', () => {
	const result = spawnSync(process.execPath, ['-e', "require('./src/middleware/auth')"], {
		cwd: path.resolve(__dirname, '..'),
		env: { ...process.env, SESSION_SECRET: 'short' }
	});

	assert.notEqual(result.status, 0);
	assert.match(result.stderr.toString(), /SESSION_SECRET/);
});

test('role guard allows only configured roles', () => {
	let statusCode;
	let responseBody;
	let nextCalled = false;
	const response = {
		status(code) {
			statusCode = code;
			return this;
		},
		json(body) {
			responseBody = body;
			return this;
		}
	};

	allowRoles('Nutricionista')({ user: { rol: 'Cocinera' } }, response, () => { nextCalled = true; });
	assert.equal(statusCode, 403);
	assert.equal(nextCalled, false);
	assert.match(responseBody.error, /permisos/);

	allowRoles('Nutricionista')({ user: { rol: 'Nutricionista' } }, response, () => { nextCalled = true; });
	assert.equal(nextCalled, true);
});

test('auth rate limiter returns 429 after the configured limit', async t => {
	const app = express();
	app.get('/', createAuthRateLimiter({ windowMs: 60_000, limit: 2, message: 'rate limited' }), (req, res) => {
		res.status(401).json({ error: 'invalid credentials' });
	});
	const server = app.listen(0, '127.0.0.1');
	await once(server, 'listening');
	t.after(() => new Promise(resolve => server.close(resolve)));

	const url = `http://127.0.0.1:${server.address().port}/`;
	const statuses = [];
	for (let index = 0; index < 3; index += 1) {
		statuses.push((await fetch(url)).status);
	}
	assert.deepEqual(statuses, [401, 401, 429]);
});

test('Sequelize models map core tables and preserve required unique indexes', () => {
	assert.equal(Usuario.getTableName(), 'usuarios_sistema');
	assert.equal(Paciente.getTableName(), 'pacientes');
	assert.equal(Paciente.associations.historialInternaciones.target, HistorialInternacion);
	assert.equal(HistorialInternacion.associations.paciente.target, Paciente);
	assert.equal(HistorialInternacion.associations.paciente.foreignKey, 'paciente_id');
	assert.equal(Menu.getTableName(), 'menus');
	assert.equal(ConsumoMenu.getTableName(), 'consumos_menu');
	assert.deepEqual(
		Menu.options.indexes.filter(index => index.unique).map(index => index.fields),
		[['nombre', 'dieta']]
	);
	assert.deepEqual(
		ConsumoMenu.options.indexes.filter(index => index.unique).map(index => index.fields),
		[['pacienteId', 'fecha', 'comida']]
	);
});
