const express = require('express');
const { QueryTypes } = require('sequelize');
const router = express.Router();
const ConsumoMenu = require('../models/consumoMenu');
const Menu = require('../models/menu');
const Paciente = require('../models/paciente');
const sequelize = require('../config/database');
const { allowRoles, requireAuth } = require('../middleware/auth');
const { COMIDAS, DIETAS, PATOLOGIAS } = require('../utils/nutritionCatalog');

router.use(requireAuth);

function isValidDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

router.get('/opciones', (req, res) => {
    res.json({
        patologias: PATOLOGIAS,
        dietas: DIETAS,
        comidas: COMIDAS,
        nota: 'La patología no asigna automáticamente una dieta. La indicación debe ser validada por Nutrición.'
    });
});

router.get('/resumen', async (req, res) => {
    const fecha = req.query.fecha;
    if (!isValidDate(fecha)) return res.status(400).json({ error: 'La fecha debe tener formato AAAA-MM-DD.' });

    try {
        const resumen = await sequelize.query(`
            SELECT cm.comida,
                   m.id AS "menuId",
                   m.nombre,
                   m.dieta,
                   m.descripcion,
                   SUM(cm.porciones_paciente)::INTEGER AS porciones_paciente,
                   SUM(cm.porciones_acompanante)::INTEGER AS porciones_acompanante,
                   SUM(cm.porciones_paciente + cm.porciones_acompanante)::INTEGER AS total_porciones,
                   COUNT(cm.id)::INTEGER AS pacientes
            FROM consumos_menu cm
            INNER JOIN menus m ON m.id = cm."menuId"
            WHERE cm.fecha = :fecha AND m.activo = TRUE
            GROUP BY cm.comida, m.id, m.nombre, m.dieta, m.descripcion
            ORDER BY CASE cm.comida
                WHEN 'Desayuno' THEN 1
                WHEN 'Almuerzo' THEN 2
                WHEN 'Merienda' THEN 3
                WHEN 'Cena' THEN 4
                ELSE 5
            END, m.dieta, m.nombre
        `, { replacements: { fecha }, type: QueryTypes.SELECT });
        res.json(resumen);
    } catch (err) {
        console.error('Error al calcular raciones del menú:', err.message);
        res.status(500).json({ error: 'No se pudo calcular el resumen de cocina.' });
    }
});

router.get('/asignaciones', async (req, res) => {
    const fecha = req.query.fecha;
    if (!isValidDate(fecha)) return res.status(400).json({ error: 'La fecha debe tener formato AAAA-MM-DD.' });

    try {
        const asignaciones = await ConsumoMenu.findAll({
            where: { fecha },
            include: [
                { model: Paciente, as: 'paciente', attributes: ['id', 'nombre', 'apellido', 'dieta_asignada', 'tiene_acompanante'] },
                { model: Menu, as: 'menu', attributes: ['id', 'nombre', 'dieta'] }
            ],
            order: [['comida', 'ASC'], ['id', 'ASC']]
        });
        res.json(asignaciones);
    } catch (err) {
        console.error('Error al obtener asignaciones de menú:', err.message);
        res.status(500).json({ error: 'No se pudieron obtener las asignaciones.' });
    }
});

router.get('/', async (req, res) => {
    const where = { activo: true };
    if (req.query.dieta) where.dieta = req.query.dieta;

    try {
        const menus = await Menu.findAll({ where, order: [['dieta', 'ASC'], ['nombre', 'ASC']] });
        res.json(menus);
    } catch (err) {
        console.error('Error al obtener menús:', err.message);
        res.status(500).json({ error: 'No se pudieron obtener los menús.' });
    }
});

router.post('/', allowRoles('Nutricionista'), async (req, res) => {
    const { nombre, dieta, descripcion } = req.body || {};
    if (typeof nombre !== 'string' || !nombre.trim()
        || !DIETAS.includes(dieta)
        || typeof descripcion !== 'string' || !descripcion.trim()) {
        return res.status(400).json({ error: 'Nombre, dieta y composición del menú son obligatorios.' });
    }

    try {
        const menu = await Menu.create({ nombre: nombre.trim(), dieta, descripcion: descripcion.trim() });
        res.status(201).json(menu);
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: 'Ya existe un menú con ese nombre para esa dieta.' });
        }
        console.error('Error al crear menú:', err.message);
        res.status(500).json({ error: 'No se pudo crear el menú.' });
    }
});

router.post('/asignaciones', allowRoles('Enfermera', 'Nutricionista'), async (req, res) => {
    const { pacienteId, menuId, fecha, comida } = req.body || {};
    if (!Number.isInteger(Number(pacienteId)) || Number(pacienteId) <= 0
        || !Number.isInteger(Number(menuId)) || Number(menuId) <= 0
        || !isValidDate(fecha) || !COMIDAS.includes(comida)) {
        return res.status(400).json({ error: 'Paciente, menú, fecha y comida válidos son obligatorios.' });
    }

    let transaction;
    try {
        transaction = await sequelize.transaction();
        const paciente = await Paciente.findByPk(pacienteId, { transaction, lock: transaction.LOCK.UPDATE });
        const menu = await Menu.findByPk(menuId, { transaction });

        if (!paciente || !menu || !menu.activo) {
            await transaction.rollback();
            return res.status(404).json({ error: 'No se encontró el paciente o el menú está inactivo.' });
        }
        if (paciente.estado_internacion === 'Alta') {
            await transaction.rollback();
            return res.status(409).json({ error: 'No se puede asignar un menú a un paciente dado de alta.' });
        }
        if (paciente.dieta_asignada !== menu.dieta) {
            await transaction.rollback();
            return res.status(409).json({ error: 'El menú no corresponde a la dieta asignada al paciente.' });
        }

        const values = {
            menuId: menu.id,
            porciones_paciente: 1,
            porciones_acompanante: paciente.tiene_acompanante ? 1 : 0
        };
        const existing = await ConsumoMenu.findOne({
            where: { pacienteId: paciente.id, fecha, comida },
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        const assignment = existing
            ? await existing.update(values, { transaction })
            : await ConsumoMenu.create({ pacienteId: paciente.id, fecha, comida, ...values }, { transaction });

        await transaction.commit();
        res.status(existing ? 200 : 201).json(assignment);
    } catch (err) {
        if (transaction && !transaction.finished) await transaction.rollback();
        console.error('Error al asignar menú:', err.message);
        res.status(500).json({ error: 'No se pudo asignar el menú.' });
    }
});

module.exports = router;