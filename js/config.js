/**
 * ETTUR - Configuración del Frontend
 */
const CONFIG = {
    // Cambiar esta URL por la del backend en Railway
    API_BASE: localStorage.getItem('ettur_api_url') || 'https://tu-backend.railway.app',
    APP_NAME: 'ETTUR La Universidad',
    VERSION: '1.0.0',
    TOKEN_KEY: 'ettur_token',
    USER_KEY: 'ettur_user',

    MESES: ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    MESES_CORTO: ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],

    formatMoney(amount) {
        return 'S/ ' + parseFloat(amount || 0).toFixed(2);
    },

    formatDate(dateStr) {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
    },

    formatDateTime(dateStr) {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    },

    periodLabel(anio, mes, quincena) {
        const q = quincena == 1 ? '1ra Qna' : '2da Qna';
        return `${q} ${this.MESES_CORTO[mes]} ${anio}`;
    }
};
