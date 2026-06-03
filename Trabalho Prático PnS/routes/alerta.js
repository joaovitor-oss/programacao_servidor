const { Router } = require('express');
const router = Router();
const alertaController = require('../controllers/alertaController');
const { proteger, restringirA } = require('../middleware/authMiddleware');

// Qualquer utilizador autenticado pode listar ou ver detalhes de um alerta
router.get('/', proteger, alertaController.listarAlertas);
router.get('/:id', proteger, alertaController.obterAlerta);

// Apenas perfis de gestão (Admin e Responsável) criam alertas manuais se necessário
router.post('/', proteger, restringirA('administrador', 'responsavel'), alertaController.criarAlerta);

// Técnicos, Responsáveis e Admins podem tratar/resolver alertas (todos precisam de dar a justificação)
router.put('/:id', proteger, restringirA('administrador', 'responsavel', 'tecnico'), alertaController.atualizarAlerta);

// Apenas o Administrador pode apagar permanentemente um alerta do sistema
router.delete('/:id', proteger, restringirA('administrador'), alertaController.eliminarAlerta);

module.exports = router;