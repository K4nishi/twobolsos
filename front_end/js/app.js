import { api } from './api.js';

// State
const state = {
    currentView: 'login', // Initial content
    currentWalletId: null,
    currentWalletCategory: null,
    chartDays: 7,
    dashboardData: null,
    chartLine: null,
    chartPie: null,
    filter: 'todos'
};

// DOM Elements
const views = {
    login: document.getElementById('viewLogin'),
    register: document.getElementById('viewRegister'),
    home: document.getElementById('viewHome'),
    dash: document.getElementById('viewDash')
};

const dom = {
    listaNegocios: document.getElementById('listaNegocios'),
    dashTitle: document.getElementById('dashTitle'),
    dashCategory: document.getElementById('dashCategoria'),
    dashRole: document.getElementById('dashRole'),
    kpiRec: document.getElementById('valRec'),
    kpiDesp: document.getElementById('valDesp'),
    kpiSaldo: document.getElementById('valSaldo'),
    motoristaPanel: document.getElementById('painelMotorista'),
    motoristaStats: {
        km: document.getElementById('valKm'),
        lit: document.getElementById('valLitros'),
        kml: document.getElementById('valKml'),
        rend: document.getElementById('valRend')
    },
    historico: document.getElementById('listaHistorico'),
    fixasList: document.getElementById('listaFixas'),
    listaMembros: document.getElementById('listaMembros')
};

// --- Initialization ---
function init() {
    setupEventListeners();

    // Check Auth
    if (api.token) {
        switchView('home');
    } else {
        switchView('login');
    }
}

// Global Toast
window.showToast = (msg, type = 'primary') => {
    const toastEl = document.getElementById('liveToast');
    const toastBody = document.getElementById('toastMessage');
    toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
    toastBody.innerText = msg;
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}

function setupEventListeners() {
    // Navigation Global
    window.switchView = switchView;
    window.showRegister = () => switchView('register');
    window.showLogin = () => switchView('login');
    window.logout = () => api.logout();
    window.voltarHome = () => switchView('home');

    // Auth Forms
    document.getElementById('formLogin').onsubmit = handleLogin;
    document.getElementById('formRegister').onsubmit = handleRegister;

    // App Forms
    document.getElementById('formNovoNegocio').onsubmit = handleCreateNegocio;
    document.getElementById('formTransacao').onsubmit = handleCreateTransacao;
    document.getElementById('formKm').onsubmit = handleCreateKm;
    document.getElementById('formFixa').onsubmit = handleCreateFixa;
    document.getElementById('formJoin').onsubmit = handleJoin;

    // Filters
    document.querySelectorAll('.btn-filter').forEach(btn => {
        btn.onclick = (e) => {
            document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
            const target = e.target.closest('button');
            target.classList.add('active');
            filterHistory(target.dataset.f);
        };
    });

    // Chart Filter
    document.getElementById('chartDays').onchange = (e) => {
        state.chartDays = e.target.value;
        loadDashboard(state.currentWalletId);
    };

    // Expose functions to global
    window.abrirDash = loadDashboard;
    window.abrirModalTrans = openTransModal;
    window.abrirModalKm = openKmModal;
    window.abrirModalFixas = openFixasModal;
    window.deletarNegocio = handleDeleteNegocio;
    window.delTrans = handleDeleteTransacao;
    window.pagarFixa = handlePayFixa;
    window.delFixa = handleDeleteFixa;
    window.abrirModalMembros = openMembrosModal;
    window.gerarConvite = handleGenerateInvite;
    window.removerMembro = handleRemoveMember;
    window.abrirModalJoin = () => new bootstrap.Modal(document.getElementById('modalJoin')).show();

    // Default Dates
    document.getElementById('tData').valueAsDate = new Date();
    document.getElementById('kData').valueAsDate = new Date();
}

function switchView(viewName) {
    state.currentView = viewName;
    Object.values(views).forEach(el => el.style.display = 'none');
    views[viewName].style.display = 'block';

    // Only load data if switching TO home (and not already there/loading?)
    // Actually, simple is fine:
    if (viewName === 'home') loadHome();
}

