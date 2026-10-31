const express = require('express');
const cors = require('cors');
const path = require('path');
const { Umzug, SequelizeStorage } = require('umzug');
const sequelize = require('./config/database');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
app.use(cors());
app.use(express.json());

// Carpeta pública para tu frontend (HTML/CSS/JS)
app.use(express.static(path.join(__dirname, '../../frontend'), { index: false }));

// ==========================================
// PASO 1: IMPORTAR LOS MODELOS Y GUARDARLOS EN CONSTANTES
// ==========================================
const Usuario = require('./models/usuario');
const HistorialInternacion = require('./models/historialInternacion');
const Paciente = require('./models/paciente');
const Alimento = require('./models/alimento');
const Consumo = require('./models/consumo');
const Menu = require('./models/menu');
const ConsumoMenu = require('./models/consumoMenu');

// ==========================================
// PASO 2: DECLARAR LAS RELACIONES (Usando las constantes de arriba)
// ==========================================
Usuario.hasMany(HistorialInternacion, { foreignKey: 'usuarioId' });
HistorialInternacion.belongsTo(Usuario, { foreignKey: 'usuarioId' });

Paciente.hasMany(Consumo, { foreignKey: 'pacienteId', as: 'consumos', onDelete: 'CASCADE' });
Consumo.belongsTo(Paciente, { foreignKey: 'pacienteId', as: 'paciente' });
Alimento.hasMany(Consumo, { foreignKey: 'alimentoId', as: 'consumos', onDelete: 'CASCADE' });
Consumo.belongsTo(Alimento, { foreignKey: 'alimentoId', as: 'alimento' });

Paciente.hasMany(ConsumoMenu, { foreignKey: 'pacienteId', as: 'menusProgramados', onDelete: 'CASCADE' });
ConsumoMenu.belongsTo(Paciente, { foreignKey: 'pacienteId', as: 'paciente' });
Menu.hasMany(ConsumoMenu, { foreignKey: 'menuId', as: 'asignaciones', onDelete: 'RESTRICT' });
ConsumoMenu.belongsTo(Menu, { foreignKey: 'menuId', as: 'menu' });

// Importar Rutas
const authRoutes = require('./routes/authRoutes');
const pacienteRoutes = require('./routes/pacienteRoutes');
const historialRoutes = require('./routes/historialRoutes');
const alimentoRoutes = require('./routes/alimentoRoutes');
const menuRoutes = require('./routes/menuRoutes');

// Enrutar endpoints
app.use('/api/auth', authRoutes);
app.use('/api/pacientes', pacienteRoutes);
app.use('/api/historial-pacientes', historialRoutes);
app.use('/api/alimentos', alimentoRoutes);
app.use('/api/menus', menuRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/login.html'));
});

const PORT = process.env.PORT || 3000;
const migrationGlob = path.join(__dirname, 'migrations', '*.js').replace(/\\/g, '/');

const migrations = new Umzug({
    migrations: { glob: migrationGlob },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize }),
    logger: console
});

async function startServer() {
    try {
        await migrations.up();
        console.log('✅ Migraciones aplicadas y conexión a la base de datos exitosa.');
        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
        });
    } catch (err) {
        console.error('❌ Error crítico al conectar o sincronizar la base de datos:', err);
        await sequelize.close().catch(() => {});
        process.exitCode = 1;
    }
}

startServer();