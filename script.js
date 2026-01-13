// CONFIGURAÇÃO GLOBAL
const API_URL = "https://warnermida-1.onrender.com"; // URL do seu Backend no Render

// --- UTILITÁRIOS ---
function toast(mensagem) {
    alert(mensagem); // Pode substituir por um elemento visual depois
}

// --- LÓGICA DE REGISTRO ---
async function registro() {
    const nome = document.getElementById('nome-registro').value;
    const email = document.getElementById('email-registro').value;
    const senha = document.getElementById('senha-registro').value;
    const senhaConfirm = document.getElementById('senha-registro-confirm').value;

    if (!nome || !email || !senha) return toast("Preencha todos os campos!");
    if (senha !== senhaConfirm) return toast("As senhas não coincidem!");

    try {
        const res = await fetch(`${API_URL}/api/registrar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha })
        });
        const data = await res.json();
        if (res.ok) {
            toast("Conta criada com sucesso!");
            window.location.href = 'login.html';
        } else {
            toast(data.error || "Erro ao registrar");
        }
    } catch (err) { toast("Erro de conexão com o servidor"); }
}

// --- LÓGICA DE LOGIN ---
async function login() {
    const email = document.getElementById('email-login').value;
    const senha = document.getElementById('senha-login').value;

    try {
        const res = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });
        const user = await res.json();
        if (res.ok) {
            localStorage.setItem('usuario', JSON.stringify(user));
            window.location.href = 'index.html';
        } else {
            toast(user.error || "Dados incorretos");
        }
    } catch (err) { toast("Erro de conexão"); }
}

// --- LÓGICA DA PÁGINA INICIAL (INDEX) ---
function carregarDadosUsuario() {
    const user = JSON.parse(localStorage.getItem('usuario'));
    if (!user && window.location.pathname.includes('index.html')) {
        window.location.href = 'login.html';
        return;
    }
    
    if (user) {
        // Atualiza saldo e nome se os elementos existirem na página
        const saldoElement = document.querySelector('.balance-amount');
        const nomeElement = document.getElementById('user-name');
        if (saldoElement) saldoElement.innerText = `${user.saldo} Kz`;
        if (nomeElement) nomeElement.innerText = user.nome;
    }
}

// --- LÓGICA DE DEPÓSITO ---
async function finalizarDeposito() {
    const valor = document.getElementById('deposito-valor').value;
    const img = document.getElementById('comprovativo-img').value;
    const user = JSON.parse(localStorage.getItem('usuario'));

    if (!img) return toast("Anexe o comprovativo!");

    try {
        const res = await fetch(`${API_URL}/api/deposito`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                usuario_id: user.id, 
                valor: valor,
                comprovativo: img 
            })
        });
        if (res.ok) {
            toast("Enviado para análise do Admin!");
            location.reload();
        }
    } catch (err) { toast("Erro ao enviar"); }
}

// Executar ao carregar a página
window.onload = carregarDadosUsuario;
