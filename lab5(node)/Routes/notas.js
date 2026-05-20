const express = require('express');
const router = express.Router();
const Nota = require('../models/nota.js');

// 1. Listar todas as notas (GET /notas)
router.get('/', async (req, res) => {
    try {
        const notas = await Nota.find().sort({ codigoDisciplina: 1 }); // Ordena por código da disciplina
        res.status(200).json(notas);
    } catch (err) {
        res.status(500).json({ message: "Erro ao buscar notas, verifique os dados", error: err.message });
    }
});

// 2. Criar uma nova nota (POST /notas)
router.post('/', async (req, res) => {
    try {
        // O req.body deve conter: codigoDisciplina, nomeProfessor, nomeDisciplina, nota
        const novaNota = new Nota(req.body);
        await novaNota.save();
        res.status(201).json({ message: 'Nota criada com sucesso!', nota: novaNota });
    } catch (err) {
        // Se houver erro de validação (ex: nota > 20), cai aqui
        res.status(400).json({ message: 'Erro ao criar nota, verifique os dados ', error: err.message });
    }
});

// 3. Obter uma nota específica por ID (GET /notas/:id)
router.get('/:id', async (req, res) => {
    try {
        const nota = await Nota.findById(req.params.id); // Busca a nota pelo ID fornecido na URL
        if (!nota) return res.status(404).json({ message: 'Nota não encontrada' }); 
        res.status(200).json(nota);
    } catch (err) {
        res.status(400).json({ message: 'ID inválido' });
    }
});

// 4. Substituir uma nota (PUT /notas/:id) - Substitui o documento todo
router.put('/:id', async (req, res) => {
    try {
        // Encontra o ID e substitui pelos dados do req.body
        const notaAtualizada = await Nota.findOneAndReplace(
            { _id: req.params.id }, 
            req.body, 
            { new: true, runValidators: true}
        );
        if (!notaAtualizada) return res.status(404).json({ message: 'Nota não encontrada' });
        res.status(200).json(notaAtualizada);
    } catch (err) {
        res.status(400).json({ message: 'Erro ao substituir nota', error: err.message });
    }
});

// 5. Atualizar parcialmente (PATCH /notas/:id) - Altera só o que enviares
router.patch('/:id', async (req, res) => {
    try {
        const notaAtualizada = await Nota.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true } // Retorna a nota nova e valida min/max
        );
        if (!notaAtualizada) return res.status(404).json({ message: 'Nota não encontrada' });
        res.status(200).json(notaAtualizada);
    } catch (err) {
        res.status(400).json({ message: 'Erro ao atualizar nota', error: err.message });
    }
});

// 6. Eliminar uma nota (DELETE /notas/:id)
router.delete('/:id', async (req, res) => {
    try {
        const notaEliminada = await Nota.findByIdAndDelete(req.params.id); 
        if (!notaEliminada) return res.status(404).json({ message: 'Nota não encontrada' }); // Se o ID não existir
        res.status(200).json({ message: 'Removida com sucesso' });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao eliminar nota, verifique os dados', error: err.message });
    }
});

module.exports = router;