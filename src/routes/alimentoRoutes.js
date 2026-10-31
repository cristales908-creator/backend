const express = require('express');
const router = express.Router();
const { allowRoles, requireAuth } = require('../middleware/auth');
const alimentoController = require('../controllers/alimentoController');

router.use(requireAuth);
router.get('/', alimentoController.listar);
router.get('/historial', allowRoles('Enfermera', 'Nutricionista'), alimentoController.listarHistorial);
router.post('/', allowRoles('Enfermera', 'Nutricionista'), alimentoController.crear);
router.post('/consumo', alimentoController.consumoRetirado);

module.exports = router;