const { Router } = require('express');
const router = Router();
const MedicaoAmbiental = require('../models/medicaoAmbiental');

// GET /medicoes-ambientais — Listar todas as medições (com dados do lote incluídos)
router.get('/', async (req, res) => {
    try {
        const medicoes = await MedicaoAmbiental.find().populate('loteCultivoId');
        res.status(200).json(medicoes);
    } catch (err) {
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// GET /medicoes-ambientais/:id — Obter uma medição específica
router.get('/:id', async (req, res) => {
    try {
        const medicao = await MedicaoAmbiental.findById(req.params.id).populate('loteCultivoId');
        if (!medicao) return res.status(404).json({ erro: 'Medição ambiental não encontrada' });
        res.status(200).json(medicao);
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ erro: 'ID inválido' });
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// POST /medicoes-ambientais — Registar uma nova medição
router.post('/', async (req, res) => {
    try {
        const novaMedicao = await MedicaoAmbiental.create(req.body);
        res.status(201).json(novaMedicao);
    } catch (err) {
        if (err.name === 'ValidationError') {
            const mensagens = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ erros: mensagens });
        }
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// PUT /medicoes-ambientais/:id — Atualizar uma medição
router.put('/:id', async (req, res) => {
    try {
        const medicaoAtualizada = await MedicaoAmbiental.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('loteCultivoId');

        if (!medicaoAtualizada) return res.status(404).json({ erro: 'Medição ambiental não encontrada' });
        res.status(200).json(medicaoAtualizada);
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ erro: 'ID inválido' });
        if (err.name === 'ValidationError') {
            const mensagens = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ erros: mensagens });
        }
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// DELETE /medicoes-ambientais/:id — Eliminar uma medição
router.delete('/:id', async (req, res) => {
    try { 
        const medicaoEliminada = await MedicaoAmbiental.findByIdAndDelete(req.params.id);
        if (!medicaoEliminada) return res.status(404).json({ erro: 'Medição ambiental não encontrada' });
        res.status(204).send();
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ erro: 'ID inválido' });
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

module.exports = router;