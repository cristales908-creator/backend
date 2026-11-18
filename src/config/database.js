

const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const sslMode = process.env.DB_SSL_MODE || 'verify-full';
if (!['require', 'verify-full'].includes(sslMode)) {
  throw new Error('DB_SSL_MODE debe ser "require" o "verify-full".');
}

const sequelize = process.env.DATABASE_URL 
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      protocol: 'postgres',
      dialectOptions: {
        ssl: {
          rejectUnauthorized: sslMode === 'verify-full',
          ...(process.env.DB_SSL_CA ? { ca: process.env.DB_SSL_CA.replace(/\\n/g, '\n') } : {})
        }
      },
      logging: false
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: false
      }
    );

module.exports = sequelize;