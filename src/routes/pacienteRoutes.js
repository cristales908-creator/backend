const express = require('express');
const router = express.Router();
const { allowRoles, requireAuth } = require('../middleware/auth');
const pacienteController = require('../controllers/pacienteController');

router.use(requireAuth);

router.get('/', pacienteController.listar);
router.post('/', allowRoles('Enfermera', 'Nutricionista'), pacienteController.crear);
router.put('/:id/alta', allowRoles('Enfermera', 'Nutricionista'), pacienteController.darAlta);
router.put('/:id/reingreso', allowRoles('Enfermera', 'Nutricionista'), pacienteController.reingresar);
router.get('/:id/consumos', pacienteController.listarConsumos);

module.exports = router;