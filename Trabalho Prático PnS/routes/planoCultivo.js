const { Router } = require('express');
const router = Router();
const planoController = require('../controllers/planoController');
const { proteger, restringirA } = require('../middleware/authMiddleware');

router.get('/', proteger, planoController.listarPlanos);
router.post('/', proteger, restringirA('administrador', 'responsavel'), planoController.criarPlano);
router.put('/:id', proteger, restringirA('administrador', 'responsavel'), planoController.atualizarPlano);
router.delete('/:id', proteger, restringirA('administrador', 'responsavel'), planoController.eliminarPlano);

module.exports = router;