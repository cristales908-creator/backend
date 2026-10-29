const express = require('express');
const router = express.Router();
const Paciente = require('../models/paciente');
const Alimento = require('../models/alimento');
const Consumo = require('../models/consumo');
const HistorialInternacion = require('../models/historialInternacion');
const sequelize = require('../config/database');
const { allowRoles, requireAuth } = require('../middleware/auth');
const { DIETAS, PATOLOGIAS } = require('../utils/nutritionCatalog');

router.use(requireAuth);

router.get('/', async (req, res) => {
    try {
        const pacientes = await Paciente.findAll();
        res.json(pacientes || []);
    } catch (err) {
        console.error("Error al obtener pacientes:", err.message);
        res.status(500).json([]);
    }
});

router.get('/:id/consumos', async (req, res) => {
    const { id } = req.params;
    if (!/^\d+$/.test(id)) return res.status(400).json({ error: 'Identificador inválido.' });

    try {
        const paciente = await Paciente.findByPk(id);
        if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado.' });

        const consumos = await Consumo.findAll({
            where: { pacienteId: id },
            include: [{
                model: Alimento,
                as: 'alimento',
                attributes: ['id', 'nombre', 'unidad_medida']
            }],
            order: [['id', 'DESC']]
        });
        res.json(consumos);
    } catch (err) {
        console.error('Error al obtener consumos del paciente:', err.message);
        res.status(500).json({ error: 'No se pudieron obtener los consumos del paciente.' });
    }
});

router.post('/', allowRoles('Enfermera', 'Nutricionista'), async (req, res) => {
    const { dni, nombre, apellido, patologia, dieta_asignada, tiene_acompanante } = req.body || {};
    if (typeof dni !== 'string' || !dni.trim()
        || typeof nombre !== 'string' || !nombre.trim()
        || typeof apellido !== 'string' || !apellido.trim()
        || !PATOLOGIAS.includes(patologia)
        || !DIETAS.includes(dieta_asignada)) {
        return res.status(400).json({ error: 'DNI, nombre, apellido, patología y dieta válidos son obligatorios.' });
    }

    try {
        const nuevoPaciente = await Paciente.create({
            dni: dni.trim(),
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            patologia,
            dieta_asignada,
            tiene_acompanante: tiene_acompanante === true,
            estado_internacion: 'Internado'
        });
        res.status(201).json(nuevoPaciente);
    } catch (err) {
        console.error("Error al registrar paciente:", err.message);
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: 'El DNI del paciente ya está registrado.' });
        }
        res.status(500).json({ error: 'No se pudo registrar el paciente.' });
    }
});

router.put('/:id/alta', allowRoles('Enfermera', 'Nutricionista'), async (req, res) => {
    const { id } = req.params;
    if (!/^\d+$/.test(id)) return res.status(400).json({ error: 'Identificador inválido.' });

    let transaction;
    try {
        transaction = await sequelize.transaction();
        const paciente = await Paciente.findByPk(id, { transaction });
        if (!paciente) {
            await transaction.rollback();
            return res.status(404).json({ error: "Paciente no encontrado" });
        }
        if (paciente.estado_internacion === 'Alta') {
            await transaction.rollback();
            return res.status(409).json({ error: 'El paciente ya tiene el alta registrada.' });
        }

        paciente.estado_internacion = 'Alta';
        await paciente.save({ transaction });

        const nombreCompleto = `${paciente.nombre} ${paciente.apellido}`;

        await HistorialInternacion.create({
            paciente_id: id,
            paciente_nombre: nombreCompleto,
            estado: 'Alta',
            accion: 'Procesó Alta Médica',
            usuario_nombre: req.user.nombre,
            usuario_rol: req.user.rol
        }, { transaction });

        await transaction.commit();
        res.json({ message: "Alta registrada exitosamente en el historial general." });
    } catch (err) {
        if (transaction && !transaction.finished) await transaction.rollback();
        console.error("Error en transacción de alta:", err.message);
        res.status(500).json({ error: 'No se pudo registrar el alta.' });
    }
});

router.put('/:id/reingreso', allowRoles('Enfermera', 'Nutricionista'), async (req, res) => {
    const { id } = req.params;
    if (!/^\d+$/.test(id)) return res.status(400).json({ error: 'Identificador inválido.' });

    let transaction;
    try {
        transaction = await sequelize.transaction();
        const paciente = await Paciente.findByPk(id, { transaction });
        if (!paciente) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Paciente no encontrado.' });
        }
        if (paciente.estado_internacion !== 'Alta') {
            await transaction.rollback();
            return res.status(409).json({ error: 'El paciente no tiene un alta previa para reinternarlo.' });
        }

        paciente.estado_internacion = 'Internado';
        await paciente.save({ transaction });

        await HistorialInternacion.create({
            paciente_id: paciente.id,
            paciente_nombre: `${paciente.nombre} ${paciente.apellido}`,
            estado: 'Internado',
            accion: 'Reingreso de internación',
            usuario_nombre: req.user.nombre,
            usuario_rol: req.user.rol
        }, { transaction });

        await transaction.commit();
        res.json({ message: 'Reingreso registrado en el historial.' });
    } catch (err) {
        if (transaction && !transaction.finished) await transaction.rollback();
        console.error('Error al registrar reingreso:', err.message);
        res.status(500).json({ error: 'No se pudo registrar el reingreso.' });
    }
});

module.exports = router;