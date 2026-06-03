document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Arrancar carregamentos do CRUD
    carregarUtilizadoresNoForm(token);
    carregarLogsDoSistema(token);
    configurarJanelaModal(token);
});

// Puxa a lista de utilizadores para podermos associar ao campo "utilizadorId"
async function carregarUtilizadoresNoForm(token) {
    const selectUser = document.getElementById('log-utilizador');
    try {
        const res = await fetch('http://localhost:3000/utilizadores', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const users = await res.json();

        selectUser.innerHTML = '<option value="">-- Escolha o Utilizador --</option>';
        users.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u._id;
            opt.text = `${u.nome} (${u.tipo || 'Operador'})`;
            selectUser.appendChild(opt);
        });
    } catch (err) {
        console.error("Erro ao importar lista de utilizadores:", err);
    }
}

// READ: Mostra a tabela de auditoria completa
async function carregarLogsDoSistema(token) {
    const tbody = document.getElementById('tabela-logs-corpo');
    try {
        const res = await fetch('http://localhost:3000/logs-auditoria', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const logs = await res.json();

        tbody.innerHTML = '';

        if (logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #777;">Nenhuma atividade gravada até ao momento.</td></tr>';
            return;
        }

        logs.forEach(l => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = "1px solid #eee";

            // Formatação completa legível de Data e Hora
            const dataFormatada = l.dataHora ? new Date(l.dataHora).toLocaleString('pt-PT') : '--';
            
            // Vai buscar o nome do utilizador de forma segura (se vier preenchido do populate)
            const nomeUtilizador = l.utilizadorId && l.utilizadorId.nome ? l.utilizadorId.nome : 'Utilizador Desconhecido';
            const idDoUtilizador = l.utilizadorId?._id || l.utilizadorId;

            // Formata a data para carregar corretamente no input do tipo "datetime-local" quando formos editar
            let dataParaInput = '';
            if (l.dataHora) {
                const d = new Date(l.dataHora);
                d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); // Ajusta fuso horário local
                dataParaInput = d.toISOString().slice(0, 16);
            }

            tr.innerHTML = `
                <td style="padding: 12px; font-weight: bold; color: #455a64;">👤 ${nomeUtilizador}</td>
                <td style="padding: 12px; color: #333;">${l.acao}</td>
                <td style="padding: 12px;"><code style="background: #eceff1; padding: 3px 6px; border-radius: 4px; font-family: monospace;">${l.entidade}</code></td>
                <td style="padding: 12px; color: #666; font-size: 14px;">${dataFormatada}</td>
                <td style="padding: 12px; text-align: center;">
                    <button onclick="prepararEdicaoLog('${l._id}', '${idDoUtilizador}', '${escapeTexto(l.acao)}', '${escapeTexto(l.entidade)}', '${dataParaInput}')" style="background: #f9a825; border: none; padding: 5px 8px; cursor: pointer; color: white; border-radius: 4px; margin-right: 5px;">✏️</button>
                    <button onclick="eliminarLog('${l._id}')" style="background: #e53935; border: none; padding: 5px 8px; cursor: pointer; color: white; border-radius: 4px;">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #c62828;">Falha ao carregar registos de auditoria.</td></tr>';
    }
}

// CREATE e UPDATE: Submissão do formulário do modal
function configurarJanelaModal(token) {
    const modal = document.getElementById('modal-log');
    const btnAbrir = document.getElementById('btn-abrir-modal');
    const btnFechar = document.getElementById('btn-fechar-modal');
    const form = document.getElementById('form-log');

    btnAbrir.addEventListener('click', () => {
        form.reset();
        document.getElementById('log-id').value = '';
        document.getElementById('titulo-modal').innerText = '➕ Adicionar Registo de Auditoria';
        modal.style.display = 'flex';
    });

    btnFechar.addEventListener('click', () => { modal.style.display = 'none'; });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('log-id').value;
        
        const payload = {
            utilizadorId: document.getElementById('log-utilizador').value,
            acao: document.getElementById('log-acao').value,
            entidade: document.getElementById('log-entidade').value
        };

        // Trata a data facultativa do formulário
        const dataInput = document.getElementById('log-datahora').value;
        if (dataInput) {
            payload.dataHora = new Date(dataInput).toISOString();
        }

        const url = id ? `http://localhost:3000/logs-auditoria/${id}` : 'http://localhost:3000/logs-auditoria';
        const metodo = id ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: metodo,
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Não foi possível gravar o log de segurança.');

            modal.style.display = 'none';
            form.reset();
            carregarLogsDoSistema(token);

        } catch (err) {
            alert(err.message);
        }
    });
}

// Prepara os dados para o formulário de alteração (Update)
function prepararEdicaoLog(id, userId, acao, entidade, dataHora) {
    document.getElementById('log-id').value = id;
    document.getElementById('log-utilizador').value = userId;
    document.getElementById('log-acao').value = acao;
    document.getElementById('log-entidade').value = entidade;
    document.getElementById('log-datahora').value = dataHora;

    document.getElementById('titulo-modal').innerText = '✏️ Alterar Registo de Auditoria';
    document.getElementById('modal-log').style.display = 'flex';
}

// DELETE: Apaga um registo de auditoria
async function eliminarLog(id) {
    if (!confirm('Atenção: Deseja mesmo apagar este registo de auditoria?')) return;

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`http://localhost:3000/logs-auditoria/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Erro ao apagar log do servidor.');

        carregarLogsDoSistema(token);
    } catch (err) {
        alert(err.message);
    }
}

function escapeTexto(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}