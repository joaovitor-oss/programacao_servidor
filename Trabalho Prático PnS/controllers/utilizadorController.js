const { Router } = require('express');
const router = Router();
const Utilizador = require('../models/utilizador');

// GET /utilizadores — Listar todos os utilizadores (esconde a password por segurança)
router.get('/', async (req, res) => {
    try {
        // O .select('-password') garante que a password não é enviada na resposta da API
        const utilizadores = await Utilizador.find().select('-password');
        res.status(200).json(utilizadores);
    } catch (err) {
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// GET /utilizadores/:id — Obter um utilizador específico
router.get('/:id', async (req, res) => {
    try {
        const utilizador = await Utilizador.findById(req.params.id).select('-password');
        if (!utilizador) return res.status(404).json({ erro: 'Utilizador não encontrado' });
        res.status(200).json(utilizador);
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ erro: 'ID inválido' });
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// POST /utilizadores — Criar um utilizador (Regista com validação de email único)
router.post('/', async (req, res) => {
    try {
        const novoUtilizador = await Utilizador.create(req.body);
        
        // Transforma em objeto JS para remover a password antes de enviar a resposta
        const resposta = novoUtilizador.toObject();
        delete resposta.password;
        
        res.status(201).json(resposta);
    } catch (err) {
        // Trata o erro se o email já existir na base de dados
        if (err.code === 11000) {
            return res.status(400).json({ erro: 'Este email já está a ser utilizado por outro utilizador.' });
        }
        if (err.name === 'ValidationError') {
            const mensagens = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ erros: mensagens });
        }
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// PUT /utilizadores/:id — Atualizar dados do utilizador
router.put('/:id', async (req, res) => {
    try {
        // Se tentarem atualizar a password por aqui, idealmente deveríamos encriptar, 
        // mas para já vamos focar na atualização dos dados básicos.
        const utilizadorAtualizado = await Utilizador.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).select('-password');

        if (!utilizadorAtualizado) return res.status(404).json({ erro: 'Utilizador não encontrado' });
        res.status(200).json(utilizadorAtualizado);
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ erro: 'ID inválido' });
        if (err.code === 11000) {
            return res.status(400).json({ erro: 'Este email já está a ser utilizado.' });
        }
        if (err.name === 'ValidationError') {
            const mensagens = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ erros: mensagens });
        }
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// DELETE /utilizadores/:id — Eliminar utilizador
router.delete('/:id', async (req, res) => {
    try {
        const utilizador = await Utilizador.findByIdAndDelete(req.params.id);
        if (!utilizador) return res.status(404).json({ erro: 'Utilizador não encontrado' });
        res.status(204).send();
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ erro: 'ID inválido' });
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

module.exports = router;