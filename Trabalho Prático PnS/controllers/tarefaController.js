const { Router } = require('express');
const router = Router();
const Tarefa = require('../models/tarefa');

// GET /tarefas — Listar todas as tarefas (trazendo os dados do lote junto)
router.get('/', async (req, res) => {
    try {
        const tarefas = await Tarefa.find().populate('loteCultivoId');
        res.status(200).json(tarefas);
    } catch (err) {
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// GET /tarefas/:id — Obter uma tarefa específica
router.get('/:id', async (req, res) => {
    try {
        const tarefa = await Tarefa.findById(req.params.id).populate('loteCultivoId');
        if (!tarefa) return res.status(404).json({ erro: 'Tarefa não encontrada' });
        res.status(200).json(tarefa);
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ erro: 'ID inválido' });
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// POST /tarefas — Criar uma nova tarefa
router.post('/', async (req, res) => {
    try {
        // Se a tarefa já for criada como executada e não tiver data, define a de hoje
        if (req.body.estado === 'executada' && !req.body.dataExecucao) {
            req.body.dataExecucao = new Date();
        }

        const novaTarefa = await Tarefa.create(req.body);
        res.status(201).json(novaTarefa);
    } catch (err) {
        if (err.name === 'ValidationError') {
            const mensagens = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ erros: mensagens });
        }
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// PUT /tarefas/:id — Atualizar uma tarefa (com lógica automatizada para conclusão)
router.put('/:id', async (req, res) => {
    try {
        const dadosAtualizados = req.body;

        // [Regra de Negócio]: Se mudou o estado para 'executada' e não mandou data de execução, põe a data atual
        if (dadosAtualizados.estado === 'executada' && !dadosAtualizados.dataExecucao) {
            dadosAtualizados.dataExecucao = new Date();
        } 
        // Se voltar para 'pendente', limpa a data de execução antiga 
        else if (dadosAtualizados.estado === 'pendente') {
            dadosAtualizados.dataExecucao = null;
        }

        const tarefaAtualizada = await Tarefa.findByIdAndUpdate(
            req.params.id,
            dadosAtualizados,
            { new: true, runValidators: true }
        ).populate('loteCultivoId');

        if (!tarefaAtualizada) return res.status(404).json({ erro: 'Tarefa não encontrada' });
        res.status(200).json(tarefaAtualizada);
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ erro: 'ID inválido' });
        if (err.name === 'ValidationError') {
            const mensagens = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ erros: mensagens });
        }
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// DELETE /tarefas/:id — Eliminar tarefa
router.delete('/:id', async (req, res) => {
    try {
        const tarefaEliminada = await Tarefa.findByIdAndDelete(req.params.id); // Se a tarefa não existir, retorna 404
        if (!tarefaEliminada) return res.status(404).json({ erro: 'Tarefa não encontrada' });
        res.status(204).send();
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ erro: 'ID inválido' });
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

module.exports = router;