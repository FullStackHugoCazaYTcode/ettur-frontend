/**
 * ETTUR - Controlador Principal v3.0
 * Con ruta pagar-historico
 */
const App = {
    init() {
        const isAuth = Auth.init();
        setTimeout(() => {
            document.getElementById('splash-screen').classList.add('hide');
            setTimeout(() => {
                document.getElementById('splash-screen').style.display = 'none';
                if (isAuth) { this.showApp(); } else { this.showLogin(); }
            }, 500);
        }, 1500);
        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });
        document.getElementById('btn-sidebar').addEventListener('click', () => UI.openSidebar());
        document.getElementById('btn-close-sidebar').addEventListener('click', () => UI.closeSidebar());
        document.getElementById('sidebar-overlay').addEventListener('click', () => UI.closeSidebar());
        document.getElementById('btn-logout').addEventListener('click', () => Auth.logout());
        document.getElementById('header-avatar').addEventListener('click', () => this.navigate('perfil'));
    },

    async handleLogin() {
        const btn = document.getElementById('btn-login');
        const errorEl = document.getElementById('login-error');
        const dni = document.getElementById('login-dni').value.trim();
        const placa = document.getElementById('login-placa').value.trim().toUpperCase();

        if (!dni || !placa) {
            errorEl.textContent = 'Ingrese DNI y Placa del vehículo';
            errorEl.classList.remove('d-none');
            return;
        }
        if (!/^\d{8}$/.test(dni)) {
            errorEl.textContent = 'El DNI debe tener 8 dígitos';
            errorEl.classList.remove('d-none');
            return;
        }

        btn.querySelector('.btn-text').classList.add('d-none');
        btn.querySelector('.btn-loader').classList.remove('d-none');
        btn.disabled = true;
        errorEl.classList.add('d-none');

        const res = await API.login(dni, placa);

        if (res.success) {
            Auth.setSession(res.data.token, res.data.user);
            document.getElementById('login-form').reset();
            this.showApp();
        } else {
            errorEl.textContent = res.message;
            errorEl.classList.remove('d-none');
        }

        btn.querySelector('.btn-text').classList.remove('d-none');
        btn.querySelector('.btn-loader').classList.add('d-none');
        btn.disabled = false;
    },

    showLogin() {
        document.getElementById('login-screen').style.display = '';
        document.getElementById('app-shell').style.display = 'none';
    },

    showApp() {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app-shell').style.display = '';
        UI.buildNavigation();
        this.navigate('dashboard');
        UI.updateBadges();
    },

    navigate(pageId) {
        UI.closeSidebar();
        UI.setActivePage(pageId);
        const main = document.getElementById('app-main');

        switch (pageId) {
            case 'dashboard':       PageDashboard.render(); break;
            case 'pagar':           PagePagos.renderPagar(main, 'corriente'); break;
            case 'pagar-historico': PagePagos.renderPagar(main, 'historico'); break;
            case 'mis-pagos':       PagePagos.renderMisPagos(main); break;
            case 'validar':         PageValidar.render(); break;
            case 'reportes':        PageReportes.render(); break;
            case 'usuarios':        PageUsuarios.render(); break;
            case 'tarifas':         PageTarifas.render(); break;
            case 'perfil':          PagePerfil.render(); break;
            default: main.innerHTML = UI.emptyState('question-circle', 'Página no encontrada');
        }
        window.scrollTo(0, 0);
    }
};

document.addEventListener('DOMContentLoaded', () => { App.init(); });
