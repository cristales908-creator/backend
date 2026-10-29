const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HistorialInternacion = sequelize.define('HistorialInternacion', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    paciente_id: { type: DataTypes.INTEGER },
    paciente_nombre: { type: DataTypes.STRING },
    estado: { type: DataTypes.STRING },
    accion: { type: DataTypes.STRING },
    usuario_nombre: { type: DataTypes.STRING },
    usuario_rol: { type: DataTypes.STRING },
    fecha_alta: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    tableName: 'historial_internaciones',
    timestamps: false
});
const Usuario = require('./usuario'); // Asegúrate de importar tu modelo de usuario
Usuario.hasMany(HistorialInternacion, { foreignKey: 'usuarioId' });
HistorialInternacion.belongsTo(Usuario, { foreignKey: 'usuarioId' })

module.exports = HistorialInternacion;