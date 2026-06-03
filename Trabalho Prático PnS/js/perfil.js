document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) {
        window.location.href = 'login.html';
        return;
    }

    // 1. Carrega os dados do utilizador logado para os campos do formulário de cima
    await carregarOsMeusDados(token, userId);
    
    // 2. Configura a submissão do formulário do próprio perfil
    configurarFormularioProprio(token, userId);
});

// 📥 Carrega os dados do utilizador atual para o topo da página
async function carregarOsMeusDados(token, userId) {
    try {
        const res = await fetch(`http://localhost:3000/utilizadores/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const utilizador = await res.json();

        document.getElementById('meu-nome').value = utilizador.nome || '';
        document.getElementById('meu-email').value = utilizador.email || '';
        document.getElementById('minha-etiqueta-cargo').innerText = utilizador.tipo || 'tecnico';

        // 🔥 SE FOR ADMIN: Ativa a tabela de administração e os formulários de controlo de membros
        if (utilizador.tipo === 'administrador') {
            document.getElementById('area-admin-utilizadores').style.display = 'block';
            carregarListaUtilizadores(token, userId);
            configurarFormularioMembros(token, userId);
            configurarFormularioCriarUtilizador(token, userId); // 🆕 Inicializa o novo formulário de criação
        }
    } catch (err) {
        console.error(err);
        mostrarMensagem('msg-perfil-erro', 'Erro ao obter dados do teu perfil.');
    }
}

// 📤 Grava as alterações que o utilizador faz no seu próprio perfil
function configurarFormularioProprio(token, userId) {
    document.getElementById('form-meu-perfil').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const dadosProprios = {
            nome: document.getElementById('meu-nome').value,
            email: document.getElementById('meu-email').value
        };

        try {
            const res = await fetch(`http://localhost:3000/utilizadores/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(dadosProprios)
            });

            if (!res.ok) throw new Error('Não foi possível salvar as alterações do teu perfil.');
            
            mostrarMensagem('msg-perfil-sucesso', 'O teu perfil foi updated com sucesso!');
        } catch (err) {
            mostrarMensagem('msg-perfil-erro', err.message);
        }
    });
}

/* ==========================================================================
   ⚙️ SECÇÃO EXCLUSIVA DE ADMINISTRAÇÃO (GERIR OUTROS UTILIZADORES)
   ========================================================================== */

// 🆕 CRIAR UTILIZADOR (POST): Executado estritamente por Administradores
function configurarFormularioCriarUtilizador(token, meuId) {
    document.getElementById('form-criar-utilizador').addEventListener('submit', async (e) => {
        e.preventDefault();

        const dadosNovoUtilizador = {
            nome: document.getElementById('novo-nome').value,
            email: document.getElementById('novo-email').value,
            password: document.getElementById('novo-password').value,
            tipo: document.getElementById('novo-tipo').value
        };

        try {
            const res = await fetch('http://localhost:3000/utilizadores', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(dadosNovoUtilizador)
            });

            const resultado = await res.json();
            
            // Lida com eventuais erros de validação vindos do backend (Ex: email duplicado)
            if (!res.ok) throw new Error(resultado.erro || resultado.message || 'Falha ao registar utilizador.');

            mostrarMensagem('msg-perfil-sucesso', 'Nova conta de utilizador criada e registada!');
            document.getElementById('form-criar-utilizador').reset();
            
            // Recarrega a listagem para mostrar o novo membro no fundo da tabela imediatamente
            carregarListaUtilizadores(token, meuId);

        } catch (err) {
            mostrarMensagem('msg-perfil-erro', err.message);
        }
    });
}

