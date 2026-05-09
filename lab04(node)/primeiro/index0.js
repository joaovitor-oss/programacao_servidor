const express = require('express');
const app = express();
const port = 3000;

var minhas_notas = [20,10,15,17];

app.use(express.json());

// GET raiz (completo)
app.get('/', (req, res) => {
    res.status(200).send(minhas_notas);
});    

// GET por posição
app.get('/:posicao', (req, res) => {
    var posicao = req.params.posicao;
    if (posicao >= 0 && posicao < minhas_notas.length) {
        res.status(200).send(minhas_notas[posicao]);
    } else {
        res.status(404).send('Posição inválida');
    }
});

// POST para adicionar um valor raiz
app.post('/', (req, res) => {
    const NovaNota= parseInt(req.body.nota);

    if (!isNaN(NovaNota)) {
        minhas_notas.push(NovaNota);
        res.status(200).send('Valor adicionado com sucesso');
    } else {
        res.status(400).send('Valor inválido');
    }

});


app.post('/add/:valor', (req, res) => {
    const NovaNota = parseInt(req.params.valor);
    if (!isNaN(NovaNota)) {
         minhas_notas.push(NovaNota);
        res.status(200).send('Valor adicionado com sucesso');
        
    } else {
        res.status(400).send('Valor inválido');
    }    
});    

app.patch('/:posicao', (req, res) => {
    const posicao = parseInt(req.params.posicao);
    const novoValor = parseInt(req.body.nota);

    if (isNaN(posicao) || isNaN(novoValor) || !minhas_notas[posicao]) {
        return res.status(400).send('Posição ou valor inválido');
    } else {
        minhas_notas[posicao] = novoValor;
        res.status(200).json({ message: 'Valor atualizado com sucesso', notas: minhas_notas });        
    }

});

//DELETE um
app.delete('/:posicao', (req, res) => {
    const posicao = parseInt(req.params.posicao);
    if (minhas_notas[posicao] !== undefined) {
        minhas_notas.splice(posicao, 1);
        res.status(200).send('Valor removido com sucesso');
    } else {
        res.status(404).send('Posição inválida');
    }
});

//DELETE todos
app.delete('/', (req, res) => {
    minhas_notas = [];
    res.status(200).send('Todos os valores foram removidos com sucesso');
});


app.listen(3000, () => {
    console.log('Tabela de notas rodando em http://localhost:3000');
});



