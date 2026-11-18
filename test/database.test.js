const test = require('node:test');
const assert = require('node:assert/strict');

process.env.DATABASE_URL = 'postgres://user:password@localhost:5432/test';
process.env.DB_SSL_MODE = 'require';

const sequelize = require('../src/config/database');

test('requiere TLS sin validar certificados autofirmados cuando DB_SSL_MODE=require', () => {
  assert.deepEqual(sequelize.options.dialectOptions.ssl, {
    rejectUnauthorized: false
  });
});
