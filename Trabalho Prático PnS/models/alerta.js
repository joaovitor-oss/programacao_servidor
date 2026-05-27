const mongoose = require('mongoose');

const schema = new mongoose.Schema(
    {
        loteCultivoId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'LoteCultivo',
            required: [true, 'O lote de cultivo é obrigatório']
        },
        medicaoAmbientalId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MedicaoAmbiental'
        },
        mensagem: {
            type: String,
            required: [true, 'A mensagem é obrigatória']
        },
        nivel: {
            type: String,
            enum: ['informativo', 'aviso', 'critico'],
            required: [true, 'O nível é obrigatório']
        },
        estado: {
            type: String,
            enum: ['ativo', 'resolvido', 'ignorado'],
            default: 'ativo', // Define o estado como 'ativo' por padrão
            required: [true, 'O estado é obrigatório']
        },
        justificacao: { type: String },
        dataHora: {
            type: Date,
            default: Date.now, // Define a data e hora como o momento atual por padrão
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Alerta', schema);