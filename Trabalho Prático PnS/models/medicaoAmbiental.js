const mongoose = require('mongoose');

const schema = new mongoose.Schema(
    {
        loteCultivoId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'LoteCultivo',
            required: [true, 'O lote de cultivo é obrigatório']
        },
        temperatura: {
            type: Number,
            required: [true, 'A temperatura é obrigatória']
        },
        humidade: {
            type: Number,
            required: [true, 'A humidade é obrigatória']
        },
        luminosidade: {
            type: Number,
            required: [true, 'A luminosidade é obrigatória']
        },
        dataHora: {
            type: Date,
            default: Date.now, // Define a data e hora como o momento atual por padrão
        },
        dadosValidos: { type: Boolean, default: true },
        observacao: { type: String }
    },
    { timestamps: true }
);

module.exports = mongoose.model('MedicaoAmbiental', schema);