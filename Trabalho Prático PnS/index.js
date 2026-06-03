const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ==========================================
// 🛠️ MIDDLEWARES GLOBAIS
// ==========================================
app.use(cors());
app.use(express.json()); // Permite ler o corpo das requisições em JSON

// ==========================================
// 🧭 IMPORTAÇÃO DAS ROTAS (Clean Architecture)
// ==========================================
const rotasUtilizadores = require('./routes/utilizador');
const rotasErvas = require('./routes/ervaAromatica');
const rotasPlanos = require('./routes/planoCultivo');
const rotasLotes = require('./routes/loteCultivo');
const rotasMedicoes = require('./routes/medicaoAmbiental');
const rotasTarefas = require('./routes/tarefa');
const rotasAlertas = require('./routes/alerta');
const rotasLogs = require('./routes/logAuditoria');

// ==========================================
// 🚀 ANCORAGEM DOS ENDPOINTS
// ==========================================
app.use('/utilizadores', rotasUtilizadores);
app.use('/ervas', rotasErvas);
app.use('/planos', rotasPlanos);
app.use('/lotes', rotasLotes);
app.use('/medicoes-ambientais', rotasMedicoes);
app.use('/tarefas', rotasTarefas);
app.use('/alertas', rotasAlertas);
app.use('/logs-auditoria', rotasLogs);

// Rota base de teste para garantir que o servidor está online
app.get('/', (req, res) => {
    res.status(200).json({ 
        status: "Online", 
        mensagem: "API do Sistema Smart Greenhouse a funcionar corretamente." 
    });
});

// ==========================================
// 💾 CONEXÃO À BASE DE DADOS (MongoDB)
// ==========================================
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_greenhouse';
const PORT = process.env.PORT || 3000;

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('🔌 [Database] Conexão ao MongoDB estabelecida com sucesso!');
        
        // O servidor só começa a ouvir pedidos depois da BD estar ligada
        app.listen(PORT, () => {
            console.log(`🚀 [Server] Servidor a correr no porto ${PORT}`);
            console.log(`📂 Endpoints disponíveis em http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ [Database] Erro crítico ao ligar ao MongoDB:', err.message);
        process.exit(1); // Encerra a aplicação caso a BD falhe
    });