document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) {
        window.location.href = 'login.html';
        return;
    }

    const tipoUtilizador = await verificarNivelAcesso(token, userId);
    carregarCatálogoErvas(token, tipoUtilizador);
    configurarFormulario(token, tipoUtilizador);
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

// 📥 LER (GET): Procura as plantas e monta a tabela
async function carregarCatálogoErvas(token, tipoUtilizador) {
    try {
        const res = await fetch('http://localhost:3000/ervas', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Proteção contra respostas HTML do servidor nesta rota
        if (!res.ok) throw new Error('Erro ao carregar o catálogo do servidor.');
        
        const ervas = await res.json();
        const tabelaCorpo = document.getElementById('tabela-ervas-corpo');
        tabelaCorpo.innerHTML = '';

        if (ervas.length === 0) {
            tabelaCorpo.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #888;">O catálogo está vazio.</td></tr>`;
            return;
        }

        ervas.forEach(erva => {
            let botoesAcao = `<td style="text-align: center; color: #999; padding: 12px;">Sem permissão</td>`;
            
            if (tipoUtilizador === 'administrador' || tipoUtilizador === 'responsavel') {
                const nomeEscapado = erva.nome.replace(/'/g, "\\'");
                const especieEscapada = (erva.especie || '').replace(/'/g, "\\'");
                const descricaoEscapada = (erva.descricao || '').replace(/'/g, "\\'");

                botoesAcao = `
                    <td style="padding: 12px; text-align: center;">
                        <div style="display: flex; gap: 8px; justify-content: center; align-items: center;">
                            <button onclick="prepararEdicao('${erva._id}', '${nomeEscapado}', '${especieEscapada}', '${descricaoEscapada}')" style="background: #f9a825; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 13px;">✏️ Alterar</button>
                            <button onclick="eliminarErva('${erva._id}')" style="background: #e53935; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 13px;">🗑️ Apagar</button>
                        </div>
                    </td>
                `;
            }

            tabelaCorpo.innerHTML += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px; font-weight: bold; color: #2e7d32;">${erva.nome}</td>
                    <td style="padding: 12px; font-style: italic; color: #555;">${erva.especie || 'Não definida'}</td>
                    <td style="padding: 12px; color: #666;">${erva.descricao || 'Sem descrição.'}</td>
                    ${botoesAcao}
                </tr>
            `;
        });

    } catch (err) {
        mostrarMensagem('msg-erva-erro', 'Erro ao carregar o catálogo.');
    }
}

// 📤 CRIAR (POST) / ALTERAR (PUT)
function configurarFormulario(token, tipoUtilizador) {
    document.getElementById('form-erva').addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('erva-id').value;
        const nome = document.getElementById('erva-nome').value;
        const especie = document.getElementById('erva-especie').value;
        const descricao = document.getElementById('erva-descricao').value;

        const dadosErva = { nome, especie, descricao };
        
        let url = 'http://localhost:3000/ervas';
        let metodo = 'POST';

        if (id) {
            url = `http://localhost:3000/ervas/${id}`;
            metodo = 'PUT';
        }

        try {
            const res = await fetch(url, {
                method: metodo,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dadosErva)
            });

            // 🔥 SUPER PROTEÇÃO: Se o servidor responder com erro (ex: 404), validamos se veio HTML ou JSON
            if (!res.ok) {
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const resultado = await res.json();
                    throw new Error(resultado.erro || 'Erro na operação.');
                } else {
                    // Se o Express mandou um HTML "Cannot GET/PUT", captura aqui sem crashar o JSON
                    throw new Error(`Erro ${res.status}: A rota '${metodo} /ervas/${id || ""}' não existe no Backend!`);
                }
            }

            const resultado = await res.json();
            mostrarMensagem('msg-erva-sucesso', id ? 'Planta alterada com sucesso!' : 'Nova planta adicionada ao catálogo!');
            cancelarEdicao();
            carregarCatálogoErvas(token, tipoUtilizador);

        } catch (err) {
            mostrarMensagem('msg-erva-erro', err.message);
        }
    });
}

function prepararEdicao(id, nome, especie, descricao) {
    document.getElementById('erva-id').value = id;
    document.getElementById('erva-nome').value = nome;
    document.getElementById('erva-especie').value = especie;
    document.getElementById('erva-descricao').value = descricao;

    document.getElementById('titulo-formulario').innerText = `✏️ A Alterar Dados de: "${nome}"`;
    document.getElementById('btn-submeter').innerText = 'Guardar Alterações';
    document.getElementById('btn-submeter').style.background = '#f9a825';
    document.getElementById('btn-cancelar').style.display = 'inline-block';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelarEdicao() {
    document.getElementById('form-erva').reset();
    document.getElementById('erva-id').value = '';
    
    document.getElementById('titulo-formulario').innerText = '🌿 Adicionar Nova Erva ao Catálogo';
    document.getElementById('btn-submeter').innerText = 'Adicionar ao Catálogo';
    document.getElementById('btn-submeter').style.background = '#2e7d32';
    document.getElementById('btn-cancelar').style.display = 'none';
}

async function eliminarErva(id) {
    if (!confirm('Tem a certeza de que deseja eliminar esta planta?')) return;

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`http://localhost:3000/ervas/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Não foi possível eliminar a planta. Verifica a rota no Backend.');

        mostrarMensagem('msg-erva-sucesso', 'Planta removida com sucesso.');
        
        const userId = localStorage.getItem('userId');
        const tipoUtilizador = await verificarNivelAcesso(token, userId);
        carregarCatálogoErvas(token, tipoUtilizador);

    } catch (err) {
        mostrarMensagem('msg-erva-erro', err.message);
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