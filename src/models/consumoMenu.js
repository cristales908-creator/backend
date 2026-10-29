const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ConsumoMenu = sequelize.define('ConsumoMenu', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    comida: { type: DataTypes.STRING, allowNull: false },
    porciones_paciente: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    porciones_acompanante: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    pacienteId: { type: DataTypes.INTEGER, allowNull: false },
    menuId: { type: DataTypes.INTEGER, allowNull: false }
}, {
    tableName: 'consumos_menu',
    timestamps: false,
    indexes: [{ unique: true, fields: ['pacienteId', 'fecha', 'comida'] }]
});

module.exports = ConsumoMenu;