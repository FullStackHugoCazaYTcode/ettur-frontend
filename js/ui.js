/**
 * ETTUR - Módulo de UI
 * Manejo de interfaz, toasts, modals, navegación
 */
const UI = {
    currentPage: null,

    // =================== TOAST ===================
    toast(message, type = 'info', duration = 3500) {
        const container = document.getElementById('toast-container');
        const id = 'toast-' + Date.now();
        const icon = { success: 'check-circle-fill', error: 'exclamation-triangle-fill', info: 'info-circle-fill' }[type] || 'info-circle-fill';

        const html = `
            <div id="${id}" class="toast toast-ettur ${type} align-items-center border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body d-flex align-items-center gap-2">
                        <i class="bi bi-${icon}"></i> ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>`;
        container.insertAdjacentHTML('beforeend', html);

        const toastEl = document.getElementById(id);
        const bsToast = new bootstrap.Toast(toastEl, { delay: duration });
        bsToast.show();
        toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
    },

    // =================== MODAL ===================
    modal(title, body, footer = '') {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = body;
        document.getElementById('modal-footer').innerHTML = footer;
        const modal = new bootstrap.Modal(document.getElementById('global-modal'));
        modal.show();
        return modal;
    },

    closeModal() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('global-modal'));
        if (modal) modal.hide();
    },

    confirm(title, message, onConfirm, confirmText = 'Confirmar', variant = 'primary') {
        const body = `<p>${message}</p>`;
        const footer = `
            <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button class="btn btn-${variant}" id="btn-confirm-action">${confirmText}</button>`;

        const modal = this.modal(title, body, footer);
        document.getElementById('btn-confirm-action').onclick = () => {
            modal.hide();
            onConfirm();
        };
    },

    showImage(url) {
        document.getElementById('image-modal-img').src = url;
        new bootstrap.Modal(document.getElementById('image-modal')).show();
    },

    // =================== LOADING ===================
    loading(container = 'app-main') {
        const el = typeof container === 'string' ? document.getElementById(container) : container;
        el.innerHTML = `
            <div class="loading-center">
                <div class="spinner-ettur"></div>
            </div>`;
    },

    skeleton(container, count = 3) {
        const el = typeof container === 'string' ? document.getElementById(container) : container;
        let html = '';
        for (let i = 0; i < count; i++) {
            html += `<div class="skeleton skeleton-card"></div>`;
        }
        el.innerHTML = html;
    },

    // =================== SIDEBAR ===================
    openSidebar() {
        document.getElementById('sidebar').classList.add('open');
        document.getElementById('sidebar-overlay').classList.add('show');
    },

    closeSidebar() {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebar-overlay').classList.remove('show');
    },

    // =================== NAVIGATION ===================
    buildNavigation() {
        const rol = Auth.getRol();
        const sidebarNav = document.getElementById('sidebar-nav');
        const bottomNav = document.getElementById('bottom-nav');

        // Update user info
        document.getElementById('sidebar-nombre').textContent = Auth.getFullName();
        document.getElementById('sidebar-rol').textContent = Auth.getRolLabel();
        document.getElementById('badge-rol').textContent = Auth.getRolLabel();

        let menuItems = [];
        let bottomItems = [];

        if (rol === 'trabajador') {
            menuItems = [
                { id: 'dashboard', icon: 'house-fill', label: 'Inicio' },
                { id: 'pagar', icon: 'cash-stack', label: 'Subir Pago' },
                { id: 'mis-pagos', icon: 'receipt', label: 'Mis Comprobantes' },
                { divider: true },
                { id: 'perfil', icon: 'person-gear', label: 'Mi Perfil' },
            ];
            bottomItems = [
                { id: 'dashboard', icon: 'house-fill', label: 'Inicio' },
                { id: 'pagar', icon: 'cash-stack', label: 'Pagar' },
                { id: 'mis-pagos', icon: 'receipt', label: 'Pagos' },
                { id: 'perfil', icon: 'person-gear', label: 'Perfil' },
            ];
        } else if (rol === 'coadmin') {
            menuItems = [
                { id: 'dashboard', icon: 'speedometer2', label: 'Dashboard' },
                { id: 'validar', icon: 'clipboard-check', label: 'Validar Pagos', badge: true },
                { id: 'reportes', icon: 'bar-chart-line-fill', label: 'Reportes' },
                { divider: true },
                { id: 'perfil', icon: 'person-gear', label: 'Mi Perfil' },
            ];
            bottomItems = [
                { id: 'dashboard', icon: 'speedometer2', label: 'Inicio' },
                { id: 'validar', icon: 'clipboard-check', label: 'Validar', badge: true },
                { id: 'reportes', icon: 'bar-chart-line-fill', label: 'Reportes' },
                { id: 'perfil', icon: 'person-gear', label: 'Perfil' },
            ];
        } else if (rol === 'admin') {
            menuItems = [
                { id: 'dashboard', icon: 'speedometer2', label: 'Dashboard' },
                { id: 'validar', icon: 'clipboard-check', label: 'Validar Pagos', badge: true },
                { id: 'reportes', icon: 'bar-chart-line-fill', label: 'Reportes' },
                { divider: true },
                { id: 'usuarios', icon: 'people-fill', label: 'Gestión Usuarios' },
                { id: 'tarifas', icon: 'tags-fill', label: 'Tarifas' },
                { divider: true },
                { id: 'perfil', icon: 'person-gear', label: 'Mi Perfil' },
            ];
            bottomItems = [
                { id: 'dashboard', icon: 'speedometer2', label: 'Inicio' },
                { id: 'validar', icon: 'clipboard-check', label: 'Validar', badge: true },
                { id: 'reportes', icon: 'bar-chart-line-fill', label: 'Reportes' },
                { id: 'usuarios', icon: 'people-fill', label: 'Usuarios' },
            ];
        }

        // Render sidebar
        sidebarNav.innerHTML = menuItems.map(item => {
            if (item.divider) return '<div class="nav-divider"></div>';
            return `
                <div class="nav-item" data-page="${item.id}" onclick="App.navigate('${item.id}')">
                    <i class="bi bi-${item.icon}"></i>
                    <span>${item.label}</span>
                    ${item.badge ? '<span class="nav-badge" id="sidebar-badge-' + item.id + '" style="display:none">0</span>' : ''}
                </div>`;
        }).join('');

        // Render bottom nav
        bottomNav.innerHTML = bottomItems.map(item => `
            <button class="nav-tab" data-page="${item.id}" onclick="App.navigate('${item.id}')">
                <i class="bi bi-${item.icon}"></i>
                <span>${item.label}</span>
                ${item.badge ? '<span class="tab-badge" id="bottom-badge-' + item.id + '" style="display:none">0</span>' : ''}
            </button>
        `).join('');
    },

    setActivePage(pageId) {
        this.currentPage = pageId;

        // Update sidebar
        document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => {
            el.classList.toggle('active', el.dataset.page === pageId);
        });

        // Update bottom nav
        document.querySelectorAll('.bottom-nav .nav-tab').forEach(el => {
            el.classList.toggle('active', el.dataset.page === pageId);
        });
    },

    async updateBadges() {
        if (!Auth.isAdminOrCoadmin()) return;
        try {
            const res = await API.getMe();
            if (res.success && res.data.pagos_por_validar > 0) {
                const count = res.data.pagos_por_validar;
                const sidebarBadge = document.getElementById('sidebar-badge-validar');
                const bottomBadge = document.getElementById('bottom-badge-validar');
                if (sidebarBadge) { sidebarBadge.textContent = count; sidebarBadge.style.display = ''; }
                if (bottomBadge) { bottomBadge.textContent = count; bottomBadge.style.display = ''; }
            }
        } catch (e) {}
    },

    // =================== HELPERS ===================
    emptyState(icon, title, description = '') {
        return `
            <div class="empty-state">
                <i class="bi bi-${icon}"></i>
                <h4>${title}</h4>
                ${description ? `<p>${description}</p>` : ''}
            </div>`;
    },

    badgeEstado(estado) {
        const cls = { pendiente: 'badge-pendiente', aprobado: 'badge-aprobado', rechazado: 'badge-rechazado' };
        const labels = { pendiente: 'Pendiente', aprobado: 'Aprobado', rechazado: 'Rechazado' };
        return `<span class="badge-estado ${cls[estado] || ''}">${labels[estado] || estado}</span>`;
    },

    metodoPagoIcon(metodo) {
        const icons = { yape: 'phone-fill', transferencia: 'bank', efectivo: 'cash-coin' };
        const labels = { yape: 'Yape', transferencia: 'Transferencia', efectivo: 'Efectivo' };
        return `<i class="bi bi-${icons[metodo] || 'credit-card'}"></i> ${labels[metodo] || metodo}`;
    }
};
