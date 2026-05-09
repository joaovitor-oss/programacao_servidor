const express = require('express');
const mongoose = require('mongoose');
const app = express();

// Importar o Router (Fase 2)
const notasRouter = require('./Routes/notas.js');

app.use(express.json());

// Configurar a ligação à BD (Fase 3.3)
const mongoURI = "mongodb+srv://jotavitorsilva10_db_user:N6lgZoWzwVQU1AkU@cluster0.5bjpqri.mongodb.net/LabNode05?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(mongoURI)
  .then(() => console.log('✅ Ligado ao MongoDB Atlas com sucesso!'))
  .catch((err) => console.error('❌ Erro ao ligar ao MongoDB:', err));

// Middleware Global de Log 
app.use((req, res, next) => {
    const dataHora = new Date().toLocaleString();
    console.log(`[${dataHora}] Pedido: ${req.method} em ${req.url}`);
    next();
});

// Ligar as rotas ao prefixo /notas 
app.use('/notas', notasRouter);

app.listen(3000, () => {
    console.log('🚀 Servidor rodando em http://localhost:3000');
});