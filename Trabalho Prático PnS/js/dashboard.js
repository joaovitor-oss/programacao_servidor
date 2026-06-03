document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('nome-utilizador').innerText = "👤 Operador da Estufa";

    // Descobre o nível do utilizador para gerir botões de CRUD
    const tipoUtilizador = await verificarNivelAcesso(token, userId);

    // 1. Carrega os lotes existentes para o menu de filtro e para o modal
    carregarLotesNoSistema(token);

    // 2. Configura a janela flutuante (abrir, fechar, submeter)
    configurarControlosModal(token, tipoUtilizador);

    // 3. Ouvir quando o utilizador muda de lote no menu dropdown principal
    document.getElementById('filtro-lote').addEventListener('change', (e) => {
        const loteId = e.target.value;
        if (loteId) {
            atualizarDadosDoLote(loteId, token, tipoUtilizador);
        } else {
            limparEcra();
        }
    });
});

async function verificarNivelAcesso(token, userId) {
    if (!userId) return 'tecnico';
    try {
        const res = await fetch(`http://localhost:3000/utilizadores/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const user = await res.json();
        return user.tipo || 'tecnico';
    } catch (err) {
        return 'tecnico';
    }
}

async function carregarLotesNoSistema(token) {
    const selectFiltro = document.getElementById('filtro-lote');
    const selectSimulador = document.getElementById('simular-lote');
    
    try {
        const res = await fetch('http://localhost:3000/lotes', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const lotes = await res.json();

        selectFiltro.innerHTML = '<option value="">-- Escolha um Lote para Monitorizar --</option>';
        if (selectSimulador) {
            selectSimulador.innerHTML = '<option value="">-- Selecione o Lote Alvo --</option>';
        }

        lotes.forEach(lote => {
            const textoOpcao = `Lote: ${lote.localizacao || 'Bancada'} (Qtd: ${lote.quantidade})`;
            
            const optFiltro = document.createElement('option');
            optFiltro.value = lote._id;
            optFiltro.text = textoOpcao;
            selectFiltro.appendChild(optFiltro);

            if (selectSimulador) {
                const optSimulador = document.createElement('option');
                optSimulador.value = lote._id;
                optSimulador.text = textoOpcao;
                selectSimulador.appendChild(optSimulador);
            }
        });
    } catch (err) {
        console.error("Erro ao carregar lotes:", err);
    }
}

async function atualizarDadosDoLote(loteId, token, tipoUtilizador) {
    try {
        const resMedicoes = await fetch('http://localhost:3000/medicoes-ambientais', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const todasMedicoes = await resMedicoes.json();

        const medicoesDoLote = todasMedicoes.filter(m => m.loteCultivoId === loteId || (m.loteCultivoId && m.loteCultivoId._id === loteId));

        // 1. ATUALIZAR OS CARTÕES VISUAIS
        if (medicoesDoLote.length > 0) {
            const ultima = medicoesDoLote[0];
            document.getElementById('val-temperatura').innerText = ultima.temperatura;
            document.getElementById('val-humidade').innerText = ultima.humidade;
            document.getElementById('val-luminosidade').innerText = ultima.luminosidade;

            const horaFormatada = new Date(ultima.dataHora).toLocaleTimeString('pt-PT');
            document.getElementById('status-temperatura').innerText = `Última leitura às ${horaFormatada}`;
            document.getElementById('status-humidade').innerText = "Sensor Online";
            document.getElementById('status-luminosidade').innerText = "Sensor Online";
        } else {
            document.getElementById('val-temperatura').innerText = "--";
            document.getElementById('val-humidade').innerText = "--";
            document.getElementById('val-luminosidade').innerText = "--";
            document.getElementById('status-temperatura').innerText = "Sem leituras neste lote";
            document.getElementById('status-humidade').innerText = "Sem sinal";
            document.getElementById('status-luminosidade').innerText = "Sem sinal";
        }

        // 2. ATUALIZAR A TABELA HISTÓRICA
        const tbody = document.getElementById('tabela-historico');
        tbody.innerHTML = '';

        if (medicoesDoLote.length > 0) {
            medicoesDoLote.forEach(m => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = "1px solid #f4f4f4";
                
                const dataHora = new Date(m.dataHora).toLocaleString('pt-PT');
                
                let botoesAcao = `<span style="color: #aaa; font-size: 12px;">Sem permissão</span>`;
                if (tipoUtilizador === 'administrador' || tipoUtilizador === 'responsavel') {
                    botoesAcao = `
                        <button onclick="prepararEdicaoMedicao('${m._id}', '${loteId}', ${m.temperatura}, ${m.humidade}, ${m.luminosidade})" style="background: #f9a825; border: none; padding: 5px 8px; cursor: pointer; color: white; border-radius: 4px; font-weight: bold; margin-right: 5px;">✏️</button>
                        <button onclick="eliminarMedicao('${m._id}', '${loteId}')" style="background: #e53935; border: none; padding: 5px 8px; cursor: pointer; color: white; border-radius: 4px; font-weight: bold;">🗑️</button>
                    `;
                }

                tr.innerHTML = `
                    <td style="padding: 12px; font-size: 14px; color: #555;">${dataHora}</td>
                    <td style="padding: 12px; font-weight: 600;">${m.temperatura}°C</td>
                    <td style="padding: 12px;">${m.humidade}%</td>
                    <td style="padding: 12px; color: #777;">${m.luminosidade} Lux</td>
                    <td style="padding: 12px;"><span style="color: ${m.dadosValidos ? '#2e7d32' : '#c62828'}; font-weight: 600;">${m.dadosValidos ? 'Válido' : 'Inválido'}</span></td>
                    <td style="padding: 12px; text-align: center;">${botoesAcao}</td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="padding: 15px; text-align: center; color: #999;">Nenhuma medição encontrada. Simule dados para testar!</td></tr>';
        }

        carregarAlertasDoLote(loteId, token);

    } catch (err) {
        console.error("Erro ao processar dados do lote:", err);
    }
}

