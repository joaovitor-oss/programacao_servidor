const { Router } = require('express');
const router = Router();
const tarefaController = require('../controllers/tarefaController');
const { proteger, restringirA } = require('../middleware/authMiddleware');

router.get('/', proteger, tarefaController.listarTarefas);
router.post('/', proteger, restringirA('administrador', 'responsavel', 'tecnico'), tarefaController.criarTarefa);
router.put('/:id', proteger, restringirA('administrador', 'responsavel', 'tecnico'), tarefaController.atualizarTarefa);
router.delete('/:id', proteger, restringirA('administrador', 'responsavel'), tarefaController.eliminarTarefa);

module.exports = router;