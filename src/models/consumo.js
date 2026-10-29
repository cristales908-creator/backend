const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Consumo = sequelize.define('Consumo', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    cantidad: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 1
    },
    pacienteId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    alimentoId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'consumos',
    timestamps: false
});

module.exports = Consumo;