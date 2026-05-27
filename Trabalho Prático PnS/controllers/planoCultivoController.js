const { Router } = require('express');
const router = Router();
const PlanoCultivo = require('../models/planoCultivo');

// Função auxiliar para evitar repetição de código (DRY - Don't Repeat Yourself)
function validarRegrasNegocio(dados) {
    if (dados.tipo === 'regular') {
        // Valida se os campos não são nulos, indefinidos ou vazios
        if (dados.temperaturaMin === undefined || dados.temperaturaMin === null || 
            dados.temperaturaMax === undefined || dados.temperaturaMax === null) {
            return "Erro de Negócio: Planos do tipo 'regular' devem incluir os intervalos de temperatura.";
        }
    } else if (dados.tipo === 'emergencia') {
        if (!dados.tipoIntervencao || !dados.dosagem) {
            return "Erro de Negócio: Planos de 'emergencia' devem definir o tipo de intervenção e a dosagem.";
        }
    } else if (dados.tipo === 'pontual') {
        // Garante que a autorização foi explicitamente passada como true
        if (dados.autorizacaoResponsavel !== true) {
            return "Erro de Negócio: Planos 'pontual' exigem autorização explícita (true) do responsável técnico.";
        }
    }
    return null; // Sem erros
}

// POST /planos-cultivo — criar um novo plano de cultivo
router.post('/', async (req, res) => {
    try {
        // [Regra de Negócio] Aplicada também na criação!
        const erroNegocio = validarRegrasNegocio(req.body);
        if (erroNegocio) {
            return res.status(400).json({ error: erroNegocio });
        }

        const plano = await PlanoCultivo.create(req.body);
        res.status(201).json(plano);
    } catch (err) {
        if (err.name === 'ValidationError') {
            const mensagens = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ erros: mensagens });
        }
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// GET /planos-cultivo - lista todos
router.get('/', async (req, res) => {
    try {
        // .populate('ervaAromaticaId') traz os dados da erva aromática junto com o plano!
        const planos = await PlanoCultivo.find().populate('ervaAromaticaId');
        res.status(200).json(planos);
    } catch (err) {
        res.status(400).json({ error: "Erro ao obter os planos: " + err.message });
    }
});

// GET /planos-cultivo/:id - obtem um dado em específico
router.get('/:id', async (req, res) => {
    try {
        const plano = await PlanoCultivo.findById(req.params.id).populate('ervaAromaticaId');

        if (!plano) {
            return res.status(404).json({ error: "Plano de cultivo não encontrado" });
        }

        res.status(200).json(plano);
    } catch (err) {
        res.status(400).json({ error: "ID inválido ou erro na procura: " + err.message });
    }
});

// PUT /planos-cultivo/:id - atualiza um plano de cultivo existente
router.put('/:id', async (req, res) => {
    try {
        const dadosAtualizados = req.body;

        // [Regra de Negócio] Chamando a função auxiliar
        const erroNegocio = validarRegrasNegocio(dadosAtualizados);
        if (erroNegocio) {
            return res.status(400).json({ error: erroNegocio });
        }

        const planoAtualizado = await PlanoCultivo.findByIdAndUpdate(
            req.params.id,
            dadosAtualizados,
            { new: true, runValidators: true }
        ).populate('ervaAromaticaId');

        if (!planoAtualizado) {
            return res.status(404).json({ error: "Plano de cultivo não encontrado para atualizar" });
        }

        res.status(200).json(planoAtualizado);
    } catch (err) {
        res.status(400).json({ error: "Erro ao atualizar: " + err.message });
    }
});

// DELETE /planos-cultivo/:id
router.delete('/:id', async (req, res) => {
    try {
        const planoEliminado = await PlanoCultivo.findByIdAndDelete(req.params.id); 

        if (!planoEliminado) {
            return res.status(404).json({ error: "Plano de cultivo não encontrado para remover" });
        }

        res.status(204).send();
    } catch (err) {
        res.status(400).json({ error: "Erro ao eliminar: " + err.message });
    }
});

module.exports = router;