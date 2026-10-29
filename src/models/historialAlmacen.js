const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HistorialAlmacen = sequelize.define('HistorialAlmacen', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usuario_id: { type: DataTypes.INTEGER },
    usuario_nombre: { type: DataTypes.STRING },
    usuario_rol: { type: DataTypes.STRING },
    alimento_nombre: { type: DataTypes.STRING },
    accion: { type: DataTypes.STRING },
    cantidad: { type: DataTypes.FLOAT },
    fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    tableName: 'historial_almacen',
    timestamps: false
});

module.exports = HistorialAlmacen;