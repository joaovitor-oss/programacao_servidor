const mongoose = require('mongoose');

const schema = new mongoose.Schema(
    {
        nome: {
            type: String,
            required: [true, 'O nome da erva é obrigatório']
        },
        especie: {
            type: String,
            required: [true, 'A espécie é obrigatória']
        },
        descricao: {
            type: String
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('ErvaAromatica', schema);