const API_URL = 'http://localhost:3000';

// Função utilitária para exibir mensagens e erros
const exibirResultado = (data) => {
    const container = document.getElementById('dados-cliente');
    const infoGeral = document.getElementById('info-geral');
    const tabelaBody = document.getElementById('tabela-consumo');

    // 1. Limpar tudo antes de começar
    tabelaBody.innerHTML = '';
    infoGeral.innerHTML = '';
    
    // 2. Verificar se recebemos um Array (Lista de Clientes) ou um Objeto Único
    const listaClientes = Array.isArray(data) ? data : [data];

    // 3. Validar se há dados reais
    if (listaClientes.length === 0 || (!listaClientes[0].clienteId && !data.clienteId)) {
        alert("Nenhum dado encontrado");
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';

    // 4. Iterar sobre os clientes (se for só um, o loop corre apenas uma vez)
    listaClientes.forEach(cliente => {
        // Criar um cabeçalho para cada cliente na lista
        const header = document.createElement('div');
        header.style.borderBottom = "1px solid #444";
        header.style.marginBottom = "10px";
        header.innerHTML = `
            <p><strong>ID:</strong> ${cliente.clienteId} | <strong>Nome:</strong> ${cliente.nome}</p>
            <p><strong>Morada:</strong> ${cliente.endereco.rua}, ${cliente.endereco.numero} - ${cliente.endereco.cidade}, ${cliente.endereco.codigoPostal}</p>
        `;
        infoGeral.appendChild(header);

        // Adicionar os consumos deste cliente à tabela
        cliente.consumo.forEach(item => {
            const row = `
                <tr>
                    <td>${cliente.nome} (${item.mes}/${item.ano})</td>
                    <td>${item.kWhConsumido} kWh</td>
                    <td>${item.custoTotal} €</td>
                </tr>
            `;
            tabelaBody.innerHTML += row;
        });
    });
};

// 11. Obter dados do endpoint (GET)
async function buscarCliente() {
    const id = document.getElementById('searchId').value;
    if (!id) return alert("Insere um ID!");

    try {
        const res = await fetch(`${API_URL}/consumos/${id}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Erro desconhecido');
        exibirResultado(data);
    } catch (err) {
        exibirResultado({ erro: err.message });
    }
}

async function listarTodos() {
    try {
        const res = await fetch(`${API_URL}/consumos`);
        const data = await res.json();
        exibirResultado(data);
    } catch (err) {
        exibirResultado({ erro: "Erro ao ligar ao servidor" });
    }
}

// 12. Interface para os restantes endpoints

// POST: Adicionar Consumo
async function adicionarConsumo() {
    const id = document.getElementById('postClienteId').value;
    const corpo = {
        mes: document.getElementById('mes').value,
        ano: parseInt(document.getElementById('ano').value),
        kWhConsumido: parseFloat(document.getElementById('kwh').value)
    };

    try {
        const res = await fetch(`${API_URL}/consumos/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(corpo)
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error);
        alert("Consumo adicionado com sucesso!");
        exibirResultado(data);
    } catch (err) {
        alert("Erro: " + err.message);
    }
}

// PUT: Atualizar Endereço
async function atualizarEndereco() {
    const id = document.getElementById('putId').value;
    const endereco = {
        rua: document.getElementById('rua').value,
        cidade: document.getElementById('cidade').value
        // Podes adicionar número e código postal se quiseres completar o formulário
    };

    try {
        const res = await fetch(`${API_URL}/endereco/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(endereco)
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error);
        alert("Endereço atualizado!");
        exibirResultado(data);
    } catch (err) {
        alert("Erro: " + err.message);
    }
}

// DELETE: Eliminar Consumo
async function eliminarConsumo() {
    const id = document.getElementById('delId').value;
    const mes = document.getElementById('delMes').value;

    if (!confirm(`Tens a certeza que queres apagar o consumo de ${mes}?`)) return;

    try {
        const res = await fetch(`${API_URL}/consumos/${id}/${mes}`, {
            method: 'DELETE'
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error);
        alert(data.message);
        listarTodos();
    } catch (err) {
        alert("Erro: " + err.message);
    }
}