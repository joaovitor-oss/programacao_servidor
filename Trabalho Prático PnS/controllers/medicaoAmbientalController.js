const MedicaoAmbiental = require('../models/medicaoAmbiental');
const Alerta = require('../models/alerta'); // Importado para gerar alertas automáticos
const { registarAcao } = require('../utils/auditoria');

// 📥 GET - Listar todas as medições ambientais
exports.listarMedicoes = async (req, res) => {
    try {
        const medicoes = await MedicaoAmbiental.find()
            .populate('loteCultivoId')
            .sort({ dataHora: -1 }); // Mostra sempre as medições mais recentes primeiro
        res.status(200).json(medicoes);
    } catch (err) {
        res.status(500).json({ erro: 'Erro interno do servidor ao listar medições.' });
    }
};

// 📥 GET por ID - Obter uma medição específica
exports.obterMedicao = async (req, res) => {
    try {
        const medicao = await MedicaoAmbiental.findById(req.params.id).populate('loteCultivoId');
        if (!medicao) return res.status(404).json({ erro: 'Medição ambiental não encontrada.' });
        res.status(200).json(medicao);
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ erro: 'ID de medição inválido.' });
        res.status(500).json({ erro: 'Erro interno do servidor ao obter medição.' });
    }
};

// 📤 POST - Registar uma nova medição (Com Motor de Alertas Automático)
exports.criarMedicao = async (req, res) => {
    try {
        const novaMedicao = await MedicaoAmbiental.create(req.body);

        // REGRA DE NEGÓCIO AUTOMÁTICA: Analisar limites ecológicos da estufa
        // Se os valores forem absurdos, o sistema gera o alerta sozinho!
        if (novaMedicao.temperatura > 35 || novaMedicao.temperatura < 12 || novaMedicao.humidade < 30) {
            await Alerta.create({
                loteCultivoId: novaMedicao.loteCultivoId,
                medicaoAmbientalId: novaMedicao._id,
                tipo: 'Anomalia Climática',
                mensagem: `Valores críticos detetados pelo sensor: Temp: ${novaMedicao.temperatura}°C, Hum: ${novaMedicao.humidade}%`,
                nivel: 'critico',
                estado: 'ativo'
            });
            console.log('🚨 [Automação] Alerta crítico gerado automaticamente devido a parâmetros fora do limite!');
        }

        // Regista na auditoria qual o utilizador (ou sensor/técnico) que inseriu os dados
        await registarAcao(req.utilizadorInfo.id, 'criar', 'MedicaoAmbiental');

        res.status(201).json(novaMedicao);
    } catch (err) {
        if (err.name === 'ValidationError') {
            const mensagens = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ erros: mensagens });
        }
        res.status(500).json({ erro: 'Erro interno do servidor ao registar medição.', detalhe: err.message });
    }
};

// ✏️ PUT - Atualizar uma medição existente
exports.atualizarMedicao = async (req, res) => {
    try {
        const medicaoAtualizada = await MedicaoAmbiental.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('loteCultivoId');

        if (!medicaoAtualizada) return res.status(404).json({ erro: 'Medição ambiental não encontrada.' });

        await registarAcao(req.utilizadorInfo.id, 'atualizar', 'MedicaoAmbiental');
        res.status(200).json(medicaoAtualizada);
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ erro: 'ID inválido.' });
        if (err.name === 'ValidationError') {
            const mensagens = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ erros: mensagens });
        }
        res.status(500).json({ erro: 'Erro interno do servidor ao atualizar medição.' });
    }
};

// ❌ DELETE - Eliminar um registo de medição
exports.eliminarMedicao = async (req, res) => {
    try {
        const medicaoEliminada = await MedicaoAmbiental.findByIdAndDelete(req.params.id);
        if (!medicaoEliminada) return res.status(404).json({ erro: 'Medição ambiental não encontrada.' });

        await registarAcao(req.utilizadorInfo.id, 'eliminar', 'MedicaoAmbiental');
        res.status(204).send();
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ erro: 'ID inválido.' });
        res.status(500).json({ erro: 'Erro interno do servidor ao eliminar medição.' });
    }
};