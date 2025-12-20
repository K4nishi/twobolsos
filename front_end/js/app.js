import { api } from './api.js';

// State
const state = {
    currentView: 'home',
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
    home: document.getElementById('viewHome'),
    dash: document.getElementById('viewDash')
};

const dom = {
    listaNegocios: document.getElementById('listaNegocios'),
    dashTitle: document.getElementById('dashTitle'),
    dashCategory: document.getElementById('dashCategoria'),
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
    fixasList: document.getElementById('listaFixas')
};

// --- Initialization ---
async function init() {
    setupEventListeners();
    renderHome();
}

function setupEventListeners() {
    // Navigation
    window.voltarHome = () => switchView('home');

    // Forms
    document.getElementById('formNovoNegocio').onsubmit = handleCreateNegocio;
    document.getElementById('formTransacao').onsubmit = handleCreateTransacao;
    document.getElementById('formKm').onsubmit = handleCreateKm;
    document.getElementById('formFixa').onsubmit = handleCreateFixa;

    // Filters
    document.querySelectorAll('.btn-filter').forEach(btn => {
        btn.onclick = (e) => {
            document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
            // handle click on icon inside button
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

    // Expose functions to global scope for HTML inline calls (onclick)
    window.abrirDash = loadDashboard;
    window.abrirModalTrans = openTransModal;
    window.abrirModalKm = openKmModal;
    window.abrirModalFixas = openFixasModal;
    window.deletarNegocio = handleDeleteNegocio;
    window.delTrans = handleDeleteTransacao;
    window.pagarFixa = handlePayFixa;
    window.delFixa = handleDeleteFixa;

    // Default Dates
    document.getElementById('tData').valueAsDate = new Date();
    document.getElementById('kData').valueAsDate = new Date();
}

function switchView(viewName) {
    state.currentView = viewName;
    views.home.style.display = viewName === 'home' ? 'block' : 'none';
    views.dash.style.display = viewName === 'dash' ? 'block' : 'none';
    if (viewName === 'home') loadHome();
}

// --- Home View ---
async function loadHome() {
    const list = await api.getNegocios();
    dom.listaNegocios.innerHTML = list.length ? '' :
        `<div class="text-center text-muted mt-5 fade-in">
            <i class="bi bi-wallet2 display-1 opacity-25"></i>
            <p class="mt-3">Nenhuma carteira encontrada.</p>
        </div>`;

    list.forEach(n => {
        const saldoClass = n.saldo >= 0 ? 'text-success' : 'text-danger';
        dom.listaNegocios.innerHTML += `
            <div class="col-md-6 col-lg-4" class="fade-in">
                <div class="wallet-card" onclick="abrirDash(${n.id})" style="--wallet-color: ${n.cor}">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h5 class="fw-bold mb-0 text-white">${n.nome}</h5>
                        <span class="badge bg-dark border border-secondary text-secondary">${n.categoria}</span>
                    </div>
                    <small class="text-secondary text-uppercase">Saldo Atual</small>
                    <h2 class="mb-0 ${saldoClass}">R$ ${n.saldo.toFixed(2)}</h2>
                </div>
            </div>`;
    });
}

async function renderHome() {
    switchView('home');
}

async function handleCreateNegocio(e) {
    e.preventDefault();
    const data = {
        nome: document.getElementById('nNome').value,
        categoria: document.getElementById('nCategoria').value,
        cor: document.getElementById('nCor').value
    };
    await api.createNegocio(data);
    bootstrap.Modal.getInstance(document.getElementById('modalNovo')).hide();
    document.getElementById('nNome').value = "";
    loadHome();
}

// --- Dashboard View ---
async function loadDashboard(id) {
    state.currentWalletId = id;
    state.dashboardData = await api.getDashboard(id, state.chartDays);
    const data = state.dashboardData;
    const n = data.negocio;
    state.currentWalletCategory = n.categoria;

    // Header
    dom.dashTitle.innerText = n.nome;
    dom.dashCategory.innerText = n.categoria;

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

    // Charts
    renderCharts(data);

    // List
    filterHistory(state.filter);

    switchView('dash');
}

function filterHistory(filterType) {
    state.filter = filterType;
    if (!state.dashboardData) return;

    let list = state.dashboardData.extrato;
    if (filterType !== 'todos') {
        list = list.filter(t => t.tipo === filterType);
    }
    renderHistoryList(list);
}

function renderHistoryList(list) {
    dom.historico.innerHTML = list.length ? '' : `<div class="text-center py-4 text-secondary small">Sem registros para o filtro.</div>`;

    list.forEach(t => {
        let icon, colorClass;
        if (t.tipo === 'receita') { icon = 'bi-arrow-up-right-circle-fill'; colorClass = 'text-success'; }
        else if (t.tipo === 'despesa') { icon = 'bi-arrow-down-left-circle-fill'; colorClass = 'text-danger'; }
        else { icon = 'bi-speedometer'; colorClass = 'text-info'; } // Neutro/Km

        const dateStr = new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR'); // Fix timezone issue roughly
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
    // Line Chart
    const ctxLine = document.getElementById('graficoSemanal').getContext('2d');
    if (state.chartLine) state.chartLine.destroy();

    state.chartLine = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: data.grafico.labels,
            datasets: [
                {
                    label: 'Entrada',
                    data: data.grafico.receitas,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16,185,129,0.05)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0
                },
                {
                    label: 'Saída',
                    data: data.grafico.despesas,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239,68,68,0.05)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { display: false }, y: { display: false } } // Clean look
        }
    });

    // Pie Chart
    const ctxPie = document.getElementById('graficoPizza').getContext('2d');
    if (state.chartPie) state.chartPie.destroy();

    const labels = Object.keys(data.pizza);
    const values = Object.values(data.pizza);
    const colors = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];

    state.chartPie = new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{ data: values, backgroundColor: colors, borderWidth: 0 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: { position: 'right', labels: { color: '#a1a1aa', boxWidth: 8, font: { size: 10, family: "'Outfit', sans-serif" } } }
            }
        }
    });
}

