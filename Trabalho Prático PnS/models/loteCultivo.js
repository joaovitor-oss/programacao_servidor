const mongoose = require('mongoose');

const schema = new mongoose.Schema(
    {
        planoCultivoId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PlanoCultivo',
            required: [true, 'O plano de cultivo é obrigatório']
        },
        quantidade: {
        type: Number,
        required: [true, 'A quantidade de plantas é obrigatória'],
        min: [1, 'O lote deve ter pelo menos 1 planta'], // <--- Evita lotes com 0 ou plantas negativas!
        max: [500, 'O limite máximo para cada lote nesta bancada é de 500 plantas!']
        },
        dataInicio: {
            type: Date,
            default: Date.now,
        },
        dataFimPrevista: { type: Date },
        dataFimReal: { type: Date },
        estado: {
            type: String,
            enum: ['ativo', 'concluido', 'comprometido'],
            required: [true, 'O estado é obrigatório']
        },
        localizacao: { type: String },
        permiteDivisaoParcial: { type: Boolean },
        perdas: { type: Number },
        produtividade: { type: Number }
    },
    { timestamps: true }
);

module.exports = mongoose.model('LoteCultivo', schema);