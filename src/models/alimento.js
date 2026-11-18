const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Alimento = sequelize.define('Alimento', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    cantidad_actual: { type: DataTypes.FLOAT, allowNull: false },
    stock_minimo: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    unidad_medida: { type: DataTypes.STRING, allowNull: false },
    fecha_ingreso: { type: DataTypes.DATEONLY },
    fecha_vencimiento: { type: DataTypes.DATEONLY }
}, {
    tableName: 'alimentos',
    timestamps: false
});

module.exports = Alimento;