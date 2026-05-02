const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');


const app = express();
app.use(cors());
app.use(express.json());

const filePath = './shared/consumos.json';

//Função auxiliar para ler os dados
const lerDados = () => {
    const data = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [parsed]; // Garantir que seja um array
};

//Função para guardar os dados
const guardarDados = (dados) => {
    fs.writeFileSync(filePath, JSON.stringify(dados, null, 2));
}

// Rota raiz
app.get('/', (req, res) => {
    res.status(200).send('Bem-vindo à API de Consumos!');
});


//Obter todos os dados do ficheiro
app.get('/consumos', (req, res) => {
    try {
        const dados = lerDados();
        res.set('Cache-Control', 'public, max-age=60');
        return res.status(200).json(dados);
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao ler ficheiro' });
    }
});

//Obter todos os dados de um cliente
app.get('/consumos/:clienteId', (req, res) => {
    const dados = lerDados();
    const cliente = dados.find(c => c.clienteId === req.params.clienteId); // Substitua por clienteId se for o campo correto
    
    if (!cliente) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.set('Cache-Control', 'public, max-age=60'); // Cache por 60 segundos
    res.status(200).json(cliente);
});

//Adicionar um novo consumo
app.post('/consumos/:clienteId', (req, res) => {
    const dados = lerDados();
    // 1. Encontrar o cliente pelo ID que vem na URL
    const index = dados.findIndex(c => c.clienteId === req.params.clienteId);

    if (index === -1) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // 2. Receber o novo consumo do corpo da requisição (req.body)
    const novoConsumo = {
        mes: req.body.mes,
        ano: req.body.ano,
        kWhConsumido: req.body.kWhConsumido,
        custoTotal: req.body.custoTotal,
        dataLeitura: req.body.dataLeitura
    };

    // 3. Adicionar ao array "consumo" do cliente encontrado
    dados[index].consumo.push(novoConsumo);

    // 4. Gravar no ficheiro JSON
    guardarDados(dados);

    res.status(201).json({ message: 'Consumo adicionado!', cliente: dados[index] });
});


//Alterar o endereço de um cliente
// Alterado de .patch para .put
app.put('/endereco/:clienteId', (req, res) => {
    const dados = lerDados();
    const index = dados.findIndex(c => String(c.clienteId) === String(req.params.clienteId));

    if (index === -1) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // No PUT, nós substituímos o objeto endereço inteiro pelos dados do body
    dados[index].endereco = {
        rua: req.body.rua,
        numero: req.body.numero,
        cidade: req.body.cidade,
        codigoPostal: req.body.codigoPostal
    };

    guardarDados(dados);
    res.status(200).json({ message: 'Endereço substituído com sucesso', cliente: dados[index] });
});

app.delete('/consumos/:clienteId/:mes', (req, res) => {
    const dados = lerDados();
    const index = dados.findIndex(c => c.clienteId === req.params.clienteId);

    if (index === -1) return res.status(404).json({ error: 'Cliente não encontrado' });

    const inicialLen = dados[index].consumo.length;
    dados[index].consumo = dados[index].consumo.filter(c => c.mes.toLowerCase() !== req.params.mes.toLowerCase());

    if (dados[index].consumo.length === inicialLen) {
        return res.status(404).json({ error: 'Consumo desse mês não encontrado' });
    }

    guardarDados(dados);
    res.status(200).json({ message: 'Consumo eliminado com sucesso' });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

