const Tarefa = require('../models/tarefa');
const { registarAcao } = require('../utils/auditoria');

exports.listarTarefas = async (req, res) => {
    try {
        const tarefas = await Tarefa.find().populate('loteCultivoId');
        res.status(200).json(tarefas);
    } catch (err) {
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

exports.criarTarefa = async (req, res) => {
    try {
        if (req.body.estado === 'executada' && !req.body.dataExecucao) {
            req.body.dataExecucao = new Date();
        }

        const novaTarefa = await Tarefa.create(req.body);
        await registarAcao(req.utilizadorInfo.id, 'criar', 'Tarefa');
        res.status(201).json(novaTarefa);
    } catch (err) {
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

exports.atualizarTarefa = async (req, res) => {
    try {
        const dados = req.body;

        if (dados.estado === 'executada' && !dados.dataExecucao) {
            dados.dataExecucao = new Date();
        } else if (dados.estado === 'pendente') {
            dados.dataExecucao = null;
        }

        const tarefaAtualizada = await Tarefa.findByIdAndUpdate(req.params.id, dados, { new: true, runValidators: true });
        if (!tarefaAtualizada) return res.status(404).json({ erro: 'Tarefa não encontrada' });

        await registarAcao(req.utilizadorInfo.id, 'atualizar', 'Tarefa');
        res.status(200).json(tarefaAtualizada);
    } catch (err) {
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

exports.eliminarTarefa = async (req, res) => {
    try {
        const tarefaEliminada = await Tarefa.findByIdAndDelete(req.params.id);
        if (!tarefaEliminada) return res.status(404).json({ erro: 'Tarefa não encontrada' });

        await registarAcao(req.utilizadorInfo.id, 'eliminar', 'Tarefa');
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};