// --- Auth ---
// --- Auth ---
function setLoading(btnId, isLoading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    const spinner = btn.querySelector('.spinner-border');

    if (isLoading) {
        btn.disabled = true;
        if (spinner) spinner.classList.remove('d-none');
    } else {
        btn.disabled = false;
        if (spinner) spinner.classList.add('d-none');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const u = document.getElementById('loginUser').value;
    const p = document.getElementById('loginPass').value;
    const btnId = 'btnLogin'; // Need to add ID to login button

    setLoading(btnId, true);
    try {
        const res = await api.login(u, p);
        api.setToken(res.access_token);
        switchView('home');
        showToast(`Bem-vindo de volta, ${res.username}!`, 'success');
    } catch (err) {
        showToast("Erro ao entrar: " + err.message, 'danger');
    } finally {
        setLoading(btnId, false);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const u = document.getElementById('regUser').value;
    const p = document.getElementById('regPass').value;
    const pConf = document.getElementById('regPassConfirm').value;
    const email = document.getElementById('regEmail').value;

    if (p !== pConf) {
        showToast("As senhas não coincidem!", "warning");
        return;
    }

    setLoading('btnRegister', true);
    try {
        await api.register({ username: u, password: p, email });
        showToast("Conta criada com sucesso! Faça login.", 'success');
        e.target.reset(); // Clear form
        switchView('login');
    } catch (err) {
        showToast("Erro no cadastro: " + err.message, 'danger');
    } finally {
        setLoading('btnRegister', false);
    }
}

// --- Home View ---
async function loadHome() {
    try {
        const list = await api.getNegocios();
        dom.listaNegocios.innerHTML = list.length ? '' :
            `<div class="text-center text-muted mt-5 fade-in">
                <i class="bi bi-wallet2 display-1 opacity-25"></i>
                <p class="mt-3">Você ainda não tem carteiras.</p>
            </div>`;

        list.forEach(n => {
            const saldoClass = n.saldo >= 0 ? 'text-success' : 'text-danger';
            const ownerBadge = n.role === 'owner' ? '' : `<small class="d-block mt-2 text-info opacity-75"><i class="bi bi-people-fill me-1"></i>De: ${n.owner_name}</small>`;
            const roleBadge = n.role === 'owner'
                ? '<span class="badge bg-primary bg-opacity-25 text-primary border border-primary border-opacity-25 ms-2">Dono</span>'
                : `<span class="badge bg-info bg-opacity-25 text-info border border-info border-opacity-25 ms-2">${n.role}</span>`;

            dom.listaNegocios.innerHTML += `
                <div class="col-md-6 col-lg-4" class="fade-in">
                    <div class="wallet-card" onclick="abrirDash(${n.id})" style="--wallet-color: ${n.cor}">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <div><h5 class="fw-bold mb-0 text-white d-inline">${n.nome}</h5>${roleBadge}</div>
                            <span class="badge bg-dark border border-secondary text-secondary">${n.categoria}</span>
                        </div>
                        ${ownerBadge}
                        <hr class="border-secondary opacity-25 my-2">
                        <small class="text-secondary text-uppercase">Saldo Atual</small>
                        <h2 class="mb-0 ${saldoClass}">R$ ${n.saldo.toFixed(2)}</h2>
                    </div>
                </div>`;
        });
    } catch (e) { console.error(e); }
}

async function handleCreateNegocio(e) {
    e.preventDefault();
    const data = {
        nome: document.getElementById('nNome').value,
        categoria: document.getElementById('nCategoria').value,
        cor: document.getElementById('nCor').value
    };

    setLoading('btnCreateWallet', true);
    try {
        await api.createNegocio(data);
        showToast("Carteira criada com sucesso!", 'success');
        bootstrap.Modal.getInstance(document.getElementById('modalNovo')).hide();
        document.getElementById('nNome').value = "";
        loadHome();
    } catch (err) {
        showToast("Erro ao criar carteira: " + err.message, 'danger');
    } finally {
        setLoading('btnCreateWallet', false);
    }
}

async function handleJoin(e) {
    e.preventDefault();
    const code = document.getElementById('joinCode').value;
    try {
        await api.joinNegocio(code);
        showToast("Sucesso!", 'success');
        bootstrap.Modal.getInstance(document.getElementById('modalJoin')).hide();
        document.getElementById('joinCode').value = "";
        loadHome();
    } catch (e) { showToast(e.message, 'danger'); }
}

// --- Dashboard View ---
async function loadDashboard(id) {
    state.currentWalletId = id;
    try {
        state.dashboardData = await api.getDashboard(id, state.chartDays);
    } catch (e) { showToast("Erro ao carregar", 'danger'); switchView('home'); return; }

    const data = state.dashboardData;
    const n = data.negocio;
    state.currentWalletCategory = n.categoria;

    // Header
    dom.dashTitle.innerText = n.nome;
    dom.dashCategory.innerText = n.categoria;
    dom.dashRole.innerText = data.role.toUpperCase();

    // KPIs
    dom.kpiRec.innerText = `R$ ${data.kpis.receita.toFixed(0)}`;
    dom.kpiDesp.innerText = `R$ ${data.kpis.despesa.toFixed(0)}`;
    dom.kpiSaldo.innerText = `R$ ${data.kpis.saldo.toFixed(2)}`;

    // Motorista Panel
    if (n.categoria === 'MOTORISTA') {
        dom.motoristaPanel.style.display = 'block';
        dom.motoristaStats.km.innerText = data.kpis.total_km;
        dom.motoristaStats.lit.innerText = data.kpis.total_litros;
        dom.motoristaStats.kml.innerText = data.kpis.autonomia.toFixed(1) + ' km/L';
        dom.motoristaStats.rend.innerText = 'R$ ' + data.kpis.rendimento.toFixed(2);
    } else {
        dom.motoristaPanel.style.display = 'none';
    }

    renderCharts(data);
    filterHistory(state.filter);

    switchView('dash');
}

function filterHistory(filterType) {
    state.filter = filterType;
    if (!state.dashboardData) return;
    let list = state.dashboardData.extrato;
    if (filterType !== 'todos') list = list.filter(t => t.tipo === filterType);
    renderHistoryList(list);
}

function renderHistoryList(list) {
    dom.historico.innerHTML = list.length ? '' : `<div class="text-center py-4 text-secondary small">Sem registros.</div>`;
    list.forEach(t => {
        let icon, colorClass;
        if (t.tipo === 'receita') { icon = 'bi-arrow-up-right-circle-fill'; colorClass = 'text-success'; }
        else if (t.tipo === 'despesa') { icon = 'bi-arrow-down-left-circle-fill'; colorClass = 'text-danger'; }
        else { icon = 'bi-speedometer'; colorClass = 'text-info'; }

        const dateStr = new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR');
        const tagBadge = t.tag ? `<span class="badge bg-secondary opacity-50 ms-2" style="font-size: 0.65rem">${t.tag}</span>` : '';
        const kmBadge = t.km > 0 ? `<span class="badge bg-warning text-dark ms-2 fw-bold">${t.km} km</span>` : '';

        dom.historico.innerHTML += `
            <div class="transaction-item fade-in">
                <div class="d-flex align-items-center gap-3">
                    <i class="bi ${icon} fs-3 ${colorClass} opacity-75"></i>
                    <div>
                        <div class="trans-desc text-white">${t.descricao} ${tagBadge} ${kmBadge}</div>
                        <div class="trans-meta"><i class="bi bi-calendar4"></i> ${dateStr}</div>
                    </div>
                </div>
                <div class="d-flex align-items-center gap-3">
                    <div class="trans-val ${colorClass}">R$ ${t.valor.toFixed(2)}</div>
                    <button onclick="delTrans(${t.id})" class="btn btn-link btn-sm text-secondary p-0"><i class="bi bi-trash"></i></button>
                </div>
            </div>`;
    });
}

function renderCharts(data) {
    const ctxLine = document.getElementById('graficoSemanal').getContext('2d');
    if (state.chartLine) state.chartLine.destroy();

    state.chartLine = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: data.grafico.labels,
            datasets: [
                { label: 'Entrada', data: data.grafico.receitas, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.05)', fill: true, tension: 0.4 },
                { label: 'Saída', data: data.grafico.despesas, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.05)', fill: true, tension: 0.4 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
    });

    const ctxPie = document.getElementById('graficoPizza').getContext('2d');
    if (state.chartPie) state.chartPie.destroy();

    state.chartPie = new Chart(ctxPie, {
        type: 'doughnut',
        data: { labels: Object.keys(data.pizza), datasets: [{ data: Object.values(data.pizza), backgroundColor: ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'], borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { position: 'right', labels: { color: '#a1a1aa', boxWidth: 8, font: { size: 10, family: "'Outfit', sans-serif" } } } } }
    });
}

// --- Sharing & Details ---
async function openMembrosModal() {
    const list = await api.getMembers(state.currentWalletId);
    dom.listaMembros.innerHTML = list.length == 0 ? '<div class="text-muted small text-center">Nenhum membro</div>' : '';

    list.forEach(m => {
        dom.listaMembros.innerHTML += `
            <div class="member-item">
                <div><i class="bi bi-person-fill text-primary me-2"></i> ${m.username} <span class="badge bg-secondary ms-2">${m.role}</span></div>
                <button onclick="removerMembro(${m.user_id})" class="btn btn-sm btn-outline-danger border-0"><i class="bi bi-trash"></i></button>
            </div>`;
    });

    document.getElementById('areaCodigo').classList.add('d-none');
    new bootstrap.Modal(document.getElementById('modalMembros')).show();
}

async function handleGenerateInvite() {
    try {
        const res = await api.createInvite(state.currentWalletId);
        document.getElementById('txtCodigo').innerText = res.code;
        document.getElementById('areaCodigo').classList.remove('d-none');
    } catch (e) { showToast(e.message, 'danger'); }
}

async function handleRemoveMember(userId) {
    if (!confirm("Remover este membro?")) return;
    try {
        await api.removeMember(state.currentWalletId, userId);
        openMembrosModal(); // Reload List
    } catch (e) { showToast(e.message, 'danger'); } // Often forbidden if not owner
}

// ... Transacoes/Fixas handlers preserved ...
function openTransModal(tipo) {
    document.getElementById('tTipo').value = tipo;
    document.getElementById('transTitulo').innerText = tipo === 'receita' ? "Nova Entrada" : "Nova Saída";
    const sel = document.getElementById('tTag'); sel.innerHTML = "";
    let tags = [];
    if (tipo === 'receita') tags = ['Vendas', 'Salário', 'Corrida App', 'Gorjeta', 'Outros'];
    else if (state.currentWalletCategory === 'MOTORISTA') tags = ['Combustível', 'Manutenção', 'Aluguel Moto', 'Alimentação', 'Multa', 'Outros'];
    else tags = ['Alimentação', 'Moradia', 'Lazer', 'Transporte', 'Saúde', 'Educação', 'Outros'];
    tags.forEach(t => sel.innerHTML += `<option value="${t}">${t}</option>`);
    const isDriver = state.currentWalletCategory === 'MOTORISTA';
    document.getElementById('inputsDriver').style.display = isDriver ? 'block' : 'none';
    if (isDriver) {
        document.getElementById('divKm').style.display = tipo === 'receita' ? 'block' : 'none';
        document.getElementById('divLitros').style.display = tipo === 'despesa' ? 'block' : 'none';
    }
    new bootstrap.Modal(document.getElementById('modalTrans')).show();
}

async function handleCreateTransacao(e) { e.preventDefault(); const body = { negocio_id: state.currentWalletId, tipo: document.getElementById('tTipo').value, descricao: document.getElementById('tDesc').value, valor: document.getElementById('tVal').value, data: document.getElementById('tData').value, tag: document.getElementById('tTag').value, km: document.getElementById('tKm').value || 0, litros: document.getElementById('tLitros').value || 0 }; await api.createTransacao(body); bootstrap.Modal.getInstance(document.getElementById('modalTrans')).hide(); e.target.reset(); document.getElementById('tData').valueAsDate = new Date(); loadDashboard(state.currentWalletId); }
async function handleDeleteTransacao(id) { if (!confirm("Apagar?")) return; await api.deleteTransacao(id); loadDashboard(state.currentWalletId); }
function openKmModal() { new bootstrap.Modal(document.getElementById('modalKm')).show(); }
async function handleCreateKm(e) { e.preventDefault(); await api.createTransacao({ negocio_id: state.currentWalletId, tipo: 'neutro', descricao: 'Fechamento KM', valor: 0, data: document.getElementById('kData').value, km: document.getElementById('kKm').value, litros: 0, tag: 'Rodagem' }); bootstrap.Modal.getInstance(document.getElementById('modalKm')).hide(); e.target.reset(); loadDashboard(state.currentWalletId); }

// Fixas
async function updateFixasList() { const list = await api.getFixas(state.currentWalletId); const ul = document.getElementById('listaFixas'); ul.innerHTML = list.length ? '' : '<div class="text-center small my-3">Nenhuma despesa fixa</div>'; list.forEach(f => { const btn = f.pago_neste_mes ? `<button disabled class="btn btn-sm btn-dark border-success text-success">Pago</button>` : `<button onclick="pagarFixa(${f.id})" class="btn btn-sm btn-success">Pagar</button>`; ul.innerHTML += `<li class="list-group-item bg-dark border-secondary text-white d-flex justify-content-between"><div>${f.nome}<br><small>R$ ${f.valor}</small></div><div class="d-flex gap-2">${btn}<button onclick="delFixa(${f.id})" class="btn btn-sm btn-outline-danger"><i class="bi bi-trash"></i></button></div></li>`; }); }
function openFixasModal() { updateFixasList(); new bootstrap.Modal(document.getElementById('modalFixas')).show(); }
async function handleCreateFixa(e) { e.preventDefault(); await api.createFixa({ nome: document.getElementById('fNome').value, valor: document.getElementById('fValor').value, tag: document.getElementById('fTag').value, negocio_id: state.currentWalletId }); document.getElementById('fNome').value = ""; updateFixasList(); }
async function handlePayFixa(id) { try { await api.payFixa(id); updateFixasList(); loadDashboard(state.currentWalletId); } catch (e) { showToast(e.message, 'danger'); } }
async function handleDeleteFixa(id) { await api.deleteFixa(id); updateFixasList(); }
async function handleDeleteNegocio() { if (confirm("Deletar Carteira?")) { await api.deleteNegocio(state.currentWalletId); switchView('home'); } }

init();
