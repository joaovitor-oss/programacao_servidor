const mongoose = require('mongoose');

const schema = new mongoose.Schema(
    {
        loteCultivoId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'LoteCultivo',
            required: [true, 'O lote de cultivo é obrigatório']
        },
        tipo: {
            type: String,
            enum: ['rega', 'fertilizacao', 'colheita', 'monitorizacao'],
            required: [true, 'O tipo de tarefa é obrigatório']
        },
        descricao: {
            type: String,
            required: [true, 'A descrição é obrigatória']
        },
        dataPrevista: {
            type: Date,
            required: [true, 'A data prevista é obrigatória']
        },
        dataExecucao: { type: Date },
        estado: {
            type: String,
            enum: ['pendente', 'executada'],
            required: [true, 'O estado é obrigatório']
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Tarefa', schema);