function configurarControlosModal(token, tipoUtilizador) {
    const modal = document.getElementById('modal-simulador');
    const btnAbrir = document.getElementById('btn-abrir-simulador');
    const btnFechar = document.getElementById('btn-fechar-modal');
    const form = document.getElementById('form-medicao');

    if (!modal || !btnAbrir) return;

    btnAbrir.addEventListener('click', () => {
        form.reset();
        document.getElementById('medicao-id').value = '';
        document.getElementById('titulo-modal').innerText = '➕ Simular Nova Leitura';
        
        // Coloca automaticamente no formulário o lote ativo no filtro principal
        const loteAtivo = document.getElementById('filtro-lote').value;
        document.getElementById('simular-lote').value = loteAtivo;

        modal.style.display = 'flex';
    });

    btnFechar.addEventListener('click', () => { modal.style.display = 'none'; });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('medicao-id').value;
        const loteAlvo = document.getElementById('simular-lote').value;

        const dadosEnvio = {
            loteCultivoId: loteAlvo,
            temperatura: Number(document.getElementById('simular-temperatura').value),
            humidade: Number(document.getElementById('simular-humidade').value),
            luminosidade: Number(document.getElementById('simular-luminosidade').value),
            dataHora: new Date().toISOString(),
            dadosValidos: true
        };

        const url = id ? `http://localhost:3000/medicoes-ambientais/${id}` : 'http://localhost:3000/medicoes-ambientais';
        const metodo = id ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: metodo,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(dadosEnvio)
            });

            if (!res.ok) throw new Error('Não foi possível gravar a medição.');

            modal.style.display = 'none';
            form.reset();

            document.getElementById('filtro-lote').value = loteAlvo;
            atualizarDadosDoLote(loteAlvo, token, tipoUtilizador);

        } catch (err) {
            alert(err.message);
        }
    });
}

function prepararEdicaoMedicao(id, loteId, temp, hum, lum) {
    document.getElementById('medicao-id').value = id;
    document.getElementById('simular-lote').value = loteId;
    document.getElementById('simular-temperatura').value = temp;
    document.getElementById('simular-humidade').value = hum;
    document.getElementById('simular-luminosidade').value = lum;

    document.getElementById('titulo-modal').innerText = '✏️ Editar Dados da Medição';
    document.getElementById('modal-simulador').style.display = 'flex';
}

async function eliminarMedicao(id, loteId) {
    if (!confirm('Tem a certeza que pretende apagar este registo do histórico?')) return;

    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    try {
        const res = await fetch(`http://localhost:3000/medicoes-ambientais/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Erro ao apagar a medição no servidor.');

        const tipoUtilizador = await verificarNivelAcesso(token, userId);
        atualizarDadosDoLote(loteId, token, tipoUtilizador);

    } catch (err) {
        alert(err.message);
    }
}

async function carregarAlertasDoLote(loteId, token) {
    try {
        const res = await fetch('http://localhost:3000/alertas', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const todosAlertas = await res.json();
        
        const listaContainer = document.getElementById('lista-alertas');
        const alertasDoLote = todosAlertas.filter(a => (a.loteCultivoId === loteId || (a.loteCultivoId && a.loteCultivoId._id === loteId)) && a.estado === 'ativo');

        if (alertasDoLote.length > 0) {
            listaContainer.innerHTML = '';
            alertasDoLote.forEach(alerta => {
                const div = document.createElement('div');
                div.className = 'alert-item';
                div.innerHTML = `
                    <div class="alert-info" style="margin-bottom: 10px; padding: 10px; background: #fff5f5; border-radius: 4px; border-left: 4px solid #d32f2f;">
                        <h4 style="margin: 0; color: #c62828;">⚠️ ${alerta.tipo}</h4>
                        <p style="margin: 5px 0 0 0; font-size: 14px;">${alerta.mensagem}</p>
                    </div>
                `;
                listaContainer.appendChild(div);
            });
        } else {
            listaContainer.innerHTML = '<p style="color: #2e7d32; font-weight: bold;">✅ Tudo limpo. Nenhum alerta ativo para este lote.</p>';
        }
    } catch (err) {
        console.error("Erro ao carregar alertas:", err);
    }
}

function limparEcra() {
    document.getElementById('val-temperatura').innerText = "--";
    document.getElementById('val-humidade').innerText = "--";
    document.getElementById('val-luminosidade').innerText = "--";
    document.getElementById('tabela-historico').innerHTML = '<tr><td colspan="6" style="padding: 15px; text-align: center; color: #999;">Escolha um lote acima para carregar o histórico de medições.</td></tr>';
    document.getElementById('lista-alertas').innerHTML = '<p style="color: #777;">Selecione um lote para verificar os alertas.</p>';
}

document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    window.location.href = 'login.html';
});