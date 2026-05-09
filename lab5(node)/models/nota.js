const mongoose = require('mongoose');

// Definir o Schema conforme as instruções do Lab
const notaSchema = new mongoose.Schema({
    codigoDisciplina: { 
        type: Number, 
        required: true, 
        unique: true 
    },
    nomeProfessor: { 
        type: String, 
        required: true 
    },
    nomeDisciplina: { 
        type: String, 
        required: true 
    },
    nota: { 
        type: Number, 
        required: true, 
        min: 0, 
        max: 20 
    }
}, { 
    timestamps: true, // Fase 3.2: Ativa createdAt e updatedAt automaticamente
    versionKey: false // Remove o campo __v do documento    
});

// Exportar o modelo para usar no controlador
module.exports = mongoose.model('Nota', notaSchema);