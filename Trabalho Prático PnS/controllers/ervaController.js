const ErvaAromatica = require('../models/ervaAromatica');
const { registarAcao } = require('../utils/auditoria');

// 🔍 LISTAR (GET /ervas)
exports.listarErvas = async (req, res) => {
    try {
        const ervas = await ErvaAromatica.find();
        res.status(200).json(ervas);
    } catch (err) {
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

// ➕ CRIAR (POST /ervas)
exports.criarErva = async (req, res) => {
    try {
        const novaErva = await ErvaAromatica.create(req.body);
        await registarAcao(req.utilizadorInfo.id, 'criar', 'ErvaAromatica');
        res.status(201).json(novaErva);
    } catch (err) {
        res.status(400).json({ erro: 'Erro ao criar erva aromática.' });
    }
};

// 🔄 ATUALIZAR / ALTERAR (PUT /ervas/:id)
exports.atualizarErva = async (req, res) => {
    try {
        const ervaAtualizada = await ErvaAromatica.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!ervaAtualizada) {
            return res.status(404).json({ erro: 'Erva aromática não encontrada.' });
        }

        await registarAcao(req.utilizadorInfo.id, 'atualizar', 'ErvaAromatica');
        res.status(200).json(ervaAtualizada);
    } catch (err) {
        res.status(400).json({ erro: 'Erro ao atualizar erva aromática.' });
    }
};

// 🗑️ ELIMINAR / APAGAR (DELETE /ervas/:id)
exports.eliminarErva = async (req, res) => {
    try {
        const ervaEliminada = await ErvaAromatica.findByIdAndDelete(req.params.id);

        if (!ervaEliminada) {
            return res.status(404).json({ erro: 'Erva aromática não encontrada.' });
        }

        await registarAcao(req.utilizadorInfo.id, 'eliminar', 'ErvaAromatica');
        res.status(200).json({ mensagem: 'Erva aromática eliminada com sucesso.' });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao eliminar erva aromática.' });
    }
};

// 🔍 OBTER POR ID (GET /ervas/:id) - 🆕 ADICIONADO PARA SUPORTAR EDIÇÃO NO FRONTEND
exports.obterErvaPorId = async (req, res) => {
    try {
        const erva = await ErvaAromatica.findById(req.params.id);
        
        if (!erva) {
            return res.status(404).json({ erro: 'Erva aromática não encontrada.' });
        }
        
        res.status(200).json(erva);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao buscar a erva aromática.' });
    }
};

// 📥 IMPORTAR CSV (POST /ervas/import)
exports.importarCSV = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ erro: 'Por favor, envie um ficheiro CSV.' });
        }

        const conteudoCSV = req.file.buffer.toString('utf-8');
        const linhas = conteudoCSV.split('\n');
        const ervasParaInserir = [];

        for (let i = 1; i < linhas.length; i++) {
            const linha = linhas[i].trim();
            if (!linha) continue;

            const [nome, especie, descricao] = linha.split(',');

            if (!nome || !especie) {
                return res.status(400).json({ erro: `Erro na linha ${i + 1}: Nome e Espécie obrigatórios.` });
            }

            ervasParaInserir.push({
                nome: nome.trim(),
                especie: especie.trim(),
                descricao: descricao ? descricao.trim() : ''
            });
        }

        const resultados = await ErvaAromatica.insertMany(ervasParaInserir);
        await registarAcao(req.utilizadorInfo.id, 'importar', 'ErvaAromatica');

        res.status(201).json({
            mensagem: 'Ficheiro CSV importado com sucesso!',
            registosImportados: resultados.length
        });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao processar o ficheiro CSV.', detalhe: err.message });
    }
};

// 📤 EXPORTAR CSV (GET /ervas/exportar) - 🆕 ADICIONADO
exports.exportarCSV = async (req, res) => {
    try {
        // Busca todas as ervas guardadas no MongoDB
        const ervas = await ErvaAromatica.find();

        // Monta o cabeçalho seguindo exatamente a estrutura que tu usas no import
        let csvContent = 'Nome,Especie,Descricao\n';

        // Preenche com os dados reais mapeados
        ervas.forEach(erva => {
            // Usamos aspas para o caso de a descrição ter espaços ou vírgulas
            csvContent += `"${erva.nome}","${erva.especie}","${erva.descricao || ''}"\n`;
        });

        // Configura os headers HTTP para o browser reconhecer como um download de ficheiro
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=ervas-greenherb.csv');

        // Regista a exportação na auditoria para saberes quem descarregou os dados
        await registarAcao(req.utilizadorInfo.id, 'exportar', 'ErvaAromatica');

        // Envia o ficheiro de texto puro gerado
        return res.status(200).send(csvContent);
        
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao exportar o ficheiro CSV.', detalhe: err.message });
    }
};