// --- Actions & Modals ---
function openTransModal(tipo) {
    document.getElementById('tTipo').value = tipo;
    document.getElementById('transTitulo').innerText = tipo === 'receita' ? "Nova Entrada" : "Nova Saída";

    // Categories
    const sel = document.getElementById('tTag');
    sel.innerHTML = "";
    let tags = [];
    if (tipo === 'receita') tags = ['Vendas', 'Salário', 'Corrida App', 'Gorjeta', 'Outros'];
    else if (state.currentWalletCategory === 'MOTORISTA') tags = ['Combustível', 'Manutenção', 'Aluguel Moto', 'Alimentação', 'Multa', 'Outros'];
    else tags = ['Alimentação', 'Moradia', 'Lazer', 'Transporte', 'Saúde', 'Educação', 'Outros'];

    tags.forEach(t => sel.innerHTML += `<option value="${t}">${t}</option>`);

    // Driver inputs
    const isDriver = state.currentWalletCategory === 'MOTORISTA';
    const driverInputs = document.getElementById('inputsDriver');
    driverInputs.style.display = isDriver ? 'block' : 'none';
    if (isDriver) {
        document.getElementById('divKm').style.display = tipo === 'receita' ? 'block' : 'none';
        document.getElementById('divLitros').style.display = tipo === 'despesa' ? 'block' : 'none';
    }

    new bootstrap.Modal(document.getElementById('modalTrans')).show();
}

async function handleCreateTransacao(e) {
    e.preventDefault();
    const tipo = document.getElementById('tTipo').value;
    const body = {
        negocio_id: state.currentWalletId,
        tipo: tipo,
        descricao: document.getElementById('tDesc').value,
        valor: document.getElementById('tVal').value,
        data: document.getElementById('tData').value,
        tag: document.getElementById('tTag').value,
        km: document.getElementById('tKm').value || 0,
        litros: document.getElementById('tLitros').value || 0
    };
    await api.createTransacao(body);
    bootstrap.Modal.getInstance(document.getElementById('modalTrans')).hide();
    e.target.reset(); document.getElementById('tData').valueAsDate = new Date();
    loadDashboard(state.currentWalletId);
}

async function handleDeleteTransacao(id) {
    if (!confirm("Tem certeza que deseja apagar?")) return;
    await api.deleteTransacao(id);
    loadDashboard(state.currentWalletId);
}

// Driver Closure
function openKmModal() {
    new bootstrap.Modal(document.getElementById('modalKm')).show();
}

async function handleCreateKm(e) {
    e.preventDefault();
    await api.createTransacao({
        negocio_id: state.currentWalletId,
        tipo: 'neutro',
        descricao: 'Fechamento KM',
        valor: 0,
        data: document.getElementById('kData').value,
        km: document.getElementById('kKm').value,
        litros: 0,
        tag: 'Rodagem'
    });
    bootstrap.Modal.getInstance(document.getElementById('modalKm')).hide();
    e.target.reset(); document.getElementById('kData').valueAsDate = new Date();
    loadDashboard(state.currentWalletId);
}

// Fixas
async function updateFixasList() {
    const list = await api.getFixas(state.currentWalletId);
    renderFixasList(list);
}

function openFixasModal() {
    updateFixasList();
    const el = document.getElementById('modalFixas');
    const modal = bootstrap.Modal.getOrCreateInstance(el);
    modal.show();
}

function renderFixasList(list) {
    dom.fixasList.innerHTML = list.length ? '' : '<div class="text-center text-muted small my-3">Nenhuma despesa fixa</div>';
    list.forEach(f => {
        const btn = f.pago_neste_mes
            ? `<button class="btn btn-sm btn-dark text-success border border-success" disabled><i class="bi bi-check-circle-fill"></i> Pago</button>`
            : `<button onclick="pagarFixa(${f.id})" class="btn btn-sm btn-success">Pagar</button>`;

        dom.fixasList.innerHTML += `
            <li class="list-group-item bg-dark border-secondary text-white d-flex justify-content-between align-items-center">
                <div>
                    <div class="fw-bold">${f.nome}</div>
                    <small class="text-muted">R$ ${f.valor.toFixed(2)} - ${f.tag}</small>
                </div>
                <div class="d-flex align-items-center gap-2">
                    ${btn}
                    <button onclick="delFixa(${f.id})" class="btn btn-sm btn-outline-danger border-0"><i class="bi bi-trash"></i></button>
                </div>
            </li>`;
    });
}

async function handleCreateFixa(e) {
    e.preventDefault();
    const body = {
        nome: document.getElementById('fNome').value,
        valor: document.getElementById('fValor').value,
        tag: document.getElementById('fTag').value,
        negocio_id: state.currentWalletId
    };
    await api.createFixa(body);
    document.getElementById('fNome').value = ""; document.getElementById('fValor').value = "";
    updateFixasList();
}

async function handlePayFixa(id) {
    try {
        await api.payFixa(id);
        updateFixasList();
        loadDashboard(state.currentWalletId); // Update balance
    } catch (e) { alert(e.message); }
}

async function handleDeleteFixa(id) {
    await api.deleteFixa(id);
    updateFixasList();
}

async function handleDeleteNegocio() {
    if (confirm("Tem certeza que deletar esta carteira e TODOS os registros?")) {
        await api.deleteNegocio(state.currentWalletId);
        switchView('home');
    }
}

// Start
init();
