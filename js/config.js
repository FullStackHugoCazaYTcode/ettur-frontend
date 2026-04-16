/**
 * ETTUR - Configuración v2.0
 */
const CONFIG = {
    API_BASE: localStorage.getItem('ettur_api_url') || 'https://ettur-backend-production.up.railway.app',
    APP_NAME: 'ETTUR La Universidad',
    VERSION: '2.0.0',
    TOKEN_KEY: 'ettur_token',
    USER_KEY: 'ettur_user',

    MESES: ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    MESES_CORTO: ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],

    TIPOS_TRABAJADOR: {
        'normal': { label: 'Normal', color: 'primary', icon: 'person' },
        'especial': { label: 'Especial', color: 'info', icon: 'star' },
        'mensual': { label: 'Mensual', color: 'success', icon: 'calendar-month' },
        'personalizado': { label: 'Personalizado', color: 'warning', icon: 'gear' }
    },

    formatMoney(amount) {
        return 'S/ ' + parseFloat(amount || 0).toFixed(2);
    },

    formatDate(dateStr) {
        if (!dateStr) return '—';
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
    },

    formatDateTime(dateStr) {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    },

    periodLabel(periodo) {
        if (!periodo) return '—';
        const inicio = this.formatDate(periodo.fecha_inicio || periodo.periodo_inicio);
        const fin = this.formatDate(periodo.fecha_fin || periodo.periodo_fin);
        const freq = periodo.frecuencia === 'mensual' ? '📅 Mensual' : '📆 Semanal';
        return `${inicio} — ${fin}`;
    },

    periodLabelShort(periodo) {
        if (!periodo) return '—';
        const fi = periodo.fecha_inicio || periodo.periodo_inicio || '';
        const ff = periodo.fecha_fin || periodo.periodo_fin || '';
        if (!fi) return '—';
        const d1 = new Date(fi + 'T00:00:00');
        const d2 = new Date(ff + 'T00:00:00');
        const m1 = this.MESES_CORTO[d1.getMonth() + 1];
        return `${d1.getDate()} ${m1} - ${d2.getDate()} ${this.MESES_CORTO[d2.getMonth() + 1]} ${d2.getFullYear()}`;
    },

    tipoTrabajadorBadge(tipo) {
        const t = this.TIPOS_TRABAJADOR[tipo];
        if (!t) return '';
        return `<span class="badge bg-${t.color}"><i class="bi bi-${t.icon}"></i> ${t.label}</span>`;
    }
};
