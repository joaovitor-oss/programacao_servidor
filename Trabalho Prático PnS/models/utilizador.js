const mongoose = require('mongoose');

const schema = new mongoose.Schema(
    {
        nome: {
            type: String,
            required: [true, 'O nome é obrigatório']
        },
        email: {
            type: String,
            required: [true, 'O email é obrigatório'],
            unique: true
        },
        password: {
            type: String,
            required: [true, 'A senha é obrigatória'],
            minlength: [6, 'A senha deve ter pelo menos 6 caracteres'] // Uma validação extra boa para segurança
        },
        tipo: {
            type: String,
            enum: ['tecnico', 'responsavel', 'administrador'],
            required: [true, 'O tipo de utilizador é obrigatório']
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Utilizador', schema);