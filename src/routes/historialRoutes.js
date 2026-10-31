const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const historialController = require('../controllers/historialController');

router.use(requireAuth);
router.get('/', historialController.listarInternaciones);

module.exports = router;