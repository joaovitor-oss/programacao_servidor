const { Router } = require('express');
const router = Router();
const LogAuditoria = require('../models/logAuditoria');
const Utilizador = require('../models/utilizador'); // <--- IMPORTANTE: Importar o model de Utilizador!

// GET /logs-auditoria 
router.get('/', async (req, res) => {
    try {
        const logs = await LogAuditoria.find().populate('utilizadorId', 'nome email tipo');
        res.status(200).json(logs);
    } catch (err) {
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// POST /logs-auditoria — Criar um registo de auditoria COM VALIDAÇÃO DE UTILIZADOR
router.post('/', async (req, res) => {
    try {
        const { utilizadorId } = req.body;

        // [Regra de Validação]: Verifica se o utilizador realmente existe na base de dados
        const utilizadorExiste = await Utilizador.findById(utilizadorId);
        if (!utilizadorExiste) {
            return res.status(404).json({ 
                erro: `Erro de Validação: O utilizador com o ID '${utilizadorId}' não existe no sistema.` 
            });
        }

        // Se existir, continua e cria o log normalmente
        const novoLog = await LogAuditoria.create(req.body);
        res.status(201).json(novoLog);

    } catch (err) {
        // Trata o erro caso enviem um ID com formato totalmente inválido (letras aleatórias)
        if (err.name === 'CastError') {
            return res.status(400).json({ erro: 'O formato do ID do utilizador é inválido.' });
        }
        if (err.name === 'ValidationError') {
            const mensagens = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ erros: mensagens });
        }
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

module.exports = router;