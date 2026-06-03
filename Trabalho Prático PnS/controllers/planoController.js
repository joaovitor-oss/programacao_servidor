const PlanoCultivo = require('../models/planoCultivo');
const LoteCultivo = require('../models/loteCultivo');
const { registarAcao } = require('../utils/auditoria');

function validarRegrasNegocio(dados) {
    if (dados.tipo === 'regular') {
        if (dados.temperaturaMin === undefined || dados.temperaturaMin === null || 
            dados.temperaturaMax === undefined || dados.temperaturaMax === null) {
            return "Erro de Negócio: Planos do tipo 'regular' requerem margens térmicas de temperatura.";
        }
    } else if (dados.tipo === 'emergencia') {
        if (!dados.tipoIntervencao || !dados.dosagem) {
            return "Erro de Negócio: Planos de 'emergencia' requerem indicação de dosagem e tipo de intervenção.";
        }
    } else if (dados.tipo === 'pontual') {
        if (dados.autorizacaoResponsavel !== true) {
            return "Erro de Negócio: Planos 'pontual' necessitam do consentimento explícito do responsável técnico.";
        }
    }
    return null;
}

exports.listarPlanos = async (req, res) => {
    try {
        const planos = await PlanoCultivo.find().populate('ervaAromaticaId');
        res.status(200).json(planos);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.criarPlano = async (req, res) => {
    try {
        const erroNegocio = validarRegrasNegocio(req.body);
        if (erroNegocio) return res.status(400).json({ erro: erroNegocio });

        const plano = await PlanoCultivo.create(req.body);
        await registarAcao(req.utilizadorInfo.id, 'criar', 'PlanoCultivo');
        res.status(201).json(plano);
    } catch (err) {
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

exports.atualizarPlano = async (req, res) => {
    try {
        const erroNegocio = validarRegrasNegocio(req.body);
        if (erroNegocio) return res.status(400).json({ erro: erroNegocio });

        const planoAtualizado = await PlanoCultivo.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!planoAtualizado) return res.status(404).json({ error: "Plano de cultivo não encontrado" });

        await registarAcao(req.utilizadorInfo.id, 'atualizar', 'PlanoCultivo');
        res.status(200).json(planoAtualizado);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.eliminarPlano = async (req, res) => {
    try {
        const loteAtivo = await LoteCultivo.findOne({ planoCultivoId: req.params.id });
        if (loteAtivo) {
            return res.status(400).json({ erro: 'Não é possível eliminar este plano pois existem lotes ativos dependentes dele.' });
        }

        const planoEliminado = await PlanoCultivo.findByIdAndDelete(req.params.id);
        if (!planoEliminado) return res.status(404).json({ error: "Plano de cultivo não encontrado" });

        await registarAcao(req.utilizadorInfo.id, 'eliminar', 'PlanoCultivo');
        res.status(204).send();
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};