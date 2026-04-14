/**
 * ETTUR - Controlador Principal de la App
 * Inicialización, routing, eventos globales
 */
const App = {
    init() {
        // Check auth
        const isAuth = Auth.init();

        // Splash screen
        setTimeout(() => {
            document.getElementById('splash-screen').classList.add('hide');
            setTimeout(() => {
                document.getElementById('splash-screen').style.display = 'none';
                if (isAuth) {
                    this.showApp();
                } else {
                    this.showLogin();
                }
            }, 500);
        }, 1500);

        // Bind events
        this.bindEvents();
    },

    bindEvents() {
        // Login form
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });

        // Sidebar toggle
        document.getElementById('btn-sidebar').addEventListener('click', () => UI.openSidebar());
        document.getElementById('btn-close-sidebar').addEventListener('click', () => UI.closeSidebar());
        document.getElementById('sidebar-overlay').addEventListener('click', () => UI.closeSidebar());

        // Logout
        document.getElementById('btn-logout').addEventListener('click', () => Auth.logout());

        // Profile from header
        document.getElementById('header-avatar').addEventListener('click', () => this.navigate('perfil'));
    },

    async handleLogin() {
        const btn = document.getElementById('btn-login');
        const errorEl = document.getElementById('login-error');
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        if (!username || !password) {
            errorEl.textContent = 'Ingrese usuario y contraseña';
            errorEl.classList.remove('d-none');
            return;
        }

        // Show loader
        btn.querySelector('.btn-text').classList.add('d-none');
        btn.querySelector('.btn-loader').classList.remove('d-none');
        btn.disabled = true;
        errorEl.classList.add('d-none');

        const res = await API.login(username, password);

        if (res.success) {
            Auth.setSession(res.data.token, res.data.user);
            document.getElementById('login-form').reset();
            this.showApp();
        } else {
            errorEl.textContent = res.message;
            errorEl.classList.remove('d-none');
        }

        // Reset button
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

        // Build navigation based on role
        UI.buildNavigation();

        // Go to dashboard
        this.navigate('dashboard');

        // Update badges
        UI.updateBadges();
    },

    navigate(pageId) {
        UI.closeSidebar();
        UI.setActivePage(pageId);

        const main = document.getElementById('app-main');

        switch (pageId) {
            case 'dashboard':
                PageDashboard.render();
                break;
            case 'pagar':
                PagePagos.renderPagar(main);
                break;
            case 'mis-pagos':
                PagePagos.renderMisPagos(main);
                break;
            case 'validar':
                PageValidar.render();
                break;
            case 'reportes':
                PageReportes.render();
                break;
            case 'usuarios':
                PageUsuarios.render();
                break;
            case 'tarifas':
                PageTarifas.render();
                break;
            case 'perfil':
                PagePerfil.render();
                break;
            default:
                main.innerHTML = UI.emptyState('question-circle', 'Página no encontrada');
        }

        // Scroll to top
        window.scrollTo(0, 0);
    }
};

// =================== INIT ===================
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
