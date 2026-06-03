// 🌍 Variável Global para guardar os dados dos lotes da estufa
let mapaLotes = {};

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Carrega primeiro as bancadas/lotes para a memória e depois os alertas
    await carregarLotesDrop(token);
    await carregarAlertas(token);

    // Escuta a submissão do Formulário (Criar ou Editar)
    document.getElementById('form-alerta').addEventListener('submit', guardarAlerta);
    
    // Escuta o botão de cancelar edição
    document.getElementById('btn-cancelar-edicao').addEventListener('click', limparFormulario);
});

// 🛠️ Função Inteligente para construir o nome: ex "Bancada B/A (Alecrim)"
function formatarNomeLote(lote) {
    if (!lote) return 'Lote Geral';
    
    // Suporta tanto o padrão normal do MongoDB (_id) como serializações customizadas (id)
    const idLote = typeof lote === 'object' ? (lote._id || lote.id) : lote;
    
    const dadosDoAlerta = typeof lote === 'object' ? lote : {};
    const dadosDoMapa = mapaLotes[idLote] || {};
    
    // Fusão total dos dados disponíveis
    const d = { ...dadosDoAlerta, ...dadosDoMapa };

    // [DEBUG LOG] Permite ver as propriedades reais no Console do Browser (F12)
    console.log(`[GreenHerb Debug] Dados do Lote (${idLote}):`, d);

    // Se o mapa ainda não tiver dados e não houver campos legíveis, mostra o fallback seguro
    if (!d.bancada && !d.zona && !d.nome && !d.setor && !d.cultivo && !d.planta) {
        return idLote ? `Lote #${idLote.substring(0, 6)}` : 'Lote Geral';
    }

    let partes = [];

    // 1. Processa a localização principal (Bancada ou Zona)
    if (d.bancada) {
        partes.push(d.bancada);
    } else if (d.zona) {
        partes.push(d.zona);
    } else if (d.nome) {
        partes.push(d.nome);
    }

    // 2. Processa o Setor/Fila (Se houver bancada, junta com "/" para fazer "Bancada B/A")
    if (d.setor) {
        if (partes.length > 0) {
            partes[0] = `${partes[0]}/${d.setor}`;
        } else {
            partes.push(`Setor ${d.setor}`);
        }
    }

    // 3. Adiciona a planta ou tipo de cultivo entre parênteses para ficar profissional
    if (d.cultivo) {
        partes.push(`(${d.cultivo})`);
    } else if (d.planta) {
        partes.push(`(${d.planta})`);
    }

    // Se por algum motivo o array continuar vazio, retorna o ID
    if (partes.length === 0) {
        return `Lote #${idLote.substring(0, 6)}`;
    }

    // Junta os elementos ("Bancada B/A" + "(Alecrim)") removendo hífens desnecessários antes dos parênteses
    let resultadoFinal = partes.join(' - ').replace(' - (', ' (');

    // 4. Anexa a quantidade se o campo existir
    const qtd = d.quantidade || d.qtd;
    if (qtd) {
        resultadoFinal += ` (Qtd: ${qtd})`;
    }

    return resultadoFinal;
}

