const { Router } = require('express');
const router = Router();
const ErvaAromatica = require('../models/ervaAromatica');
const PlanoCultivo = require('../models/planoCultivo'); // Importado para validar a integridade!

// GET /ervas-aromaticas — listar todas
router.get('/', async (req, res) => {
    try {
        const ervas = await ErvaAromatica.find();
        res.status(200).json(ervas);
    } catch (err) {
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// GET /ervas-aromaticas/:id — obter uma
router.get('/:id', async (req, res) => {
    try {
        const erva = await ErvaAromatica.findById(req.params.id);
        if (!erva) return res.status(404).json({ erro: 'Erva aromática não encontrada' });
        res.status(200).json(erva);
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ erro: 'ID inválido' });
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// POST /ervas-aromaticas — criar
router.post('/', async (req, res) => {
    try {
        const erva = await ErvaAromatica.create(req.body);
        res.status(201).json(erva);
    } catch (err) {
        // [Tratamento adicionado]: Nome duplicado (unique)
        if (err.code === 11000) {
            return res.status(400).json({ erro: 'Já existe uma erva aromática registada com esse nome.' });
        }
        if (err.name === 'ValidationError') {
            const mensagens = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ erros: mensagens });
        }
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// PUT /ervas-aromaticas/:id — atualizar
router.put('/:id', async (req, res) => {
    try {
        const erva = await ErvaAromatica.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!erva) return res.status(404).json({ erro: 'Erva aromática não encontrada' });
        res.status(200).json(erva);
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ erro: 'ID inválido' });
        // [Tratamento adicionado]: Nome duplicado ao atualizar
        if (err.code === 11000) {
            return res.status(400).json({ erro: 'Já existe uma erva aromática registada com esse nome.' });
        }
        if (err.name === 'ValidationError') {
            const mensagens = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ erros: mensagens });
        }
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// DELETE /ervas-aromaticas/:id — eliminar de forma segura
router.delete('/:id', async (req, res) => {
    try {
        // [Regra de Integridade]: Verifica se a erva está a ser usada em algum plano
        const planoVinculado = await PlanoCultivo.findOne({ ervaAromaticaId: req.params.id });
        if (planoVinculado) {
            return res.status(400).json({ 
                erro: 'Não é possível eliminar esta erva porque ela está associada a um ou mais Planos de Cultivo.' 
            });
        }

        const erva = await ErvaAromatica.findByIdAndDelete(req.params.id);
        if (!erva) return res.status(404).json({ erro: 'Erva aromática não encontrada' });
        
        res.status(204).send();
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ erro: 'ID inválido' });
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

module.exports = router;