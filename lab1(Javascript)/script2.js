// Obter o elemento do botão
const botao = document.getElementById("botao");

// Adicionar um event hendler ao botão
botao.addEventListener("click", function() {
    // Manipular o elemento h1
    const h1 = document.querySelector("h1");
    h1.textContent = "olá, mundo!";
    h1.style.color = "red";
});

// selecionar o campo de texto recém-criado
const campo = document.getElementById("campoTexto");

campo.addEventListener("keydown", function(event ) {
    if (event.key === "Enter") {
        console.log("enter pressionado");
    }
});

// remover item da lista quando clicado
const lista = document.getElementById("lista");

lista.addEventListener("click", function(event) {
    // certifica-se que clicou numa <li>
    if (event.target && event.target.nodeName === "LI") {
        event.target.remove();
    }
});