// 🌿 Procurar as bancadas/lotes ativos para preencher o <select> e alimentar o Mapa Global
async function carregarLotesDrop(token) {
    try {
        const res = await fetch('http://localhost:3000/lotes', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const lotes = await res.json();
        
        const selectLote = document.getElementById('form-lote');
        selectLote.innerHTML = '<option value="">-- Selecione o Lote afetado --</option>';
        
        if (res.ok && Array.isArray(lotes)) {
            lotes.forEach(lote => {
                const id = lote._id || lote.id;
                if (id) {
                    mapaLotes[id] = lote; // Guarda o objeto completo associado ao ID correto
                }

                const nomeFormatado = formatarNomeLote(lote);
                selectLote.innerHTML += `<option value="${id}">${nomeFormatado}</option>`;
            });
        } else {
            selectLote.innerHTML = '<option value="">Erro ao carregar lotes da estufa</option>';
        }
    } catch (err) {
        console.error("Erro ao popular drop de lotes:", err);
    }
}

// 📥 Buscar e renderizar todos os alertas do backend nas respetivas tabelas
async function carregarAlertas(token) {
    try {
        const res = await fetch('http://localhost:3000/alertas', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const resultado = await res.json();
        if (!res.ok) throw new Error(resultado.erro || "Erro ao descarregar os alertas.");

        const alertas = resultado;
        const tabelaAtivos = document.getElementById('tabela-alertas-ativos');
        const tabelaResolvidos = document.getElementById('tabela-alertas-resolvidos');

        tabelaAtivos.innerHTML = '';
        tabelaResolvidos.innerHTML = '';

        const ativos = alertas.filter(a => a.estado === 'ativo' || !a.estado);
        const tratados = alertas.filter(a => a.estado === 'resolvido' || a.estado === 'ignorado');

        // 🚨 1. Renderizar Alertas Ativos
        if (ativos.length === 0) {
            tabelaAtivos.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: #2e7d32; font-weight: bold;">🌱 Tudo ótimo! Não há alertas ativos na estufa.</td></tr>`;
        } else {
            ativos.forEach(alerta => {
                const dataFormatada = new Date(alerta.dataHora || alerta.createdAt).toLocaleString('pt-PT');
                const badgeClasse = alerta.nivel === 'critico' ? 'badge-critico' : (alerta.nivel === 'aviso' ? 'badge-aviso' : 'badge-informativo');
                
                const nomeLote = formatarNomeLote(alerta.loteCultivoId);
                const idLotePuro = alerta.loteCultivoId?._id || alerta.loteCultivoId?.id || alerta.loteCultivoId;

                tabelaAtivos.innerHTML += `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 12px; font-weight: bold;">${nomeLote}</td>
                        <td style="padding: 12px;">${alerta.mensagem}</td>
                        <td style="padding: 12px;"><span class="badge ${badgeClasse}">${alerta.nivel}</span></td>
                        <td style="padding: 12px;">${dataFormatada}</td>
                        <td style="padding: 12px; text-align: center; display: flex; gap: 5px; justify-content: center;">
                            <button onclick="alterarEstadoAlerta('${alerta._id}', 'resolvido')" style="background: #2e7d32; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">✅ Resolver</button>
                            <button onclick="alterarEstadoAlerta('${alerta._id}', 'ignorado')" style="background: #ef6c00; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">👁️ Ignorar</button>
                            <button onclick="prepararEdicao('${alerta._id}', '${idLotePuro}', '${alerta.nivel}', '${alerta.mensagem}')" style="background: #0288d1; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">✏️ Editar</button>
                            <button onclick="eliminarAlerta('${alerta._id}')" style="background: #c62828; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">❌</button>
                        </td>
                    </tr>
                `;
            });
        }

        // ✅ 2. Renderizar Histórico de Tratados (Resolvidos e Ignorados)
        if (tratados.length === 0) {
            tabelaResolvidos.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px; color: #888;">Nenhum registo no histórico de resoluções.</td></tr>`;
        } else {
            tratados.forEach(alerta => {
                const dataTratamento = new Date(alerta.updatedAt || alerta.dataHora).toLocaleString('pt-PT');
                const nomeLote = formatarNomeLote(alerta.loteCultivoId);
                
                const badgeEstado = alerta.estado === 'resolvido' 
                    ? `<span class="badge badge-resolvido" style="background: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9;">Resolvido</span>`
                    : `<span class="badge" style="background: #fff3e0; color: #e65100; border: 1px solid #ffe0b2; padding: 3px 8px; border-radius: 4px; font-size: 12px;">Ignorado</span>`;

                tabelaResolvidos.innerHTML += `
                    <tr style="border-bottom: 1px solid #eee; background: #fafafa; color: #777;">
                        <td style="padding: 12px;">${nomeLote}</td>
                        <td style="padding: 12px; text-decoration: line-through;">${alerta.mensagem}</td>
                        <td style="padding: 12px; font-style: italic; color: #555;">"${alerta.justificacao || 'Sem justificação anotada.'}"</td>
                        <td style="padding: 12px;">${dataTratamento}</td>
                        <td style="padding: 12px;">${badgeEstado}</td>
                        <td style="padding: 12px; text-align: center;">
                            <button onclick="eliminarAlerta('${alerta._id}')" style="background: none; border: none; color: #c62828; cursor: pointer; font-weight: bold;">🗑️</button>
                        </td>
                    </tr>
                `;
            });
        }

    } catch (err) {
        mostrarMensagem('erro', err.message);
    }
}

// 📤 POST / PUT — Salvar as alterações ou criar um novo alerta
async function guardarAlerta(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    const id = document.getElementById('alerta-id').value;
    const loteCultivoId = document.getElementById('form-lote').value;
    const nivel = document.getElementById('form-nivel').value;
    const mensaje = document.getElementById('form-mensagem').value;

    const dados = { loteCultivoId, nivel, mensagem: mensaje };

    const url = id ? `http://localhost:3000/alertas/${id}` : 'http://localhost:3000/alertas';
    const metodo = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(dados)
        });

        const resultado = await res.json();
        if (!res.ok) throw new Error(resultado.erro || "Falha ao submeter os dados do alerta.");

        mostrarMensagem('sucesso', id ? "Alerta atualizado com sucesso!" : "Novo alerta registado no sistema!");
        limparFormulario();
        carregarAlertas(token);
    } catch (err) {
        mostrarMensagem('erro', err.message);
    }
}

