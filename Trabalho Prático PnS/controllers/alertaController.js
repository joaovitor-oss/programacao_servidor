const { Router } = require('express');
const router = Router();
const Alerta = require('../models/alerta');

// GET /alertas — Listar todos os alertas (com os dados do lote e da medição cruzados)
router.get('/', async (req, res) => {
    try {
        const alertas = await Alerta.find()
            .populate('loteCultivoId')
            .populate('medicaoAmbientalId');
        res.status(200).json(alertas);
    } catch (err) {
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// GET /alertas/:id — Obter um alerta específico
router.get('/:id', async (req, res) => {
    try {
        const alerta = await Alerta.findById(req.params.id)
            .populate('loteCultivoId')
            .populate('medicaoAmbientalId');
            
        if (!alerta) return res.status(404).json({ erro: 'Alerta não encontrado' });
        res.status(200).json(alerta);
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ erro: 'ID inválido' });
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// POST /alertas — Criar um alerta
router.post('/', async (req, res) => {
    try {
        const novoAlerta = await Alerta.create(req.body);
        res.status(201).json(novoAlerta);
    } catch (err) {
        if (err.name === 'ValidationError') {
            const mensagens = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ erros: mensagens });
        }
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// PUT /alertas/:id — Atualizar/Tratar um alerta
router.put('/:id', async (req, res) => {
    try {
        const dadosAtualizados = req.body;

        // [Regra de Negócio]: Exigir justificação ao fechar ou ignorar um alerta
        if ((dadosAtualizados.estado === 'resolvido' || dadosAtualizados.estado === 'ignorado') && !dadosAtualizados.justificacao) {
            return res.status(400).json({ 
                erro: "Erro de Negócio: Para alterar o estado para 'resolvido' ou 'ignorado', é obrigatório inserir uma justificação." 
            });
        }

        const alertaAtualizado = await Alerta.findByIdAndUpdate(
            req.params.id,
            dadosAtualizados,
            { new: true, runValidators: true }
        ).populate('loteCultivoId').populate('medicaoAmbientalId');

        if (!alertaAtualizado) return res.status(404).json({ erro: 'Alerta não encontrado' });
        res.status(200).json(alertaAtualizado);
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ erro: 'ID inválido' });
        if (err.name === 'ValidationError') {
            const mensagens = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ erros: mensagens });
        }
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// DELETE /alertas/:id — Eliminar um alerta
router.delete('/:id', async (req, res) => {
    try {
        const alertaEliminado = await Alerta.findByIdAndDelete(req.params.id);
        if (!alertaEliminado) return res.status(404).json({ erro: 'Alerta não encontrado' });
        res.status(204).send();
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ erro: 'ID inválido' });
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

module.exports = router;