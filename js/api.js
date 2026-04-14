/**
 * ETTUR - Servicio API
 * Wrapper para todas las llamadas al backend
 */
const API = {
    getToken() {
        return localStorage.getItem(CONFIG.TOKEN_KEY);
    },

    getHeaders(isFormData = false) {
        const headers = {};
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    },

    async request(endpoint, options = {}) {
        const url = `${CONFIG.API_BASE}${endpoint}`;
        const isFormData = options.body instanceof FormData;

        const config = {
            method: options.method || 'GET',
            headers: this.getHeaders(isFormData),
        };

        if (options.body) {
            config.body = isFormData ? options.body : JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (response.status === 401) {
                Auth.logout(true);
                return data;
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, message: 'Error de conexión. Verifique su conexión a internet.' };
        }
    },

    // Auth
    async login(username, password) {
        return this.request('/api/auth?action=login', {
            method: 'POST',
            body: { username, password }
        });
    },

    async logout() {
        return this.request('/api/auth?action=logout', { method: 'POST' });
    },

    async getMe() {
        return this.request('/api/auth?action=me');
    },

    async changePassword(password_actual, password_nuevo) {
        return this.request('/api/auth?action=change-password', {
            method: 'POST',
            body: { password_actual, password_nuevo }
        });
    },

    // Usuarios
    async getUsuarios(params = {}) {
        const query = new URLSearchParams({ action: 'list', ...params }).toString();
        return this.request(`/api/usuarios?${query}`);
    },

    async getUsuario(id) {
        return this.request(`/api/usuarios?action=get&id=${id}`);
    },

    async crearUsuario(data) {
        return this.request('/api/usuarios?action=create', { method: 'POST', body: data });
    },

    async editarUsuario(data) {
        return this.request('/api/usuarios?action=update', { method: 'PUT', body: data });
    },

    async toggleUsuario(id) {
        return this.request('/api/usuarios?action=toggle', { method: 'POST', body: { id } });
    },

    async resetPassword(id, password) {
        return this.request('/api/usuarios?action=reset-password', { method: 'POST', body: { id, password } });
    },

    // Tarifas
    async getTarifas() {
        return this.request('/api/tarifas?action=list');
    },

    async getTarifaActual() {
        return this.request('/api/tarifas?action=current');
    },

    async editarTarifa(data) {
        return this.request('/api/tarifas?action=update', { method: 'PUT', body: data });
    },

    // Pagos
    async getPeriodosPendientes(trabajadorId = null) {
        const params = trabajadorId ? `&trabajador_id=${trabajadorId}` : '';
        return this.request(`/api/pagos?action=periodos-pendientes${params}`);
    },

    async registrarPago(formData) {
        const url = `${CONFIG.API_BASE}/api/pagos?action=registrar`;
        const token = this.getToken();
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            return await response.json();
        } catch (error) {
            return { success: false, message: 'Error de conexión' };
        }
    },

    async getMisPagos(params = {}) {
        const query = new URLSearchParams({ action: 'mis-pagos', ...params }).toString();
        return this.request(`/api/pagos?${query}`);
    },

    async getPagosPendientes() {
        return this.request('/api/pagos?action=pendientes');
    },

    async validarPago(pago_id, accion, motivo_rechazo = '') {
        return this.request('/api/pagos?action=validar', {
            method: 'POST',
            body: { pago_id, accion, motivo_rechazo }
        });
    },

    async getDetallePago(id) {
        return this.request(`/api/pagos?action=detalle&id=${id}`);
    },

    async getHistorialPagos(params = {}) {
        const query = new URLSearchParams({ action: 'historial', ...params }).toString();
        return this.request(`/api/pagos?${query}`);
    },

    // Reportes
    async getDashboard() {
        return this.request('/api/reportes?action=dashboard');
    },

    async getLiquidacion(desde, hasta) {
        return this.request(`/api/reportes?action=liquidacion&desde=${desde}&hasta=${hasta}`);
    },

    async getLiquidacionTrabajador(id) {
        return this.request(`/api/reportes?action=liquidacion-trabajador&trabajador_id=${id}`);
    },

    async getAuditoria(params = {}) {
        const query = new URLSearchParams({ action: 'auditoria', ...params }).toString();
        return this.request(`/api/reportes?${query}`);
    },

    async getResumenMensual(anio) {
        return this.request(`/api/reportes?action=resumen-mensual&anio=${anio}`);
    },

    getComprobanteUrl(path) {
        return `${CONFIG.API_BASE}/${path}`;
    }
};
