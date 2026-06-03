const Utilizador = require('../models/utilizador');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { registarAcao } = require('../utils/auditoria');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ erro: 'Introduza o email e a password.' });
        }

        const utilizador = await Utilizador.findOne({ email });
        if (!utilizador) return res.status(401).json({ erro: 'Credenciais inválidas.' });

        const passwordCorreta = await bcrypt.compare(password, utilizador.password);
        if (!passwordCorreta) return res.status(401).json({ erro: 'Credenciais inválidas.' });

        const token = jwt.sign(
            { id: utilizador._id, tipo: utilizador.tipo },
            process.env.JWT_SECRET || 'chave_secreta_padrao',
            { expiresIn: '8h' }
        );

        await registarAcao(utilizador._id, 'login', 'Utilizador');

        res.status(200).json({
            token,
            utilizador: { id: utilizador._id, nome: utilizador.nome, email: utilizador.email, tipo: utilizador.tipo }
        });
    } catch (err) {
        res.status(500).json({ erro: 'Erro interno ao efetuar login.' });
    }
};

exports.listarUtilizadores = async (req, res) => {
    try {
        const utilizadores = await Utilizador.find().select('-password');
        res.status(200).json(utilizadores);
    } catch (err) {
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

exports.obterUtilizador = async (req, res) => {
    try {
        if (req.utilizadorInfo.tipo !== 'administrador' && req.utilizadorInfo.tipo !== 'responsavel' && req.utilizadorInfo.id !== req.params.id) {
            return res.status(403).json({ erro: 'Acesso Proibido. Só pode consultar o seu próprio perfil.' });
        }
        const utilizador = await Utilizador.findById(req.params.id).select('-password');
        if (!utilizador) return res.status(404).json({ erro: 'Utilizador não encontrado' });
        res.status(200).json(utilizador);
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ erro: 'ID inválido' });
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

exports.criarUtilizador = async (req, res) => {
    try {
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password, salt);

        const novoUtilizador = await Utilizador.create(req.body);
        await registarAcao(req.utilizadorInfo.id, 'criar', 'Utilizador');

        const resposta = novoUtilizador.toObject();
        delete resposta.password;
        res.status(201).json(resposta);
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ erro: 'Este email já está registado.' });
        if (err.name === 'ValidationError') {
            return res.status(400).json({ erros: Object.values(err.errors).map(e => e.message) });
        }
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

exports.atualizarUtilizador = async (req, res) => {
    try {
        if (req.utilizadorInfo.tipo !== 'administrador' && req.utilizadorInfo.id !== req.params.id) {
            return res.status(403).json({ erro: 'Não autorizado a alterar este utilizador.' });
        }

        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            req.body.password = await bcrypt.hash(req.body.password, salt);
        }

        const atualizado = await Utilizador.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).select('-password');
        if (!atualizado) return res.status(404).json({ erro: 'Utilizador não encontrado' });

        await registarAcao(req.utilizadorInfo.id, 'atualizar', 'Utilizador');
        res.status(200).json(atualizado);
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ erro: 'Este email já está em uso.' });
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

exports.eliminarUtilizador = async (req, res) => {
    try {
        if (req.utilizadorInfo.id === req.params.id) {
            return res.status(400).json({ erro: 'Não pode eliminar a sua própria conta ativa.' });
        }
        const utilizador = await Utilizador.findByIdAndDelete(req.params.id);
        if (!utilizador) return res.status(404).json({ erro: 'Utilizador não encontrado' });

        await registarAcao(req.utilizadorInfo.id, 'eliminar', 'Utilizador');
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};