document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DE NAVEGAÇÃO INTEGRADA ---
    const btnMenuErvas = document.getElementById('btn-menu-ervas');
    const containerDashboard = document.getElementById('container-dashboard');
    const containerErvas = document.getElementById('container-ervas');
    const tabelaCorpo = document.getElementById('tabelaErvasCorpo');
    
    // CSV Elementos
    const btnExportar = document.getElementById('btnExportarCsv');
    const inputImportar = document.getElementById('inputImportarCsv');
    const btnImportar = document.getElementById('btnImportarCsv');
    const nomeFicheiroTxt = document.getElementById('nomeFicheiroSelecionado');

    // Modal Elementos
    const modal = document.getElementById('modalErva');
    const formErva = document.getElementById('formErva');
    const modalTitulo = document.getElementById('modalTitulo');
    const formErvaId = document.getElementById('formErvaId');
    const formNome = document.getElementById('formNome');
    const formEspecie = document.getElementById('formEspecie');
    const formDescricao = document.getElementById('formDescricao');
    const btnAbrirModal = document.getElementById('btnAbrirModalCriar');
    const btnFecharModal = document.getElementById('btnFecharModal');
    const btnCancelarForm = document.getElementById('btnCancelarForm');

    const API_URL = 'http://localhost:3000/ervas';

    // --- CONTROLO DE ALTERNÂNCIA DE MENUS ---
    if (btnMenuErvas) {
        btnMenuErvas.addEventListener('click', () => {
            // Se já estiver ativo, volta ao dashboard normal
            if (containerErvas.style.display === 'block') {
                containerErvas.style.display = 'none';
                containerDashboard.style.display = 'block';
                btnMenuErvas.style.background = '#2e7d32'; // Volta à cor base
            } else {
                // Esconde a monitorização e ativa o catálogo de ervas
                containerDashboard.style.display = 'none';
                containerErvas.style.display = 'block';
                btnMenuErvas.style.background = '#1b5e20'; // Escurece o botão ativo
                
                carregarTabelaErvas();
            }
        });
    }

    // --- CARREGAR REGISTOS (READ) ---
    async function carregarTabelaErvas() {
        tabelaCorpo.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #88s;"><i class="fas fa-spinner fa-spin"></i> A ler dados do MongoDB...</td></tr>`;
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(API_URL, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Falha ao descarregar registos.');

            const ervas = await response.json();
            tabelaCorpo.innerHTML = '';

            if (ervas.length === 0) {
                tabelaCorpo.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #666;">Nenhuma espécie registada no sistema.</td></tr>`;
                return;
            }

            ervas.forEach(erva => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = "1px solid #eee";
                tr.innerHTML = `
                    <td style="padding: 12px;">${erva.nome}</td>
                    <td style="padding: 12px; font-style: italic;">${erva.especie}</td>
                    <td style="padding: 12px; color: #555;">${erva.descricao || ''}</td>
                    <td style="padding: 12px; text-align: center;">
                        <button class="btn-api-editar" data-id="${erva._id}" style="background:none; border:none; color:#2196f3; cursor:pointer; margin-right:12px; font-size:15px;"><i class="fas fa-edit"></i></button>
                        <button class="btn-api-eliminar" data-id="${erva._id}" style="background:none; border:none; color:#d32f2f; cursor:pointer; font-size:15px;"><i class="fas fa-trash-alt"></i></button>
                    </td>
                `;
                tabelaCorpo.appendChild(tr);
            });

            configurarBotoesTabela();

        } catch (err) {
            tabelaCorpo.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #d32f2f; padding: 20px;">Erro: ${err.message}</td></tr>`;
        }
    }

    // --- EXPORTAR CSV ---
    btnExportar.addEventListener('click', async () => {
        try {
            const token = localStorage.getItem('token');
            btnExportar.disabled = true;
            btnExportar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A processar...';

            const response = await fetch(`${API_URL}/exportar`, {
                method: 'GET',
                headers: { 
                    'Authorization': `Bearer ${localStorage.getItem('token')}`, // ESSENCIAL!
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Erro do servidor ao gerar o ficheiro.');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `greenherb-especies-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            alert(`Falha na exportação: ${err.message}`);
        } finally {
            btnExportar.disabled = false;
            btnExportar.innerHTML = '<i class="fas fa-download"></i> Exportar CSV';
        }
    });

    // --- IMPORTAR CSV ---
    inputImportar.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            nomeFicheiroTxt.textContent = file.name;
            btnImportar.disabled = false;
            btnImportar.style.opacity = '1';
            btnImportar.style.cursor = 'pointer';
        }
    });

    btnImportar.addEventListener('click', async () => {
        const file = inputImportar.files[0];
        if (!file) return;

        try {
            const token = localStorage.getItem('token');
            btnImportar.disabled = true;
            btnImportar.innerHTML = '<i class="fas fa-spinner fa-spin"></i>...';

            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_URL}/import`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const dados = await response.json();
            if (!response.ok) throw new Error(dados.erro || 'Falha ao processar.');

            alert(`Importação concluída! Carregadas ${dados.registosImportados} espécies.`);
            inputImportar.value = '';
            nomeFicheiroTxt.textContent = 'Nenhum ficheiro...';
            btnImportar.disabled = true;
            btnImportar.style.opacity = '0.6';
            
            carregarTabelaErvas();
        } catch (err) {
            alert(`Erro na Importação: ${err.message}`);
        } finally {
            btnImportar.innerHTML = '<i class="fas fa-upload"></i> Importar';
        }
    });

    // --- ENVIAR FORMULÁRIO (CREATE & UPDATE) ---
    formErva.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const id = formErvaId.value;

        const payload = {
            nome: formNome.value,
            especie: formEspecie.value,
            descricao: formDescricao.value
        };

        const URL_ALVO = id ? `${API_URL}/${id}` : API_URL;
        const METODO = id ? 'PUT' : 'POST';

        try {
            const response = await fetch(URL_ALVO, {
                method: METODO,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const resultado = await response.json();
            if (!response.ok) throw new Error(resultado.erro || 'Erro ao submeter dados.');

            fecharModalForm();
            carregarTabelaErvas();
        } catch (err) {
            alert(err.message);
        }
    });

    // --- CONFIGURAR CLIQUES DE EDITAR E ELIMINAR ---
    function configurarBotoesTabela() {
        document.querySelectorAll('.btn-api-editar').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                const token = localStorage.getItem('token');
                
                try {
                    const response = await fetch(`${API_URL}/${id}`, {
                        method: 'GET',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) throw new Error('Não foi possível ler os dados.');
                    
                    const erva = await response.json();
                    
                    formErvaId.value = erva._id;
                    formNome.value = erva.nome;
                    formEspecie.value = erva.especie;
                    formDescricao.value = erva.descricao || '';
                    
                    modalTitulo.textContent = 'Editar Erva Aromática';
                    modal.style.display = 'flex';
                } catch (err) {
                    alert(err.message);
                }
            });
        });

        document.querySelectorAll('.btn-api-eliminar').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                if (!confirm('Deseja eliminar esta espécie do catálogo?')) return;

                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch(`${API_URL}/${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    const res = await response.json();
                    if (!response.ok) throw new Error(res.erro || 'Falha ao apagar.');

                    carregarTabelaErvas();
                } catch (err) {
                    alert(err.message);
                }
            });
        });
    }

    // --- CONTROLO VISUAL DO MODAL ---
    if (btnAbrirModal) {
        btnAbrirModal.addEventListener('click', () => {
            formErva.reset();
            formErvaId.value = '';
            modalTitulo.textContent = 'Adicionar Nova Erva';
            modal.style.display = 'flex';
        });
    }

    function fecharModalForm() { modal.style.display = 'none'; }
    if (btnFecharModal) btnFecharModal.addEventListener('click', fecharModalForm);
    if (btnCancelarForm) btnCancelarForm.addEventListener('click', fecharModalForm);
});