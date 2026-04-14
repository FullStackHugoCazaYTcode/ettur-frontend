/**
 * ETTUR - Módulo de Autenticación
 */
const Auth = {
    user: null,

    init() {
        const userData = localStorage.getItem(CONFIG.USER_KEY);
        const token = localStorage.getItem(CONFIG.TOKEN_KEY);
        if (userData && token) {
            try {
                this.user = JSON.parse(userData);
                return true;
            } catch (e) {
                this.clearSession();
                return false;
            }
        }
        return false;
    },

    isLoggedIn() {
        return !!this.user && !!localStorage.getItem(CONFIG.TOKEN_KEY);
    },

    getUser() {
        return this.user;
    },

    getRol() {
        return this.user ? this.user.rol : null;
    },

    isAdmin() {
        return this.getRol() === 'admin';
    },

    isCoadmin() {
        return this.getRol() === 'coadmin';
    },

    isTrabajador() {
        return this.getRol() === 'trabajador';
    },

    isAdminOrCoadmin() {
        return this.isAdmin() || this.isCoadmin();
    },

    setSession(token, user) {
        localStorage.setItem(CONFIG.TOKEN_KEY, token);
        localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
        this.user = user;
    },

    clearSession() {
        localStorage.removeItem(CONFIG.TOKEN_KEY);
        localStorage.removeItem(CONFIG.USER_KEY);
        this.user = null;
    },

    async logout(expired = false) {
        if (!expired) {
            await API.logout();
        }
        this.clearSession();
        App.showLogin();
        if (expired) {
            UI.toast('Su sesión ha expirado', 'info');
        }
    },

    getFullName() {
        if (!this.user) return '';
        return `${this.user.nombres} ${this.user.apellidos}`;
    },

    getRolLabel() {
        const labels = {
            'admin': 'Administrador',
            'coadmin': 'Coadministrador',
            'trabajador': 'Trabajador'
        };
        return labels[this.getRol()] || this.getRol();
    }
};
