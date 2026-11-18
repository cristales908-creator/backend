const express = require('express');
const router = express.Router();
const { allowRoles, requireAuth } = require('../middleware/auth');
const alimentoController = require('../controllers/alimentoController');

router.use(requireAuth);
router.get('/', alimentoController.listar);
router.get('/historial', allowRoles('Enfermera', 'Nutricionista', 'Cocinera'), alimentoController.listarHistorial);
router.post('/', allowRoles('Enfermera', 'Nutricionista'), alimentoController.crear);
router.patch('/:id/stock-minimo', allowRoles('Enfermera', 'Nutricionista'), alimentoController.actualizarStockMinimo);
router.post('/consumo', allowRoles('Enfermera', 'Nutricionista', 'Cocinera'), alimentoController.consumoRetirado);

module.exports = router;