// ✏️ Colocar o Alerta em modo de edição
function prepararEdicao(id, loteId, nivel, mensagem) {
    document.getElementById('alerta-id').value = id;
    document.getElementById('form-lote').value = loteId;
    document.getElementById('form-nivel').value = nivel;
    document.getElementById('form-mensagem').value = mensagem;

    document.getElementById('form-titulo').innerText = "✏️ Editar Parâmetros do Alerta";
    document.getElementById('btn-submeter').innerText = "Atualizar Alerta";
    document.getElementById('btn-cancelar-edicao').style.display = 'inline-block';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 🔀 PUT /alertas/:id — Transição de Estado com Justificação Obrigatória
async function alterarEstadoAlerta(id, novoEstado) {
    const token = localStorage.getItem('token');
    const acaoTexto = novoEstado === 'resolvido' ? "resolver" : "ignorar";
    
    const justificacao = prompt(`Introduza a justificação obrigatória para ${acaoTexto} este alerta:`);
    if (justificacao === null) return; 

    if (!justificacao.trim()) {
        mostrarMensagem('erro', `Erro: É obrigatório inserir uma justificação para marcar como ${novoEstado}.`);
        return;
    }

    try {
        const res = await fetch(`http://localhost:3000/alertas/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                estado: novoEstado,
                justificacao: justificacao.trim() 
            })
        });

        if (!res.ok) {
            const resultado = await res.json();
            throw new Error(resultado.erro || "Não foi possível alterar o estado do alerta.");
        }

        mostrarMensagem('sucesso', `Alerta marcado como ${novoEstado}!`);
        carregarAlertas(token);
    } catch (err) {
        mostrarMensagem('erro', err.message);
    }
}

// ❌ DELETE /alertas/:id — Eliminação Permanente
async function eliminarAlerta(id) {
    if (!confirm("Deseja eliminar definitivamente este registo?")) return;
    const token = localStorage.getItem('token');

    try {
        const res = await fetch(`http://localhost:3000/alertas/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            const resultado = await res.json();
            throw new Error(resultado.erro || "Não foi possível remover o alerta.");
        }

        mostrarMensagem('sucesso', "Alerta removido com sucesso.");
        carregarAlertas(token);
    } catch (err) {
        mostrarMensagem('erro', err.message);
    }
}

// 🧼 Limpar Formulário
function limparFormulario() {
    document.getElementById('form-alerta').reset();
    document.getElementById('alerta-id').value = '';
    document.getElementById('form-titulo').innerText = "➕ Registar Novo Alerta Manual";
    document.getElementById('btn-submeter').innerText = "Salvar Alerta";
    document.getElementById('btn-cancelar-edicao').style.display = 'none';
}

// 📢 Exibir Notificações
function mostrarMensagem(tipo, texto) {
    const divSucesso = document.getElementById('msg-alerta-sucesso');
    const divErro = document.getElementById('msg-alerta-erro');

    divSucesso.style.display = 'none';
    divErro.style.display = 'none';

    if (tipo === 'sucesso') {
        divSucesso.innerText = texto;
        divSucesso.style.display = 'block';
        setTimeout(() => divSucesso.style.display = 'none', 5000);
    } else {
        divErro.innerText = texto;
        divErro.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Logout
const btnLogout = document.getElementById('btn-logout');
if (btnLogout) {
    btnLogout.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        window.location.href = 'login.html';
    });
}