// CONFIGURAÇÃO GLOBAL
const API_URL = "https://warnermida-2.onrender.com"; // URL do seu Backend no Render

// --- UTILITÁRIOS ---
function toast(msg) {
    const t = document.createElement('div');
    // Estilo inline para garantir que apareça sem depender de CSS externo
    t.style = "position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#333; color:#fff; padding:15px 25px; border-radius:10px; z-index:10000; font-weight:bold; border-left:5px solid gold; box-shadow:0 5px 15px rgba(0,0,0,0.3);";
    t.innerText = msg;
    document.body.appendChild(t);
    setTimeout(() => {
        t.style.opacity = '0';
        t.style.transition = '0.5s';
        setTimeout(() => t.remove(), 500);
    }, 3000);
}
window.addEventListener('unhandledrejection', function(event) {
    // Silencia erros de performance de extensões/terceiros
    if (event.reason && event.reason.message.includes('Performance')) {
        event.preventDefault();
        return;
    }
    console.warn('Promessa rejeitada não tratada:', event.reason);
});
function mostrarNotificacao(mensagem, tipo = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.innerHTML = `
        <span>${mensagem}</span>
    `;

    container.appendChild(toast);

    // Remover após 3 segundos
    setTimeout(() => {
        toast.classList.add('toast-fade-out');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// --- LÓGICA DE REGISTRO (ATUALIZADA COM COLUNA DE CONVITE) ---
async function registro() {
    const nome = document.getElementById('nome-registro').value;
    const email = document.getElementById('email-registro').value;
    const senha = document.getElementById('senha-registro').value;
    const senhaConfirm = document.getElementById('senha-registro-confirm').value;
    
    // CAPTURA O CÓDIGO DE CONVITE DA COLUNA (CAMPO) 
    const refInput = document.getElementById('reg-ref');
    const ref = refInput ? refInput.value : null;

    if (!nome || !email || !senha) return toast("Preencha todos os campos!");
    if (senha !== senhaConfirm) return toast("As senhas não coincidem!");

    try {
        const res = await fetch(`${API_URL}/api/registrar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha, ref }) // 'ref' enviado aqui
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

        // ADICIONADO: Gerar Link de Convite automático
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

// --- ATUALIZAÇÃO DE SALDO ---
async function atualizarSaldoReal() {
    const user = JSON.parse(localStorage.getItem('usuario'));
    if (!user) return;

    try {
        const res = await fetch(`${API_URL}/api/usuario/${user.id}`);
        const data = await res.json();
        if (res.ok) {
            user.saldo = data.saldo;
            user.referral_id = data.referral_id; 
            localStorage.setItem('usuario', JSON.stringify(user));
            const saldoElement = document.querySelector('.balance-amount');
            if (saldoElement) saldoElement.innerText = `${data.saldo} Kz`;
        }
    } catch (err) { console.error("Erro ao atualizar saldo"); }
}

// --- LÓGICA DE EQUIPE ---
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

// --- COPIAR LINK ---
function copiarLink() {
    const linkElement = document.getElementById('link-convite');
    if (!linkElement) return;
    const texto = linkElement.innerText;
    navigator.clipboard.writeText(texto).then(() => {
        toast("✅ Link de convite copiado!");
    });
}

// --- SINCRONIZAÇÃO GERAL ---
async function sincronizarDados() {
    const userLocal = JSON.parse(localStorage.getItem('usuario'));
    if (!userLocal) return;

    try {
        const res = await fetch(`${API_URL}/api/usuario/${userLocal.id}`);
        if (res.ok) {
            const userAtualizado = await res.json();
            localStorage.setItem('usuario', JSON.stringify(userAtualizado));

            const nomeElement = document.getElementById('user-name');
            const saldoElement = document.querySelector('.balance-amount');

            if (nomeElement) nomeElement.innerText = userAtualizado.nome;
            if (saldoElement) saldoElement.innerText = `${userAtualizado.saldo} Kz`;
            
            carregarDadosEquipe();
        }
    } catch (err) {
        console.error("Erro ao sincronizar dados:", err);
    }
}

// --- EVENTOS DE CARREGAMENTO ---
window.onload = () => {
    carregarDadosUsuario();
    atualizarSaldoReal();
    carregarDadosEquipe();

    // Auto-preencher campo de convite na página de registro
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    const inputRef = document.getElementById('reg-ref');
    if (ref && inputRef) {
        inputRef.value = ref;
    }
};

window.addEventListener('load', sincronizarDados);
