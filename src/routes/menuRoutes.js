const express = require('express');
const router = express.Router();
const { allowRoles, requireAuth } = require('../middleware/auth');
const menuController = require('../controllers/menuController');

router.use(requireAuth);

router.get('/opciones', menuController.opciones);
router.get('/resumen', menuController.resumen);
router.get('/asignaciones', menuController.listarAsignaciones);
router.get('/', menuController.listar);
router.post('/', allowRoles('Nutricionista'), menuController.crear);
router.post('/asignaciones', allowRoles('Enfermera', 'Nutricionista'), menuController.asignar);

module.exports = router;