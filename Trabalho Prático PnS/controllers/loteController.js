const LoteCultivo = require('../models/loteCultivo');
const Tarefa = require('../models/tarefa');
const MedicaoAmbiental = require('../models/medicaoAmbiental');
const { registarAcao } = require('../utils/auditoria');

exports.listarLotes = async (req, res) => {
    try {
        const lotes = await LoteCultivo.find().populate('planoCultivoId');
        res.status(200).json(lotes);
    } catch (err) {
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

exports.obterLote = async (req, res) => {
    try {
        const lote = await LoteCultivo.findById(req.params.id).populate('planoCultivoId');
        if (!lote) return res.status(404).json({ erro: 'Lote de cultivo não encontrado' });
        res.status(200).json(lote);
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ erro: 'ID inválido' });
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

exports.criarLote = async (req, res) => {
    try {
        const dados = req.body;
        if (!dados.dataInicio) dados.dataInicio = new Date();

        const novoLote = await LoteCultivo.create(dados);
        await registarAcao(req.utilizadorInfo.id, 'criar', 'LoteCultivo');

        res.status(201).json(novoLote);
    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(400).json({ erros: Object.values(err.errors).map(e => e.message) });
        }
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

exports.atualizarLote = async (req, res) => {
    try {
        const dadosAtualizados = req.body;

        if ((dadosAtualizados.estado === 'concluido' || dadosAtualizados.estado === 'comprometido') && !dadosAtualizados.dataFimReal) {
            dadosAtualizados.dataFimReal = new Date();
        } else if (dadosAtualizados.estado === 'ativo') {
            dadosAtualizados.dataFimReal = null;
        }

        const loteAtualizado = await LoteCultivo.findByIdAndUpdate(req.params.id, dadosAtualizados, { new: true, runValidators: true }).populate('planoCultivoId');
        if (!loteAtualizado) return res.status(404).json({ erro: 'Lote de cultivo não encontrado' });

        await registarAcao(req.utilizadorInfo.id, 'atualizar', 'LoteCultivo');
        res.status(200).json(loteAtualizado);
    } catch (err) {
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

exports.eliminarLote = async (req, res) => {
    try {
        const tarefaVinculada = await Tarefa.findOne({ loteCultivoId: req.params.id });
        if (tarefaVinculada) {
            return res.status(400).json({ erro: 'Integridade de Dados: Não pode apagar o lote, existem tarefas associadas.' });
        }

        const medicaoVinculada = await MedicaoAmbiental.findOne({ loteCultivoId: req.params.id });
        if (medicaoVinculada) {
            return res.status(400).json({ erro: 'Integridade de Dados: Não pode apagar o lote, este contém histórico de medições.' });
        }

        const loteEliminado = await LoteCultivo.findByIdAndDelete(req.params.id);
        if (!loteEliminado) return res.status(404).json({ erro: 'Lote de cultivo não encontrado' });
        
        await registarAcao(req.utilizadorInfo.id, 'eliminar', 'LoteCultivo');
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};