# Hospital System Backend

API REST de gestión hospitalaria con Node.js, Express, Sequelize y PostgreSQL.

## Desarrollo local

1. Instala Node.js y PostgreSQL.
2. Instala dependencias dentro de este repositorio:

   ```powershell
   npm install
   ```

3. Copia `.env.example` a `.env` y completa la configuración local. Genera valores aleatorios de al menos 32 bytes para `SESSION_SECRET` y `STAFF_REGISTRATION_KEY`; los valores de ejemplo son rechazados. No subas `.env` a GitHub.

   Puedes generar un secreto con `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Si PostgreSQL remoto usa una autoridad certificadora propia, configura su certificado PEM en `DB_SSL_CA`.
4. Inicia el servidor:

   ```powershell
   npm start
   ```

La API escucha en el puerto definido por `PORT` (3000 por defecto). Las pruebas se ejecutan con `npm test`. Login y registro limitan los intentos por dirección IP; para varias instancias del backend, configura un almacenamiento compartido para esos límites.

## Base de datos

Al iniciar, Umzug aplica las migraciones de `src/migrations` y guarda las versiones ejecutadas en `SequelizeMeta`. La migración inicial crea las tablas que falten sin alterar las existentes; la siguiente retira una restricción antigua de `consumos`. Agrega cambios futuros del esquema mediante nuevas migraciones revisadas y respaldos, no mediante cambios automáticos del modelo.

## Seguridad

Las rutas privadas requieren `Authorization: Bearer <token>`. Mantén `SESSION_SECRET`, `STAFF_REGISTRATION_KEY` y las credenciales de PostgreSQL solo en variables de entorno. No guardes secretos en el repositorio.

La arquitectura completa está en [`docs/architecture.md`](docs/architecture.md).