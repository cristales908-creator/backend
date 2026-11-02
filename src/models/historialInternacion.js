const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Paciente = require('./paciente');

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
Paciente.hasMany(HistorialInternacion, { foreignKey: 'paciente_id', as: 'historialInternaciones' });
HistorialInternacion.belongsTo(Paciente, {
    foreignKey: 'paciente_id',
    as: 'paciente',
    onDelete: 'SET NULL'
});

module.exports = HistorialInternacion;