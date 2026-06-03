const LogAuditoria = require('../models/logAuditoria');

// 📥 GET - Listar todos os logs do sistema
exports.listarLogs = async (req, res) => {
    try {
        const logs = await LogAuditoria.find().populate('utilizadorId', 'nome email tipo').sort({ dataHora: -1 });
        res.status(200).json(logs);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao listar logs de auditoria.' });
    }
};

// 📥 GET por ID - Obter um log de auditoria específico
exports.obterLog = async (req, res) => {
    try {
        const log = await LogAuditoria.findById(req.params.id).populate('utilizadorId', 'nome email tipo');
        if (!log) return res.status(404).json({ erro: 'Registo de auditoria não encontrado.' });
        res.status(200).json(log);
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ erro: 'ID de log inválido.' });
        res.status(500).json({ erro: 'Erro ao obter log de auditoria.' });
    }
};

// 📤 POST - Criar um registo de log manualmente
exports.criarLog = async (req, res) => {
    try {
        const novoLog = await LogAuditoria.create(req.body);
        res.status(201).json(novoLog);
    } catch (err) {
        res.status(400).json({ erro: 'Erro ao criar registo de auditoria.' });
    }
};

// ✏️ PUT - Atualizar um registo de log existente
exports.atualizarLog = async (req, res) => {
    try {
        const logAtualizado = await LogAuditoria.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!logAtualizado) return res.status(404).json({ erro: 'Registo de auditoria não encontrado.' });
        res.status(200).json(logAtualizado);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao atualizar log de auditoria.' });
    }
};

// ❌ DELETE - Eliminar um registo de log
exports.eliminarLog = async (req, res) => {
    try {
        const logEliminado = await LogAuditoria.findByIdAndDelete(req.params.id);
        if (!logEliminado) return res.status(404).json({ erro: 'Registo de auditoria não encontrado.' });
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao eliminar log de auditoria.' });
    }
};