const mongoose = require('mongoose');

const schema = new mongoose.Schema(
    {
        utilizadorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Utilizador',
            required: [true, 'O utilizador é obrigatório']
        },
        acao: {
            type: String,
            required: [true, 'A ação é obrigatória']
        },
        entidade: {
            type: String,
            required: [true, 'A entidade é obrigatória']
        },
        dataHora: {
            type: Date,
            default: Date.now, // Define a data e hora como o momento atual por padrão
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('LogAuditoria', schema);