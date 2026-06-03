document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Inicializar a recolha de dados
    carregarLotesNoDropdown(token);
    carregarTarefasDaEstufa(token);
    configurarEventosModal(token);
});

// Puxa os lotes para o utilizador saber a qual lote vai associar a tarefa
async function carregarLotesNoDropdown(token) {
    const selectLote = document.getElementById('tarefa-lote');
    try {
        const res = await fetch('http://localhost:3000/lotes', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const lotes = await res.json();

        selectLote.innerHTML = '<option value="">-- Escolha o Lote --</option>';
        lotes.forEach(lote => {
            const opt = document.createElement('option');
            opt.value = lote._id;
            opt.text = `${lote.localizacao || 'Bancada'} (${lote.quantidade} plantas)`;
            selectLote.appendChild(opt);
        });
    } catch (err) {
        console.error("Erro ao carregar lotes:", err);
    }
}

// Faz o "Read" (Ver) do CRUD
async function carregarTarefasDaEstufa(token) {
    const tbody = document.getElementById('tabela-tarefas-corpo');
    try {
        const res = await fetch('http://localhost:3000/tarefas', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const tarefas = await res.json();

        tbody.innerHTML = '';

        if (tarefas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #777;">Sem tarefas registadas de momento.</td></tr>';
            return;
        }

        tarefas.forEach(t => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = "1px solid #eee";

            // Formatação limpa de datas (AAAA-MM-DD)
            const dataP = t.dataPrevista ? new Date(t.dataPrevista).toISOString().split('T')[0] : '--';
            const dataE = t.dataExecucao ? new Date(t.dataExecucao).toISOString().split('T')[0] : '--';

            // Mapeamento visual do Enum do teu Schema
            let labelTipo = t.tipo;
            if (t.tipo === 'rega') labelTipo = '💧 Rega';
            if (t.tipo === 'fertilizacao') labelTipo = '🌿 Fertilização';
            if (t.tipo === 'colheita') labelTipo = '🧺 Colheita';
            if (t.tipo === 'monitorizacao') labelTipo = '🔍 Monitorização';

            const corEstado = t.estado === 'executada' ? '#2e7d32' : '#f9a825';
            const textoEstado = t.estado === 'executada' ? 'Executada' : 'Pendente';

            const localLote = t.loteCultivoId?.localizacao || 'Lote Removido/Inexistente';
            const idDoLote = t.loteCultivoId?._id || t.loteCultivoId;

            tr.innerHTML = `
                <td style="padding: 12px; font-weight: bold; color: #444;">📍 ${localLote}</td>
                <td style="padding: 12px;">${labelTipo}</td>
                <td style="padding: 12px; color: #666; font-size: 14px;">${t.descricao}</td>
                <td style="padding: 12px;">${dataP}</td>
                <td style="padding: 12px; color: #888;">${dataE}</td>
                <td style="padding: 12px;"><span style="color: ${corEstado}; font-weight: bold;">${textoEstado}</span></td>
                <td style="padding: 12px; text-align: center;">
                    <button onclick="prepararEdicao('${t._id}', '${idDoLote}', '${t.tipo}', '${escapeTexto(t.descricao)}', '${dataP}', '${t.dataExecucao ? dataE : ''}', '${t.estado}')" style="background: #f9a825; border: none; padding: 6px 10px; cursor: pointer; color: white; border-radius: 4px; margin-right: 5px;">✏️</button>
                    <button onclick="eliminarTarefa('${t._id}')" style="background: #e53935; border: none; padding: 6px 10px; cursor: pointer; color: white; border-radius: 4px;">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #c62828;">Erro ao carregar a lista de tarefas.</td></tr>';
    }
}

// Trata do "Create" (Adicionar) e "Update" (Editar)
function configurarEventosModal(token) {
    const modal = document.getElementById('modal-tarefa');
    const btnAbrir = document.getElementById('btn-abrir-modal');
    const btnFechar = document.getElementById('btn-fechar-modal');
    const form = document.getElementById('form-tarefa');

    btnAbrir.addEventListener('click', () => {
        form.reset();
        document.getElementById('tarefa-id').value = '';
        document.getElementById('titulo-modal').innerText = '➕ Agendar Nova Tarefa';
        modal.style.display = 'flex';
    });

    btnFechar.addEventListener('click', () => { modal.style.display = 'none'; });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('tarefa-id').value;
        
        // Objeto formatado de acordo com o teu Schema do Mongoose
        const payload = {
            loteCultivoId: document.getElementById('tarefa-lote').value,
            tipo: document.getElementById('tarefa-tipo').value,
            descricao: document.getElementById('tarefa-descricao').value,
            dataPrevista: document.getElementById('tarefa-data-prevista').value,
            estado: document.getElementById('tarefa-estado').value
        };

        const dataExec = document.getElementById('tarefa-data-execucao').value;
        if (dataExec) {
            payload.dataExecucao = dataExec;
        }

        const url = id ? `http://localhost:3000/tarefas/${id}` : 'http://localhost:3000/tarefas';
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

            if (!res.ok) throw new Error('Não foi possível salvar os dados da tarefa.');

            modal.style.display = 'none';
            form.reset();
            carregarTarefasDaEstufa(token);

        } catch (err) {
            alert(err.message);
        }
    });
}

// Preenche o modal com os dados antigos para o utilizador alterar
function prepararEdicao(id, loteId, tipo, descricao, dataP, dataE, estado) {
    document.getElementById('tarefa-id').value = id;
    document.getElementById('tarefa-lote').value = loteId;
    document.getElementById('tarefa-tipo').value = tipo;
    document.getElementById('tarefa-descricao').value = descricao;
    document.getElementById('tarefa-data-prevista').value = dataP;
    document.getElementById('tarefa-data-execucao').value = dataE;
    document.getElementById('tarefa-estado').value = estado;

    document.getElementById('titulo-modal').innerText = '✏️ Editar Tarefa';
    document.getElementById('modal-tarefa').style.display = 'flex';
}

// Trata do "Delete" (Apagar) do CRUD
async function eliminarTarefa(id) {
    if (!confirm('Pretende eliminar definitivamente esta tarefa?')) return;

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`http://localhost:3000/tarefas/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Erro ao apagar a tarefa selecionada.');

        carregarTarefasDaEstufa(token);
    } catch (err) {
        alert(err.message);
    }
}

function escapeTexto(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}