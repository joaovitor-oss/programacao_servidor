const { Router } = require('express');
const router = Router();
const LoteCultivo = require('../models/loteCultivo');
const Tarefa = require('../models/tarefa'); // Importado para validação de segurança

// GET /lotes-cultivo — Listar todos os lotes (com dados do plano integrados)
router.get('/', async (req, res) => {
    try {
        const lotes = await LoteCultivo.find().populate('planoCultivoId');
        res.status(200).json(lotes);
    } catch (err) {
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// GET /lotes-cultivo/:id — Obter um lote específico
router.get('/:id', async (req, res) => {
    try {
        const lote = await LoteCultivo.findById(req.params.id).populate('planoCultivoId');
        if (!lote) return res.status(404).json({ erro: 'Lote de cultivo não encontrado' });
        res.status(200).json(lote);
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ erro: 'ID inválido' });
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// POST /lotes-cultivo — Criar um novo lote
router.post('/', async (req, res) => {
    try {
        const dados = req.body;
        // Se não enviar a data de início, assume a data atual
        if (!dados.dataInicio) {
            dados.dataInicio = new Date();
        }

        const novoLote = await LoteCultivo.create(dados);
        res.status(201).json(novoLote);
    } catch (err) {
        if (err.name === 'ValidationError') {
            const mensagens = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ erros: mensagens });
        }
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// PUT /lotes-cultivo/:id — Atualizar dados do lote
router.put('/:id', async (req, res) => {
    try {
        const dadosAtualizados = req.body;

        // Regra: Se o estado mudar para 'concluido' ou 'comprometido' e não tiver dataFimReal, preenche automaticamente
        if ((dadosAtualizados.estado === 'concluido' || dadosAtualizados.estado === 'comprometido') && !dadosAtualizados.dataFimReal) {
            dadosAtualizados.dataFimReal = new Date();
        } else if (dadosAtualizados.estado === 'ativo') {
            dadosAtualizados.dataFimReal = null; // Limpa se voltar a ficar ativo
        }

        const loteAtualizado = await LoteCultivo.findByIdAndUpdate(
            req.params.id,
            dadosAtualizados,
            { new: true, runValidators: true }
        ).populate('planoCultivoId');

        if (!loteAtualizado) return res.status(404).json({ erro: 'Lote de cultivo não encontrado' });
        res.status(200).json(loteAtualizado);
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ erro: 'ID inválido' });
        if (err.name === 'ValidationError') {
            const mensagens = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ erros: mensagens });
        }
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// DELETE /lotes-cultivo/:id — Eliminar de forma segura
router.delete('/:id', async (req, res) => {
    try {
        // [Regra de Integridade]: Não deixa apagar o lote se houver tarefas agendadas para ele
        const tarefaVinculada = await Tarefa.findOne({ loteCultivoId: req.params.id });
        if (tarefaVinculada) {
            return res.status(400).json({ 
                erro: 'Não é possível eliminar este lote porque existem tarefas associadas a ele.' 
            });
        }

        // [Regra de Integridade]: Não deixa apagar o lote se houver um plano vinculado
        const planoVinculado = await PlanoCultivo.findOne({ loteCultivoId: req.params.id });
        if (planoVinculado) {
            return res.status(400).json({ 
                erro: 'Não é possível eliminar este lote porque existe um plano de cultivo associado a ele.' 
            });
        }

        const loteEliminado = await LoteCultivo.findByIdAndDelete(req.params.id);
        if (!loteEliminado) return res.status(404).json({ erro: 'Lote de cultivo não encontrado' });
        
        res.status(204).send();
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ erro: 'ID inválido' });
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

module.exports = router;