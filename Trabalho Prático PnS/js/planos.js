// Variável global para guardar as plantas do catálogo e podermos traduzir IDs em nomes legíveis
let mapaErvas = {};

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) {
        window.location.href = 'login.html';
        return;
    }

    const tipoUtilizador = await verificarNivelAcesso(token, userId);
    
    // 1º Carrega o catálogo de plantas
    await carregarOpcoesErvas(token);
    
    // 2º Carrega os planos e configura o formulário
    carregarPlanosCultivo(token, tipoUtilizador);
    configurarFormularioPlano(token, tipoUtilizador);
});

async function verificarNivelAcesso(token, userId) {
    try {
        const res = await fetch(`http://localhost:3000/utilizadores/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const utilizador = await res.json();
        return utilizador.tipo;
    } catch (err) {
        return 'tecnico';
    }
}

// 🌿 Procura as ervas no catálogo e preenche o Dropdown do formulário
async function carregarOpcoesErvas(token) {
    try {
        const res = await fetch('http://localhost:3000/ervas', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const ervas = await res.json();
        
        const selectErva = document.getElementById('plano-erva');
        selectErva.innerHTML = '<option value="">-- Selecione uma Planta --</option>';
        
        ervas.forEach(erva => {
            mapaErvas[erva._id] = erva.nome;
            selectErva.innerHTML += `<option value="${erva._id}">${erva.nome}</option>`;
        });
    } catch (err) {
        document.getElementById('plano-erva').innerHTML = '<option value="">Erro ao carregar catálogo</option>';
    }
}

// 📥 LER (GET)
async function carregarPlanosCultivo(token, tipoUtilizador) {
    try {
        const res = await fetch('http://localhost:3000/planos', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const planos = await res.json();

        const tabelaCorpo = document.getElementById('tabela-planos-corpo');
        tabelaCorpo.innerHTML = '';

        if (planos.length === 0) {
            tabelaCorpo.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px; color: #888;">Nenhum plano configurado.</td></tr>`;
            return;
        }

        planos.forEach(plano => {
            let botoesAcao = `<td style="text-align: center; color: #999; padding: 12px;">Sem permissão</td>`;
            
            const idErva = plano.ervaAromaticaId?._id || plano.ervaAromaticaId;
            const nomeErva = plano.ervaAromaticaId?.nome || mapaErvas[idErva] || 'Planta Desconhecida';

            const tMin = plano.temperaturaMin !== undefined ? plano.temperaturaMin : '';
            const tMax = plano.temperaturaMax !== undefined ? plano.temperaturaMax : '';
            const autorizado = plano.autorizacaoResponsavel || false;
            
            // Captura os novos campos de emergência vindos da BD
            const dosagem = plano.dosagem || '';
            const tipoIntervencao = plano.tipoIntervencao || '';

            if (tipoUtilizador === 'administrador' || tipoUtilizador === 'responsavel') {
                const nomeEscapado = plano.nome.replace(/'/g, "\\'");
                const dosagemEscapada = dosagem.replace(/'/g, "\\'");
                const intervencaoEscapada = tipoIntervencao.replace(/'/g, "\\'");

                // Passa todos os parâmetros necessários para a função de edição
                botoesAcao = `
                    <td style="padding: 12px; text-align: center;">
                        <div style="display: flex; gap: 8px; justify-content: center; align-items: center;">
                            <button onclick="prepararEdicaoPlano('${plano._id}', '${nomeEscapado}', '${idErva}', '${plano.tipo}', ${plano.duracaoDias}, '${tMin}', '${tMax}', ${autorizado}, '${dosagemEscapada}', '${intervencaoEscapada}')" style="background: #f9a825; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 13px;">✏️ Alterar</button>
                            <button onclick="eliminarPlano('${plano._id}')" style="background: #e53935; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 13px;">🗑️ Apagar</button>
                        </div>
                    </td>
                `;
            }

            const corTipo = plano.tipo === 'emergencia' ? '#d32f2f' : (plano.tipo === 'pontual' ? '#f57c00' : '#2e7d32');
            const sufixoTipo = (plano.tipo === 'pontual' && autorizado) ? ' ✔️' : '';

            // Se for plano de emergência, mostra uma pequena dica de dosagem na tabela
            const infoAdicional = (plano.tipo === 'emergencia' && dosagem) ? ` <br><small style="color: #666;">(${dosagem})</small>` : '';

            const textoMargens = (plano.temperaturaMin !== undefined && plano.temperaturaMax !== undefined)
                ? `${plano.temperaturaMin} a ${plano.temperaturaMax}°C`
                : '--';

            tabelaCorpo.innerHTML += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px; font-weight: bold; color: #8e24aa;">${plano.nome}</td>
                    <td style="padding: 12px; font-weight: 500; color: #333;">🌿 ${nomeErva}</td>
                    <td style="padding: 12px;"><span style="color: white; background: ${corTipo}; padding: 3px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase;">${plano.tipo}${sufixoTipo}</span>${infoAdicional}</td>
                    <td style="padding: 12px; font-weight: bold;">${plano.duracaoDias} dias</td>
                    <td style="padding: 12px; font-size: 13px; color: #555;">🌡️ ${textoMargens}</td>
                    ${botoesAcao}
                </tr>
            `;
        });

    } catch (err) {
        mostrarMensagem('msg-plano-erro', 'Erro ao carregar a lista de planos.');
    }
}

// 📤 CRIAR (POST) ou ATUALIZAR (PUT)
function configurarFormularioPlano(token, tipoUtilizador) {
    document.getElementById('form-plano').addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('plano-id').value;
        const nome = document.getElementById('plano-nome').value;
        const ervaAromaticaId = document.getElementById('plano-erva').value;
        const tipo = document.getElementById('plano-tipo').value;
        const duracaoDias = document.getElementById('plano-duracao').value;
        const tempMinVal = document.getElementById('plano-temp-min').value;
        const tempMaxVal = document.getElementById('plano-temp-max').value;
        const autorizacaoResponsavel = document.getElementById('plano-autorizacao').checked;
        
        // Novos inputs de emergência
        const dosagem = document.getElementById('plano-dosagem').value;
        const tipoIntervencao = document.getElementById('plano-intervencao').value;

        const dadosPlano = { 
            nome, 
            ervaAromaticaId, 
            tipo, 
            duracaoDias: Number(duracaoDias)
        };

        if (tempMinVal !== '') dadosPlano.temperaturaMin = Number(tempMinVal);
        if (tempMaxVal !== '') dadosPlano.temperaturaMax = Number(tempMaxVal);
        
        if (tipo === 'pontual') {
            dadosPlano.autorizacaoResponsavel = autorizacaoResponsavel;
        }

        // 🔥 Se o tipo for emergência, valida e injeta os dados que o teu Schema exige
        if (tipo === 'emergencia') {
            dadosPlano.dosagem = dosagem;
            dadosPlano.tipoIntervencao = tipoIntervencao;
        }

        let url = 'http://localhost:3000/planos';
        let metodo = 'POST';

        if (id) {
            url = `http://localhost:3000/planos/${id}`;
            metodo = 'PUT';
        }

        try {
            const res = await fetch(url, {
                method: metodo,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dadosPlano)
            });

            const resultado = await res.json();
            if (!res.ok) throw new Error(resultado.erro || resultado.message || 'Erro na gravação.');

            mostrarMensagem('msg-plano-sucesso', id ? 'Plano atualizado com sucesso!' : 'Novo plano de cultivo registado!');
            cancelarEdicao();
            carregarPlanosCultivo(token, tipoUtilizador);

        } catch (err) {
            mostrarMensagem('msg-plano-erro', err.message);
        }
    });
}

// ✏️ Coloca os valores certos nos inputs ao Editar
function prepararEdicaoPlano(id, nome, ervaAromaticaId, tipo, duracaoDias, tempMin, tempMax, autorizado, dosagem, tipoIntervencao) {
    document.getElementById('plano-id').value = id;
    document.getElementById('plano-nome').value = nome;
    document.getElementById('plano-erva').value = ervaAromaticaId;
    document.getElementById('plano-tipo').value = tipo;
    document.getElementById('plano-duracao').value = duracaoDias;
    document.getElementById('plano-temp-min').value = tempMin;
    document.getElementById('plano-temp-max').value = tempMax;
    document.getElementById('plano-autorizacao').checked = autorizado;
    
    // Alimenta os novos campos no formulário de edição
    document.getElementById('plano-dosagem').value = dosagem;
    document.getElementById('plano-intervencao').value = tipoIntervencao;

    document.getElementById('titulo-formulario').innerText = `✏️ A Modificar Plano: "${nome}"`;
    document.getElementById('btn-submeter').innerText = 'Guardar Modificações';
    document.getElementById('btn-submeter').style.background = '#f9a825';
    document.getElementById('btn-cancelar').style.display = 'inline-block';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelarEdicao() {
    document.getElementById('form-plano').reset();
    document.getElementById('plano-id').value = '';
    document.getElementById('plano-autorizacao').checked = false;
    
    // Garante que limpa os novos campos de emergência
    document.getElementById('plano-dosagem').value = '';
    document.getElementById('plano-intervencao').value = '';
    
    document.getElementById('titulo-formulario').innerText = '📋 Criar Novo Plano de Cultivo';
    document.getElementById('btn-submeter').innerText = 'Criar Plano';
    document.getElementById('btn-submeter').style.background = '#8e24aa';
    document.getElementById('btn-cancelar').style.display = 'none';
}

async function eliminarPlano(id) {
    if (!confirm('Deseja mesmo eliminar este plano de cultivo?')) return;

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`http://localhost:3000/planos/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Não foi possível remover o plano.');

        mostrarMensagem('msg-plano-sucesso', 'Plano eliminado com sucesso.');
        
        const userId = localStorage.getItem('userId');
        const tipoUtilizador = await verificarNivelAcesso(token, userId);
        carregarPlanosCultivo(token, tipoUtilizador);

    } catch (err) {
        mostrarMensagem('msg-plano-erro', err.message);
    }
}

function mostrarMensagem(idDiv, texto) {
    const div = document.getElementById(idDiv);
    div.innerText = texto;
    div.style.display = 'block';
    setTimeout(() => { div.style.display = 'none'; }, 4000);
}

document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
});