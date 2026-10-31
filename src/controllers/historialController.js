const HistorialInternacion = require('../models/historialInternacion');

async function listarInternaciones(req, res) {
    try {
        const historial = await HistorialInternacion.findAll({
            order: [['fecha_alta', 'DESC']]
        });
        res.json(historial || []);
    } catch (err) {
        console.error('Error al obtener el historial:', err.message);
        res.status(500).json({ error: 'No se pudo obtener el historial.' });
    }
}

module.exports = { listarInternaciones };