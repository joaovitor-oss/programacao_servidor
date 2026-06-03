let mapaPlanos = {}; // Traduz o ID do plano para o nome real legível

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) {
        window.location.href = 'login.html';
        return;
    }

    const tipoUtilizador = await verificarNivelAcesso(token, userId);
    
    // 🔥 OBRIGATÓRIO: Carrega e espera pelos planos primeiro para preencher o mapa de nomes
    await carregarOpcoesPlanos(token);
    
    // Depois de ter os planos na memória, carrega a tabela e o formulário
    carregarLotesCultivo(token, tipoUtilizador);
    configurarFormularioLote(token, tipoUtilizador);
});

// Verifica o cargo do utilizador logado para proteção de botões
async function verificarNivelAcesso(token, userId) {
    try {
        const resAcesso = await fetch(`http://localhost:3000/utilizadores/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const utilizador = await resAcesso.json();
        return utilizador.tipo;
    } catch (err) {
        return 'tecnico';
    }
}

// Procura todos os planos para colocar na caixa de seleção
async function carregarOpcoesPlanos(token) {
    try {
        const resPlanos = await fetch('http://localhost:3000/planos', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const planos = await resPlanos.json();
        
        const selectPlano = document.getElementById('lote-plano');
        selectPlano.innerHTML = '<option value="">-- Selecione um Plano Operacional --</option>';
        
        planos.forEach(plano => {
            mapaPlanos[plano._id] = plano.nome; // Guarda a relação ID -> Nome
            selectPlano.innerHTML += `<option value="${plano._id}">${plano.nome}</option>`;
        });
    } catch (err) {
        console.error("Erro ao carregar planos:", err);
    }
}

// 📥 LER (GET): Desenha a tabela com a junção de dados
async function carregarLotesCultivo(token, tipoUtilizador) {
    try {
        const resLotes = await fetch('http://localhost:3000/lotes', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const lotes = await resLotes.json();

        const tabelaCorpo = document.getElementById('tabela-lotes-corpo');
        tabelaCorpo.innerHTML = '';

        if (!lotes || lotes.length === 0) {
            tabelaCorpo.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: #888;">Nenhum lote registado no sistema.</td></tr>`;
            return;
        }

        lotes.forEach(lote => {
            // 🔥 CORREÇÃO: Lê a propriedade exata do teu Mongoose Schema (planoCultivoId)
            const idPlano = lote.planoCultivoId?._id || lote.planoCultivoId;
            const nomePlano = lote.planoCultivoId?.nome || mapaPlanos[idPlano] || 'Plano não definido';

            // 🔥 CONCATENAÇÃO PEDIDA: Junta a localização e a quantidade de forma bonita
            const local = lote.localizacao || "Sem local";
            const qtd = lote.quantidade || 0;
            const textoIdentificacao = `Lote: '${local}' | Qtd: ${qtd}`;

            // Tratamento e formatação segura da data de início
            let dataFormatada = 'Sem data';
            let dataISO = '';
            if (lote.dataInicio) {
                const dataObj = new Date(lote.dataInicio);
                if (!isNaN(dataObj)) {
                    dataFormatada = dataObj.toLocaleDateString('pt-PT');
                    dataISO = dataObj.toISOString().split('T')[0];
                }
            }

            // Atribuição de permissões para os botões de ação
            let botoesAcao = `<td style="text-align: center; color: #999; padding: 12px;">Sem permissão</td>`;
            if (tipoUtilizador === 'administrador' || tipoUtilizador === 'responsavel') {
                const localEscapado = local.replace(/'/g, "\\'");
                botoesAcao = `
                    <td style="padding: 12px; text-align: center;">
                        <div style="display: flex; gap: 6px; justify-content: center;">
                            <button onclick="prepararEdicaoLote('${lote._id}', '${idPlano}', '${localEscapado}', ${qtd}, '${dataISO}', '${lote.estado}')" style="background: #f9a825; border: none; padding: 6px 10px; cursor: pointer; color: white; border-radius: 4px; font-weight: bold;">✏️</button>
                            <button onclick="eliminarLote('${lote._id}')" style="background: #e53935; border: none; padding: 6px 10px; cursor: pointer; color: white; border-radius: 4px; font-weight: bold;">🗑️</button>
                        </div>
                    </td>
                `;
            }

            // Cores estilizadas para cada um dos 3 estados do teu Enum
            const corEstado = lote.estado === 'ativo' ? '#2e7d32' : (lote.estado === 'concluido' ? '#0288d1' : '#d32f2f');

            tabelaCorpo.innerHTML += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px; font-weight: bold; color: #333;">${textoIdentificacao}</td>
                    <td style="padding: 12px; font-weight: 500; color: #8e24aa;">📋 ${nomePlano}</td>
                    <td style="padding: 12px; color: #555;">${dataFormatada}</td>
                    <td style="padding: 12px;"><span style="color: white; background: ${corEstado}; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase;">${lote.estado}</span></td>
                    ${botoesAcao}
                </tr>
            `;
        });
    } catch (err) {
        console.error(err);
        mostrarMensagem('msg-lote-erro', 'Erro ao processar a tabela de lotes.');
    }
}

// 📤 ENVIAR (POST para Criar ou PUT para Alterar)
function configurarFormularioLote(token, tipoUtilizador) {
    document.getElementById('form-lote').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('lote-id').value;
        
        // Monta o objeto exatamente com as chaves que o teu Schema espera receber
        const dadosLote = { 
            planoCultivoId: document.getElementById('lote-plano').value,
            localizacao: document.getElementById('lote-local').value,
            quantidade: Number(document.getElementById('lote-qtd').value),
            dataInicio: document.getElementById('lote-data').value,
            estado: document.getElementById('lote-estado').value
        };

        const url = id ? `http://localhost:3000/lotes/${id}` : 'http://localhost:3000/lotes';
        const metodo = id ? 'PUT' : 'POST';

        try {
            const resSalvar = await fetch(url, {
                method: metodo,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(dadosLote)
            });
            
            const resultado = await resSalvar.json();
            if (!resSalvar.ok) throw new Error(resultado.erro || 'Falha na comunicação com o servidor.');
            
            mostrarMensagem('msg-lote-sucesso', id ? 'Lote alterado com sucesso!' : 'Lote de cultivo registado!');
            cancelarEdicao();
            carregarLotesCultivo(token, tipoUtilizador);
        } catch (err) {
            mostrarMensagem('msg-lote-erro', err.message);
        }
    });
}

// ✏️ Coloca os dados guardados de volta nas caixas de texto ao clicar em Alterar
function prepararEdicaoLote(id, planoCultivoId, localizacao, quantidade, dataInicio, estado) {
    document.getElementById('lote-id').value = id;
    document.getElementById('lote-plano').value = planoCultivoId;
    document.getElementById('lote-local').value = localizacao;
    document.getElementById('lote-qtd').value = quantidade;
    document.getElementById('lote-data').value = dataInicio;
    document.getElementById('lote-estado').value = estado;
    
    document.getElementById('titulo-formulario').innerText = `✏️ A Alterar Lote da "${localizacao}"`;
    document.getElementById('btn-submeter').innerText = 'Guardar Alterações';
    document.getElementById('btn-submeter').style.background = '#f9a825';
    document.getElementById('btn-cancelar').style.display = 'inline-block';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Reverte o formulário para o modo de criação inicial
function cancelarEdicao() {
    document.getElementById('form-lote').reset();
    document.getElementById('lote-id').value = '';
    document.getElementById('titulo-formulario').innerText = '🌱 Iniciar Novo Lote de Cultivo';
    document.getElementById('btn-submeter').innerText = 'Iniciar Lote';
    document.getElementById('btn-submeter').style.background = '#0288d1';
    document.getElementById('btn-cancelar').style.display = 'none';
}

// 🗑️ APAGAR (DELETE)
async function eliminarLote(id) {
    if (!confirm('Tem a certeza absoluta que pretende remover este lote do sistema?')) return;
    
    const token = localStorage.getItem('token');
    try {
        const resEliminar = await fetch(`http://localhost:3000/lotes/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!resEliminar.ok) throw new Error('Não foi possível remover o lote da base de dados.');

        mostrarMensagem('msg-lote-sucesso', 'Lote eliminado com sucesso.');
        
        const userId = localStorage.getItem('userId');
        const tipoUtilizador = await verificarNivelAcesso(token, userId);
        carregarLotesCultivo(token, tipoUtilizador);
    } catch (err) {
        mostrarMensagem('msg-lote-erro', err.message);
    }
}

// Mostra notificações visuais temporárias no ecrã
function mostrarMensagem(idDiv, texto) {
    const div = document.getElementById(idDiv);
    div.innerText = texto;
    div.style.display = 'block';
    setTimeout(() => { div.style.display = 'none'; }, 4000);
}

// Botão de Logout
document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
});