// 📥 LER (GET): Mostra a lista de toda a equipa na tabela de baixo
async function carregarListaUtilizadores(token, meuId) {
    try {
        const res = await fetch('http://localhost:3000/utilizadores', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const utilizadores = await res.json();

        const tabelaCorpo = document.getElementById('tabela-utilizadores-corpo');
        tabelaCorpo.innerHTML = '';

        utilizadores.forEach(u => {
            const nome = u.nome || 'Sem Nome';
            const email = u.email || 'Sem Email';
            const tipo = u.tipo || 'tecnico';

            const nomeEscapado = nome.replace(/'/g, "\\'");

            let corCargo = '#777';
            if (tipo === 'administrador') corCargo = '#d32f2f';
            if (tipo === 'responsavel') corCargo = '#8e24aa';

            // Impede o admin de clicar para se auto-eliminar na tabela de baixo
            const botaoApagar = u._id === meuId
                ? `<button disabled style="background:#ccc; border:none; padding:6px 10px; color:white; border-radius:4px; cursor:not-allowed;">🗑️</button>`
                : `<button onclick="eliminarUtilizador('${u._id}')" style="background:#e53935; border:none; padding:6px 10px; cursor:pointer; color:white; border-radius:4px; font-weight:bold;">🗑️</button>`;

            tabelaCorpo.innerHTML += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px; font-weight: bold;">${nome} ${u._id === meuId ? '<span style="color:#2e7d32; font-size:11px;">(Tu)</span>' : ''}</td>
                    <td style="padding: 12px; color: #555;">${email}</td>
                    <td style="padding: 12px;"><span style="color:white; background:${corCargo}; padding:3px 8px; border-radius:12px; font-size:11px; font-weight:bold; text-transform:uppercase;">${tipo}</span></td>
                    <td style="padding: 12px; text-align: center;">
                        <div style="display: flex; gap: 6px; justify-content: center;">
                            <button onclick="prepararEdicaoMembro('${u._id}', '${nomeEscapado}', '${email}', '${tipo}')" style="background:#f9a825; border:none; padding:6px 10px; cursor:pointer; color:white; border-radius:4px; font-weight:bold;">✏️</button>
                            ${botaoApagar}
                        </div>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error(err);
    }
}

// 📤 ALTERAR MEMBRO (PUT)
function configurarFormularioMembros(token, meuId) {
    document.getElementById('form-editar-membro').addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('membro-id').value;
        const dadosMembro = {
            nome: document.getElementById('membro-nome').value,
            email: document.getElementById('membro-email').value,
            tipo: document.getElementById('membro-tipo').value
        };

        try {
            const res = await fetch(`http://localhost:3000/utilizadores/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(dadosMembro)
            });

            if (!res.ok) throw new Error('Falha ao modificar permissões do utilizador.');

            mostrarMensagem('msg-perfil-sucesso', 'Utilizador atualizado com sucesso!');
            cancelarEdicaoMembro();
            
            // Recarrega tudo para refletir as alterações
            carregarOsMeusDados(token, meuId);
        } catch (err) {
            mostrarMensagem('msg-perfil-erro', err.message);
        }
    });
}

// Abre a caixa amarela de edição para o utilizador selecionado
function prepararEdicaoMembro(id, nome, email, tipo) {
    document.getElementById('membro-id').value = id;
    document.getElementById('membro-nome').value = nome;
    document.getElementById('membro-email').value = email;
    document.getElementById('membro-tipo').value = tipo;

    document.getElementById('card-editar-membro').style.display = 'block';
    document.getElementById('titulo-form-membro').innerText = `✏️ A Modificar Linha de Acesso: "${nome}"`;
    window.scrollTo({ top: document.getElementById('card-editar-membro').offsetTop, behavior: 'smooth' });
}

function cancelarEdicaoMembro() {
    document.getElementById('form-editar-membro').reset();
    document.getElementById('membro-id').value = '';
    document.getElementById('card-editar-membro').style.display = 'none';
}

// 🗑️ APAGAR MEMBRO (DELETE)
async function eliminarUtilizador(id) {
    if (!confirm('Aviso: Tem a certeza que pretende remover permanentemente esta conta? O utilizador perderá o acesso imediatamente.')) return;

    const token = localStorage.getItem('token');
    const meuId = localStorage.getItem('userId');

    try {
        const res = await fetch(`http://localhost:3000/utilizadores/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Não foi possível excluir a conta.');

        mostrarMensagem('msg-perfil-sucesso', 'Conta eliminada com sucesso da base de dados.');
        carregarListaUtilizadores(token, meuId);
    } catch (err) {
        mostrarMensagem('msg-perfil-erro', err.message);
    }
}

// Controlador das caixas de mensagem temporárias
function mostrarMensagem(idDiv, texto) {
    const div = document.getElementById(idDiv);
    div.innerText = texto;
    div.style.display = 'block';
    setTimeout(() => { div.style.display = 'none'; }, 4000);
}

// Sair do sistema
document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
});