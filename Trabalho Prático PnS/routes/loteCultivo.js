const { Router } = require('express');
const router = Router();
const loteController = require('../controllers/loteController');
const { proteger, restringirA } = require('../middleware/authMiddleware');

router.get('/', proteger, loteController.listarLotes);
router.get('/:id', proteger, loteController.obterLote);
router.post('/', proteger, restringirA('administrador', 'responsavel'), loteController.criarLote);
router.put('/:id', proteger, restringirA('administrador', 'responsavel', 'tecnico'), loteController.atualizarLote);
router.delete('/:id', proteger, restringirA('administrador', 'responsavel'), loteController.eliminarLote);

module.exports = router;