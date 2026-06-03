const { Router } = require('express');
const router = Router();
const ervaController = require('../controllers/ervaController');
const multer = require('multer');
const { proteger, restringirA } = require('../middleware/authMiddleware');

// Configuração do Multer para guardar o ficheiro temporariamente na memória RAM
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 } // Limite de 2MB por segurança para a defesa
});

// ==========================================
// 1. ROTAS FIXAS (COLOCAR SEMPRE NO TOPO)
// ==========================================

// 📤 Rota para descarregar o CSV das ervas (GET /ervas/exportar)
router.get('/exportar', proteger, restringirA('responsavel', 'administrador'), ervaController.exportarCSV);

// 📥 Rota para importar o CSV das ervas (POST /ervas/import)
router.post('/import', proteger, restringirA('responsavel', 'administrador'), upload.single('file'), ervaController.importarCSV);

// 🔍 Rota para listar todas as ervas (GET /ervas)
router.get('/', proteger, ervaController.listarErvas);

// ➕ Rota para criar uma nova erva manualmente (POST /ervas)
router.post('/', proteger, restringirA('responsavel', 'administrador'), ervaController.criarErva);


// ==========================================
// 2. ROTAS DINÂMICAS (COLOCAR SEMPRE NO FIM)
// ==========================================

// 🔍 Rota para obter uma erva específica por ID (GET /ervas/:id)
router.get('/:id', proteger, ervaController.obterErvaPorId);

// 📝 Rota para atualizar uma erva por ID (PUT /ervas/:id)
router.put('/:id', proteger, restringirA('responsavel', 'administrador'), ervaController.atualizarErva);

// ❌ Rota para eliminar uma erva por ID (DELETE /ervas/:id)
router.delete('/:id', proteger, restringirA('responsavel', 'administrador'), ervaController.eliminarErva);

module.exports = router;