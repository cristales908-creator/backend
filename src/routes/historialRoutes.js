const express = require('express');
const router = express.Router();
const HistorialInternacion = require('../models/historialInternacion');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', async (req, res) => {
    try {
        const historial = await HistorialInternacion.findAll({
            order: [['fecha_alta', 'DESC']]
        });
        res.json(historial || []);
    } catch (err) {
        console.error("Error al obtener el historial:", err.message);
        res.status(500).json({ error: 'No se pudo obtener el historial.' });
    }
});

module.exports = router;