const Alerta = require('../models/alerta');
const { registarAcao } = require('../utils/auditoria');

// 📥 GET /alertas — Listar todos os alertas
exports.listarAlertas = async (req, res) => {
    try {
        const alertas = await Alerta.find()
            .populate('loteCultivoId')
            .populate('medicaoAmbientalId');
        res.status(200).json(alertas);
    } catch (err) {
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

// 📥 GET /alertas/:id — Obter um alerta específico
exports.obterAlerta = async (req, res) => {
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
};

// 📤 POST /alertas — Criar um alerta
exports.criarAlerta = async (req, res) => {
    try {
        const novoAlerta = await Alerta.create(req.body);
        
        // Injeção da Auditoria Automática
        await registarAcao(req.utilizadorInfo.id, 'criar', 'Alerta');
        
        res.status(201).json(novoAlerta);
    } catch (err) {
        if (err.name === 'ValidationError') {
            const mensagens = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ erros: mensagens });
        }
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

// ✏️ PUT /alertas/:id — Atualizar/Tratar um alerta (Com a tua Regra de Negócio)
exports.atualizarAlerta = async (req, res) => {
    try {
        const dadosAtualizados = req.body;

        // 🔥 A tua Regra de Negócio preservada na íntegra:
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

        // Injeção da Auditoria Automática (saber quem tratou o alerta)
        await registarAcao(req.utilizadorInfo.id, `atualizar_${dadosAtualizados.estado || 'dados'}`, 'Alerta');

        res.status(200).json(alertaAtualizado);
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ erro: 'ID inválido' });
        if (err.name === 'ValidationError') {
            const mensagens = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ erros: mensagens });
        }
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

// ❌ DELETE /alertas/:id — Eliminar um alerta
exports.eliminarAlerta = async (req, res) => {
    try {
        const alertaEliminado = await Alerta.findByIdAndDelete(req.params.id);
        if (!alertaEliminado) return res.status(404).json({ erro: 'Alerta não encontrado' });

        // Injeção da Auditoria Automática
        await registarAcao(req.utilizadorInfo.id, 'eliminar', 'Alerta');

        res.status(204).send();
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ erro: 'ID inválido' });
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};