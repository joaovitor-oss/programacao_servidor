const { Router } = require('express');
const router = Router();
const medicaoAmbientalController = require('../controllers/medicaoAmbientalController');
const { proteger, restringirA } = require('../middleware/authMiddleware');

// Qualquer utilizador autenticado (Técnico, Responsável, Admin) pode auditar o clima da estufa
router.get('/', proteger, medicaoAmbientalController.listarMedicoes);
router.get('/:id', proteger, medicaoAmbientalController.obterMedicao);

// Inserção de dados de sensores pode ser feita por Técnicos ou Administradores
router.post('/', proteger, restringirA('administrador', 'tecnico'), medicaoAmbientalController.criarMedicao);

// Modificar medições antigas é uma ação sensível (Apenas gestores seniores: Admin e Responsável)
router.put('/:id', proteger, restringirA('administrador', 'responsavel'), medicaoAmbientalController.atualizarMedicao);

// Eliminar dados históricos do clima do sistema é restrito apenas ao Administrador do Sistema
router.delete('/:id', proteger, restringirA('administrador'), medicaoAmbientalController.eliminarMedicao);

module.exports = router;