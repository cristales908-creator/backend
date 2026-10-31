module.exports = {
    async up({ context: queryInterface }) {
        const statements = [
            `CREATE TABLE IF NOT EXISTS "usuarios_sistema" (
                "id" SERIAL PRIMARY KEY,
                "dni" VARCHAR(255) NOT NULL UNIQUE,
                "nombre" VARCHAR(255) NOT NULL,
                "contrasena" VARCHAR(255) NOT NULL,
                "rol" VARCHAR(255) NOT NULL
            )`,
            `CREATE TABLE IF NOT EXISTS "pacientes" (
                "id" SERIAL PRIMARY KEY,
                "dni" VARCHAR(255) NOT NULL UNIQUE,
                "nombre" VARCHAR(255) NOT NULL,
                "apellido" VARCHAR(255) NOT NULL,
                "patologia" VARCHAR(255),
                "dieta_asignada" VARCHAR(255),
                "estado_internacion" VARCHAR(255) DEFAULT 'Internado',
                "tiene_acompanante" BOOLEAN DEFAULT FALSE
            )`,
            `CREATE TABLE IF NOT EXISTS "alimentos" (
                "id" SERIAL PRIMARY KEY,
                "nombre" VARCHAR(255) NOT NULL,
                "cantidad_actual" DOUBLE PRECISION NOT NULL,
                "unidad_medida" VARCHAR(255) NOT NULL,
                "fecha_ingreso" DATE,
                "fecha_vencimiento" DATE
            )`,
            `CREATE TABLE IF NOT EXISTS "historial_internaciones" (
                "id" SERIAL PRIMARY KEY,
                "paciente_id" INTEGER,
                "paciente_nombre" VARCHAR(255),
                "estado" VARCHAR(255),
                "accion" VARCHAR(255),
                "usuario_nombre" VARCHAR(255),
                "usuario_rol" VARCHAR(255),
                "fecha_alta" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                "usuarioId" INTEGER REFERENCES "usuarios_sistema" ("id") ON UPDATE CASCADE ON DELETE SET NULL
            )`,
            `CREATE TABLE IF NOT EXISTS "historial_almacen" (
                "id" SERIAL PRIMARY KEY,
                "usuario_id" INTEGER,
                "usuario_nombre" VARCHAR(255),
                "usuario_rol" VARCHAR(255),
                "alimento_nombre" VARCHAR(255),
                "accion" VARCHAR(255),
                "cantidad" DOUBLE PRECISION,
                "fecha" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS "menus" (
                "id" SERIAL PRIMARY KEY,
                "nombre" VARCHAR(255) NOT NULL,
                "dieta" VARCHAR(255) NOT NULL,
                "descripcion" TEXT NOT NULL,
                "activo" BOOLEAN NOT NULL DEFAULT TRUE,
                CONSTRAINT "menus_nombre_dieta_unique" UNIQUE ("nombre", "dieta")
            )`,
            `CREATE TABLE IF NOT EXISTS "consumos" (
                "id" SERIAL PRIMARY KEY,
                "cantidad" DOUBLE PRECISION NOT NULL DEFAULT 1,
                "pacienteId" INTEGER NOT NULL REFERENCES "pacientes" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
                "alimentoId" INTEGER NOT NULL REFERENCES "alimentos" ("id") ON UPDATE CASCADE ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS "consumos_menu" (
                "id" SERIAL PRIMARY KEY,
                "fecha" DATE NOT NULL,
                "comida" VARCHAR(255) NOT NULL,
                "porciones_paciente" INTEGER NOT NULL DEFAULT 1,
                "porciones_acompanante" INTEGER NOT NULL DEFAULT 0,
                "pacienteId" INTEGER NOT NULL REFERENCES "pacientes" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
                "menuId" INTEGER NOT NULL REFERENCES "menus" ("id") ON UPDATE CASCADE ON DELETE RESTRICT,
                CONSTRAINT "consumos_menu_paciente_fecha_comida_unique" UNIQUE ("pacienteId", "fecha", "comida")
            )`
        ];

        await queryInterface.sequelize.transaction(async transaction => {
            for (const statement of statements) {
                await queryInterface.sequelize.query(statement, { transaction });
            }
        });
    },
    async down() {
        throw new Error('La migración inicial no es reversible para proteger los datos existentes.');
    }
};