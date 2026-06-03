document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault(); // Impede a página de recarregar
document.addEventListener('DOMContentLoaded', () => {
    // Recuperar o tipo de utilizador guardado no login
    const userType = localStorage.getItem('userType'); 

    // Se for um Técnico comum, podemos ocultar os menus que ele não deve gerir diretamente
    if (userType === 'Técnico') {
        const menuAuditoria = document.getElementById('menu-auditoria');
        if (menuAuditoria) menuAuditoria.style.display = 'none';
        
        // Se a gestão de espécies de ervas (importar/criar) for EXCLUSIVA de Responsáveis/Admins:
        // const menuErvas = document.getElementById('menu-ervas');
        // if (menuErvas) menuErvas.style.display = 'none';
    }
});
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const divErro = document.getElementById('mensagem-erro');

    // Esconder mensagens de erro anteriores
    divErro.style.display = 'none';
    divErro.innerText = '';

    try {
        // Envia o pedido POST para a tua API do Backend
        const resposta = await fetch('http://localhost:3000/utilizadores/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const dadosRecebidos = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dadosRecebidos.erro || 'Falha no login. Verifique as credenciais.');
        }

        // 1. Guardar o Token JWT no LocalStorage
        localStorage.setItem('token', dadosRecebidos.token);
        
        // 2. 🔥 CORRIGIDO: Vai buscar o 'id' exatamente como o teu backend envia!
        localStorage.setItem('userId', dadosRecebidos.utilizador.id);

        console.log('Login efetuado com sucesso! Token e ID guardados.');

        // 3. 🔥 REATIVADO: Deixa de estar comentado para poderes navegar automaticamente
        window.location.href = 'dashboard.html';

    } catch (err) {
        divErro.innerText = err.message;
        divErro.style.display = 'block';
    }
});