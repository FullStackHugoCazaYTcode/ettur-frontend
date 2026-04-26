/**
 * ETTUR - Servicio API v2.1
 */
const API = {
    getToken() { return localStorage.getItem(CONFIG.TOKEN_KEY); },

    getHeaders(isFormData = false) {
        const headers = {};
        if (!isFormData) headers['Content-Type'] = 'application/json';
        const token = this.getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return headers;
    },

    async request(endpoint, options = {}) {
        const url = `${CONFIG.API_BASE}${endpoint}`;
        const isFormData = options.body instanceof FormData;
        const config = { method: options.method || 'GET', headers: this.getHeaders(isFormData) };
        if (options.body) config.body = isFormData ? options.body : JSON.stringify(options.body);

        try {
            const response = await fetch(url, config);
            const text = await response.text();
            try {
                const data = JSON.parse(text);
                if (response.status === 401) { Auth.logout(true); return data; }
                return data;
            } catch (e) {
                console.error('Response not JSON:', text.substring(0, 500));
                return { success: false, message: 'Error del servidor: ' + text.substring(0, 200) };
            }
        } catch (error) {
            console.error('Fetch Error:', error);
            return { success: false, message: 'Error de conexión: ' + error.message };
        }
    },

    // Auth
    async login(dni, placa) {
        return this.request('/api/auth?action=login', { method: 'POST', body: { dni, placa } });
    },
    async logout() { return this.request('/api/auth?action=logout', { method: 'POST' }); },
    async getMe() { return this.request('/api/auth?action=me'); },
    async changePlaca(placa_nueva) {
        return this.request('/api/auth?action=change-password', { method: 'POST', body: { placa_nueva } });
    },

    // Usuarios
    async getUsuarios(params = {}) {
        const query = new URLSearchParams({ action: 'list', ...params }).toString();
        return this.request(`/api/usuarios?${query}`);
    },
    async getUsuario(id) { return this.request(`/api/usuarios?action=get&id=${id}`); },
    async crearUsuario(data) { return this.request('/api/usuarios?action=create', { method: 'POST', body: data }); },
    async editarUsuario(data) { return this.request('/api/usuarios?action=update', { method: 'PUT', body: data }); },
    async toggleUsuario(id) { return this.request('/api/usuarios?action=toggle', { method: 'POST', body: { id } }); },
    async resetPlaca(id, placa) { return this.request('/api/usuarios?action=reset-placa', { method: 'POST', body: { id, placa } }); },

    // Tarifas
    async getTarifas() { return this.request('/api/tarifas?action=list'); },
    async getTarifaActual() { return this.request('/api/tarifas?action=current'); },
    async editarTarifa(data) { return this.request('/api/tarifas?action=update', { method: 'PUT', body: data }); },

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
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const text = await response.text();
            console.log('registrarPago response status:', response.status);
            console.log('registrarPago response body:', text.substring(0, 500));

            try {
                return JSON.parse(text);
            } catch (e) {
                return { success: false, message: 'Error del servidor: ' + text.substring(0, 300) };
            }
        } catch (error) {
            console.error('registrarPago fetch error:', error);
            return { success: false, message: 'Error de conexión: ' + error.message };
        }
    },

    async getMisPagos(params = {}) {
        const query = new URLSearchParams({ action: 'mis-pagos', ...params }).toString();
        return this.request(`/api/pagos?${query}`);
    },
    async getPagosPendientes() { return this.request('/api/pagos?action=pendientes'); },
    async validarPago(pago_id, accion, motivo_rechazo = '') {
        return this.request('/api/pagos?action=validar', { method: 'POST', body: { pago_id, accion, motivo_rechazo } });
    },
    async getDetallePago(id) { return this.request(`/api/pagos?action=detalle&id=${id}`); },
    async getHistorialPagos(params = {}) {
        const query = new URLSearchParams({ action: 'historial', ...params }).toString();
        return this.request(`/api/pagos?${query}`);
    },

    // Reportes
    async getDashboard() { return this.request('/api/reportes?action=dashboard'); },
    async getLiquidacion(desde, hasta) { return this.request(`/api/reportes?action=liquidacion&desde=${desde}&hasta=${hasta}`); },
    async getLiquidacionTrabajador(id) { return this.request(`/api/reportes?action=liquidacion-trabajador&trabajador_id=${id}`); },
    async getAuditoria(params = {}) {
        const query = new URLSearchParams({ action: 'auditoria', ...params }).toString();
        return this.request(`/api/reportes?${query}`);
    },

    // Reportes avanzados
    async getMetaMensual(anio, mes) { return this.request(`/api/reportes?action=meta-mensual&anio=${anio}&mes=${mes}`); },
    async getDeudas() { return this.request('/api/reportes?action=deudas'); },

    // Configuración

    // Documentos
    async getDocumentos(usuarioId) { return this.request(`/api/documentos?action=get&usuario_id=${usuarioId}`); },
    async getMisDocumentos() { return this.request('/api/documentos?action=mis-documentos'); },
    async guardarDocumento(data) { return this.request('/api/documentos?action=save', { method: 'POST', body: data }); },
    
    async getConfig() { return this.request('/api/config?action=get'); },
    async getYapeInfo() { return this.request('/api/config?action=yape'); },
    async updateConfig(data) { return this.request('/api/config?action=update', { method: 'POST', body: data }); },

    // Usuarios - eliminar
    async eliminarUsuario(id) { return this.request('/api/usuarios?action=delete', { method: 'POST', body: { id } }); },
    getComprobanteUrl(path) { return `${CONFIG.API_BASE}/${path}`; }
};
