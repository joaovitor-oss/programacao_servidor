const { Router } = require('express');
const router = Router();
const utilizadorController = require('../controllers/utilizadorController');
const { proteger, restringirA } = require('../middleware/authMiddleware');

router.post('/login', utilizadorController.login);
router.get('/', proteger, restringirA('administrador', 'responsavel'), utilizadorController.listarUtilizadores);
router.get('/:id', proteger, utilizadorController.obterUtilizador);
router.post('/', proteger, restringirA('administrador'), utilizadorController.criarUtilizador);
router.put('/:id', proteger, utilizadorController.atualizarUtilizador);
router.delete('/:id', proteger, restringirA('administrador'), utilizadorController.eliminarUtilizador);

module.exports = router;