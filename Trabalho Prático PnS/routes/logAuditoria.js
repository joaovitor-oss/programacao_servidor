const { Router } = require('express');
const router = Router();
const logAuditoriaController = require('../controllers/logAuditoriaController');
const { proteger, restringirA } = require('../middleware/authMiddleware');

// Apenas Administradores têm permissão para gerir diretamente a tabela de auditoria
router.get('/', proteger, restringirA('administrador'), logAuditoriaController.listarLogs);
router.get('/:id', proteger, restringirA('administrador'), logAuditoriaController.obterLog);
router.post('/', proteger, restringirA('administrador'), logAuditoriaController.criarLog);
router.put('/:id', proteger, restringirA('administrador'), logAuditoriaController.atualizarLog);
router.delete('/:id', proteger, restringirA('administrador'), logAuditoriaController.eliminarLog);

module.exports = router;