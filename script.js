// CONFIGURAÇÃO GLOBAL
const API_URL = "https://warnermida-1.onrender.com"; // URL do seu Backend no Render

// --- UTILITÁRIOS ---
function toast(mensagem) {
    alert(mensagem); // Pode substituir por um elemento visual depois
}

// --- LÓGICA DE REGISTRO (ATUALIZADA COM COLUNA DE CONVITE) ---
async function registro() {
    const nome = document.getElementById('nome-registro').value;
    const email = document.getElementById('email-registro').value;
    const senha = document.getElementById('senha-registro').value;
    const senhaConfirm = document.getElementById('senha-registro-confirm').value;
    
    // CAPTURA O CÓDIGO DE CONVITE DA COLUNA (CAMPO) QUE ADICIONAMOS
    const refInput = document.getElementById('reg-ref');
    const ref = refInput ? refInput.value : null;

    if (!nome || !email || !senha) return toast("Preencha todos os campos!");
    if (senha !== senhaConfirm) return toast("As senhas não coincidem!");

    try {
        const res = await fetch(`${API_URL}/api/registrar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha, ref }) // 'ref' adicionado aqui
        });
        const data = await res.json();
        if (res.ok) {
            toast("Conta criada com sucesso! Seu código: " + data.referral_id);
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

        const data = await res.json();

        if(res.ok) {
            // SALVA SEMPRE COMO 'usuario' PARA COMBINAR COM O INDEX
            localStorage.setItem('usuario', JSON.stringify(data));
            window.location.href = 'index.html';
        } else {
            toast(data.error || "Dados incorretos");
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

        // ADICIONADO: Gerar Link de Convite automático se houver o campo na tela
        const linkEl = document.getElementById('link-convite');
        if (linkEl && user.referral_id) {
            linkEl.innerText = `https://warnermidia.netlify.app/registro.html?ref=${user.referral_id}`;
        }
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

async function atualizarSaldoReal() {
    const user = JSON.parse(localStorage.getItem('usuario'));
    if (!user) return;

    try {
        const res = await fetch(`${API_URL}/api/usuario/${user.id}`);
        const data = await res.json();
        if (res.ok) {
            // Atualiza o saldo na tela e no localStorage
            user.saldo = data.saldo;
            user.referral_id = data.referral_id; // Garante que temos o ID de convite
            localStorage.setItem('usuario', JSON.stringify(user));
            const saldoElement = document.querySelector('.balance-amount');
            if (saldoElement) saldoElement.innerText = `${data.saldo} Kz`;
        }
    } catch (err) { console.error("Erro ao atualizar saldo"); }
}

// --- ADICIONADO: LÓGICA ESPECÍFICA DE EQUIPE ---
async function carregarDadosEquipe() {
    const user = JSON.parse(localStorage.getItem('usuario'));
    if (!user || !user.referral_id) return;

    try {
        const res = await fetch(`${API_URL}/api/equipe/${user.referral_id}`);
        if (res.ok) {
            const data = await res.json();
            const countEl = document.getElementById('team-size-val');
            const bonusEl = document.getElementById('team-bonus-val');
            
            if (countEl) countEl.innerText = data.teamCount;
            if (bonusEl) bonusEl.innerText = `${data.teamBonus} Kz`;
        }
    } catch (err) { console.error("Erro ao carregar equipe"); }
}

// --- ADICIONADO: COPIAR LINK ---
function copiarLink() {
    const texto = document.getElementById('link-convite').innerText;
    navigator.clipboard.writeText(texto).then(() => {
        toast("✅ Link de convite copiado!");
    });
}

// Chame essa função dentro do window.onload atualizado
window.onload = () => {
    carregarDadosUsuario();
    atualizarSaldoReal();
    carregarDadosEquipe(); // Chamada de equipe adicionada

    // Auto-preencher código de convite se estiver na página de registro
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    const inputRef = document.getElementById('reg-ref');
    if (ref && inputRef) inputRef.value = ref;
};

// Função para buscar dados novos do servidor e atualizar a tela
async function sincronizarDados() {
    const userLocal = JSON.parse(localStorage.getItem('usuario'));
    if (!userLocal) return;

    try {
        const res = await fetch(`${API_URL}/api/usuario/${userLocal.id}`);
        if (res.ok) {
            const userAtualizado = await res.json();
            
            // Atualiza o localStorage com o saldo novo
            localStorage.setItem('usuario', JSON.stringify(userAtualizado));

            // Atualiza o nome e o saldo no HTML
            const nomeElement = document.getElementById('user-name');
            const saldoElement = document.querySelector('.balance-amount');

            if (nomeElement) nomeElement.innerText = userAtualizado.nome;
            if (saldoElement) saldoElement.innerText = `${userAtualizado.saldo} Kz`;
            
            // Sincroniza também a equipe
            carregarDadosEquipe();
        }
    } catch (err) {
        console.error("Erro ao sincronizar dados:", err);
    }
}

// Chamar a sincronização sempre que a página abrir
window.addEventListener('load', sincronizarDados);
