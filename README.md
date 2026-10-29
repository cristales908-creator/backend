# Hospital System Backend

API REST de gestión hospitalaria con Node.js, Express, Sequelize y PostgreSQL.

## Desarrollo local

1. Instala Node.js y PostgreSQL.
2. Instala dependencias dentro de este repositorio:

   ```powershell
   npm install
   ```

3. Copia `.env.example` a `.env` y completa la configuración local. No subas `.env` a GitHub.
4. Inicia el servidor:

   ```powershell
   npm start
   ```

La API escucha en el puerto definido por `PORT` (3000 por defecto). Las pruebas se ejecutan con `npm test`.

## Base de datos

Al iniciar, `src/app.js` ejecuta `sequelize.sync({ alter: true })` y una consulta de compatibilidad para retirar una restricción antigua de `consumos`. Esto modifica el esquema automáticamente; antes de usar datos reales en producción, conviene sustituirlo por migraciones versionadas y respaldar la base.

## Seguridad

Las rutas privadas requieren `Authorization: Bearer <token>`. Mantén `SESSION_SECRET`, `STAFF_REGISTRATION_KEY` y las credenciales de PostgreSQL solo en variables de entorno. No guardes secretos en el repositorio.

La arquitectura completa está en [`docs/architecture.md`](docs/architecture.md).