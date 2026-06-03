const LogAuditoria = require('../models/logAuditoria');

/**
 * Função utilitária para registar automaticamente as ações dos utilizadores na BD
 */
exports.registarAcao = async (utilizadorId, acao, entidade) => {
    try {
        // Certifica-te de que os nomes destes campos batem certo com o teu Schema de LogAuditoria
        await LogAuditoria.create({
            utilizadorId,
            acao,
            entidade, // Se o teu model usar o nome 'modulo' em vez de 'entidade', altera aqui
            dataHora: new Date()
        });
        
        console.log(`📝 [Auditoria] Ação "${acao}" registada para a tabela "${entidade}".`);
    } catch (err) {
        console.error('❌ [Auditoria] Falha ao gravar log na base de dados:', err.message);
    }
};