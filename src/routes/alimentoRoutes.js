const express = require('express');
const router = express.Router();
const Alimento = require('../models/alimento');
const HistorialAlmacen = require('../models/historialAlmacen');
const sequelize = require('../config/database');
const { allowRoles, requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', async (req, res) => {
    try {
        const alimentos = await Alimento.findAll({
            order: [['fecha_vencimiento', 'ASC']]
        });
        res.json(alimentos || []);
    } catch (err) {
        console.error("Error al obtener alimentos:", err.message);
        res.status(500).json([]);
    }
});

router.post('/', allowRoles('Enfermera', 'Nutricionista'), async (req, res) => {
    const { nombre, cantidad_actual, unidad_medida, fecha_ingreso, fecha_vencimiento } = req.body;
    const cantidad = Number(cantidad_actual);
    if (typeof nombre !== 'string' || !nombre.trim()
        || typeof unidad_medida !== 'string' || !unidad_medida.trim()
        || !Number.isFinite(cantidad) || cantidad <= 0) {
        return res.status(400).json({ error: 'Nombre, unidad y una cantidad positiva son obligatorios.' });
    }

    let transaction;
    try {
        transaction = await sequelize.transaction();
        const nuevoAlimento = await Alimento.create({
            nombre: nombre.trim(),
            cantidad_actual: cantidad,
            unidad_medida: unidad_medida.trim(),
            fecha_ingreso: fecha_ingreso || null,
            fecha_vencimiento: fecha_vencimiento || null
        }, { transaction });

        await HistorialAlmacen.create({
            usuario_id: req.user.id,
            usuario_nombre: req.user.nombre,
            usuario_rol: req.user.rol,
            alimento_nombre: nuevoAlimento.nombre,
            accion: 'INGRESO',
            cantidad
        }, { transaction });

        await transaction.commit();
        res.status(201).json(nuevoAlimento);
    } catch (err) {
        if (transaction && !transaction.finished) await transaction.rollback();
        console.error("Error al registrar alimento:", err.message);
        res.status(500).json({ error: 'No se pudo registrar el alimento.' });
    }
});

router.post('/consumo', (req, res) => {
    res.status(410).json({ error: 'El consumo por gramos fue reemplazado por la asignación de menús.' });
});

module.exports = router;