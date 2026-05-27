const mongoose = require('mongoose');

const schema = new mongoose.Schema(
    {
        ervaAromaticaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ErvaAromatica',
            required: [true, 'A erva aromática é obrigatória']
        },
        nome: {
            type: String,
            required: [true, 'O nome do plano é obrigatório']
        },
        tipo: {
            type: String,
            enum: ['regular', 'emergencia', 'pontual'],
            required: [true, 'O tipo de plano é obrigatório']
        },
        duracaoDias: {
            type: Number,
            required: [true, 'A duração em dias é obrigatória']
        },
        temperaturaMin: { type: Number },
        temperaturaMax: { type: Number },
        humidadeMin: { type: Number },
        humidadeMax: { type: Number },
        luminosidadeMin: { type: Number },
        luminosidadeMax: { type: Number },
        planoRega: { type: String },
        planoFertilizacao: { type: String },
        intervaloMinimoIntervencoes: { type: Number },
        tipoIntervencao: { type: String },
        dosagem: { type: String },
        autorizacaoResponsavel: { type: Boolean },
        instrucoes: { type: String }
    },
    { timestamps: true }
);

module.exports = mongoose.model('PlanoCultivo', schema);