const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Paciente = sequelize.define('Paciente', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    dni: { type: DataTypes.STRING, unique: true, allowNull: false },
    nombre: { type: DataTypes.STRING, allowNull: false },
    apellido: { type: DataTypes.STRING, allowNull: false },
    patologia: { type: DataTypes.STRING },
    dieta_asignada: { type: DataTypes.STRING },
    estado_internacion: { type: DataTypes.STRING, defaultValue: 'Internado' },
    tiene_acompanante: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
    tableName: 'pacientes',
    timestamps: false
});

module.exports = Paciente;