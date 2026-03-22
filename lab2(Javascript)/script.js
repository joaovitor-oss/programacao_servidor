function guardarLocal(){

    let nome = document.getElementById("nome").value;

    localStorage.setItem("nomeLocal", nome);

    console.log("Guardado no localStorage");

}

function guardarSession(){

    let nome = document.getElementById("nome").value;

    sessionStorage.setItem("nomeSession", nome);

    console.log("Guardado no sessionStorage");

}

function lerDados(){

    let local = localStorage.getItem("nomeLocal");
    let session = sessionStorage.getItem("nomeSession");

    console.log("LocalStorage:", local);
    console.log("SessionStorage:", session);

}

// 1. Declaração de variáveis globais no topo
let db;

// 2. Configuração do IndexedDB (Inicia assim que o script carrega)
const request = indexedDB.open("EscolaDB", 1);

request.onupgradeneeded = function(event) {
    db = event.target.result;
    if (!db.objectStoreNames.contains("alunos")) {
        db.createObjectStore("alunos", { keyPath: "id", autoIncrement: true });
        console.log("Object Store 'alunos' criada!");
    }
};

request.onsuccess = function(event) {
    db = event.target.result;
    console.log("Conectado ao IndexedDB!");
    atualizartabela(); 
};

request.onerror = function(event) {
    console.error("Erro ao abrir banco:", event.target.error);
};

// --- Funções do IndexedDB ---

function guardarAluno() {
    if (!db) {
        alert("Banco de dados não está pronto. Tente recarregar a página.");
        return;
    }

    const nomeInput = document.getElementById("nomeAluno");
    const idadeInput = document.getElementById("idade");

    const nomeValor = nomeInput.value.trim();
    const idadeValor = parseInt(idadeInput.value) || 0;

    if (nomeValor === "") {
        alert("Por favor, digite um nome.");
        return;
    }

    try {
        const transaction = db.transaction(["alunos"], "readwrite");
        const store = transaction.objectStore("alunos");

        // IMPORTANTE: Não coloque o campo 'id' aqui. 
        // Como definimos autoIncrement: true na criação, o banco vai gerar o ID.
        const aluno = {
            nome: nomeValor,
            idade: idadeValor
        };

        const requestAdd = store.add(aluno);

        requestAdd.onsuccess = function() {
            console.log("Aluno guardado com sucesso!");
            nomeInput.value = ""; 
            idadeInput.value = "";
            atualizartabela(); 
        };

        requestAdd.onerror = function(e) {
            console.error("Erro ao adicionar aluno:", e.target.error);
        };

    } catch (error) {
        console.error("Erro na transação:", error);
    }
}

function atualizartabela() {
    if (!db) return;

    let tbody = document.querySelector("#tabelaAlunos tbody");
    if (!tbody) return; // Segurança caso o HTML não tenha carregado
    
    tbody.innerHTML = ""; 

    let transaction = db.transaction(["alunos"], "readonly");
    let store = transaction.objectStore("alunos");
    let requestCursor = store.openCursor();

    requestCursor.onsuccess = function(event) {
        let cursor = event.target.result;
        if (cursor) {
            let row = document.createElement("tr");
            
            // Verifique se os nomes das propriedades (id, nome, idade) 
            // batem exatamente com o que você salvou no guardarAluno
            row.innerHTML = `
                <td>${cursor.value.id}</td>
                <td>${cursor.value.nome}</td>
                <td>${cursor.value.idade}</td>
            `;
            
            tbody.appendChild(row);
            cursor.continue();
        }
    };
}

// --- Funções de Local/Session Storage (Simplificadas e sem repetição) ---

function guardarLocal() {
    const nome = document.getElementById("nome").value;
    if(nome) {
        localStorage.setItem("nomeLocal", nome);
        console.log("Guardado no LocalStorage");
    }
}

function guardarSession() {
    const nome = document.getElementById("nome").value;
    if(nome) {
        sessionStorage.setItem("nomeSession", nome);
        console.log("Guardado no SessionStorage");
    }
}

function lerDados() {
    const local = localStorage.getItem("nomeLocal") || "Vazio";
    const session = sessionStorage.getItem("nomeSession") || "Vazio";
    console.log("LocalStorage:", local);
    console.log("SessionStorage:", session);
}