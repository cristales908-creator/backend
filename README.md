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

Al iniciar, Sequelize ejecuta `sequelize.sync({ alter: true })` según los modelos. Esto puede modificar columnas e índices existentes; respalda la base antes de desplegar cambios y usa migraciones revisadas para entornos con datos importantes. La sincronización no transforma los valores de negocio existentes (por ejemplo, no normaliza nombres de dietas heredados).

La migración aditiva para habitación y stock mínimo está en [`migrations/20261117_add_habitacion_and_stock_minimo.sql`](migrations/20261117_add_habitacion_and_stock_minimo.sql). Agrega `pacientes.habitacion` como nullable para preservar registros previos y `alimentos.stock_minimo` con valor predeterminado `0`.

## Seguridad

Las rutas privadas requieren `Authorization: Bearer <token>`. Mantén `SESSION_SECRET`, `STAFF_REGISTRATION_KEY` y las credenciales de PostgreSQL solo en variables de entorno. No guardes secretos en el repositorio.

La arquitectura completa está en [`docs/architecture.md`](docs/architecture.md).