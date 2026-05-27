// Forçar o uso de DNS público para evitar o erro ECONNREFUSED do MongoDB Atlas
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

// Carrega as variáveis de ambiente do arquivo .env (Instale com: npm i dotenv)
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');

const app = express();
// Usa a porta do ambiente (ex: Heroku/Render) ou a 3000 localmente
const port = process.env.PORT || 3000; 

const planoCultivoRouter = require('./controllers/planoCultivoController');
const ervaAromaticaRouter = require('./controllers/ervaAromaticaController');
const utilizadorRouter = require('./controllers/utilizadorController');
const tarefaRouter = require('./controllers/tarefaController');
const loteCultivoRouter = require('./controllers/loteCultivoController');
const medicaoAmbientalRouter = require('./controllers/medicaoAmbientalController');
const logAuditoriaRouter = require('./controllers/logAuditoriaController');
const alertaRouter = require('./controllers/alertaController');

// Puxa a string de conexão de forma segura
const MONGO_URI = process.env.MONGO_URI;

// Middleware para ler JSON
app.use(express.json());

// Middleware de logging
app.use((req, res, next) => {
    const dataHora = new Date().toLocaleString();
    console.log(`[${dataHora}] ${req.method} ${req.url}`);
    next();
});

// Rotas
app.use('/planos-cultivo', planoCultivoRouter);
app.use('/ervas-aromaticas', ervaAromaticaRouter);
app.use('/utilizadores', utilizadorRouter);
app.use('/tarefas', tarefaRouter);
app.use('/lotes-cultivo', loteCultivoRouter);
app.use('/medicoes-ambientais', medicaoAmbientalRouter);
app.use('/logs-auditoria', logAuditoriaRouter);
app.use('/alertas', alertaRouter);

// Middleware Global de Tratamento de Erros (Adicionado)
app.use((err, req, res, next) => {
    console.error('❌ Erro interno do servidor:', err.stack);
    res.status(500).json({ erro: 'Algo correu mal no servidor!' });
});

// Conexão ao Banco e Inicialização do Servidor (Apenas um app.listen aqui!)
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Ligado ao MongoDB! 🎉');
        app.listen(port, () => {
            console.log(`🚀 Servidor a correr em http://localhost:${port}`);
        });
    })
    .catch(err => {
        console.error('❌ Erro ao ligar ao MongoDB:', err);
        process.exit(1); // Fecha a aplicação se não conseguir conectar ao banco
    });