/**
 * ETTUR - Página Mi Perfil v2.0
 * Admin: config Yape | Todos: ver placa y datos
 */
const PagePerfil = {
    async render() {
        const main = document.getElementById('app-main');
        const user = Auth.getUser();

        // Cargar config de Yape si es admin
        let yapeNumero = '';
        let yapeNombre = '';
        if (Auth.isAdmin()) {
            const res = await API.getConfig();
            if (res.success) {
                yapeNumero = res.data.yape_numero || '';
                yapeNombre = res.data.yape_nombre || '';
            }
        }

        main.innerHTML = `
            <div class="page-title"><i class="bi bi-person-gear"></i> Mi Perfil</div>

            <div class="card-ettur fade-in">
                <div class="card-body-inner pt-3">
                    <div class="text-center mb-3">
                        <div style="width:64px;height:64px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:700;margin:0 auto">
                            ${user.nombres.charAt(0)}${user.apellidos.charAt(0)}
                        </div>
                        <h5 class="mt-2 mb-0">${user.nombres} ${user.apellidos}</h5>
                        <span class="badge-role mt-1">${Auth.getRolLabel()}</span>
                    </div>

                    <table class="table table-sm table-borderless" style="font-size:0.85rem">
                        <tr><td class="text-muted" style="width:40%">DNI:</td><td class="fw-semibold">${user.dni}</td></tr>
                        <tr><td class="text-muted">Placa:</td><td class="fw-semibold">🚗 ${user.placa || '—'}</td></tr>
                        ${user.telefono ? `<tr><td class="text-muted">Teléfono:</td><td>${user.telefono}</td></tr>` : ''}
                        ${user.email ? `<tr><td class="text-muted">Email:</td><td>${user.email}</td></tr>` : ''}
                        ${user.tipo_trabajador ? `<tr><td class="text-muted">Tipo:</td><td>${CONFIG.tipoTrabajadorBadge(user.tipo_trabajador)}</td></tr>` : ''}
                    </table>
                </div>
            </div>

            ${Auth.isAdmin() ? `
            <div class="card-ettur fade-in" style="animation-delay:0.1s">
                <div class="card-head"><h3><i class="bi bi-phone-fill text-success"></i> Configuración de Yape</h3></div>
                <div class="card-body-inner">
                    <p style="font-size:0.8rem;color:var(--text-secondary)">
                        Estos datos se mostrarán a los trabajadores cuando seleccionen Yape como método de pago.
                    </p>
                    <div class="mb-3">
                        <label class="form-label" style="font-size:0.8rem">Nombre del titular Yape</label>
                        <input type="text" class="form-control" id="cfg-yape-nombre" value="${yapeNombre}" placeholder="Ej: Juan Pérez">
                    </div>
                    <div class="mb-3">
                        <label class="form-label" style="font-size:0.8rem">Número de Yape</label>
                        <input type="text" class="form-control" id="cfg-yape-numero" value="${yapeNumero}" placeholder="Ej: 999888777" maxlength="15" inputmode="numeric">
                    </div>
                    <button class="btn btn-success-ettur btn-ettur w-100" onclick="PagePerfil.guardarYape()">
                        <i class="bi bi-check-lg"></i> Guardar Configuración Yape
                    </button>
                </div>
            </div>` : ''}

            <div class="card-ettur fade-in" style="animation-delay:0.2s">
                <div class="card-head"><h3><i class="bi bi-gear"></i> Configuración</h3></div>
                <div class="card-body-inner">
                    <div class="form-section">
                        <label>URL del Servidor (API)</label>
                        <div class="input-group">
                            <input type="text" class="form-control" id="cfg-api-url" value="${CONFIG.API_BASE}" placeholder="https://tu-backend.railway.app">
                            <button class="btn btn-outline-primary" onclick="PagePerfil.saveApiUrl()">
                                <i class="bi bi-save"></i>
                            </button>
                        </div>
                        <small class="text-muted">Cambia la URL del backend si es necesario</small>
                    </div>
                </div>
            </div>

            <div class="text-center mt-3 mb-4">
                <button class="btn btn-outline-danger" onclick="Auth.logout()">
                    <i class="bi bi-box-arrow-left"></i> Cerrar Sesión
                </button>
                <p class="text-muted mt-2" style="font-size:0.75rem">${CONFIG.APP_NAME} v${CONFIG.VERSION}</p>
            </div>`;
    },

    async guardarYape() {
        const nombre = document.getElementById('cfg-yape-nombre').value.trim();
        const numero = document.getElementById('cfg-yape-numero').value.trim();

        const res = await API.updateConfig({
            yape_nombre: nombre,
            yape_numero: numero
        });

        if (res.success) {
            UI.toast('Configuración de Yape guardada', 'success');
        } else {
            UI.toast(res.message, 'error');
        }
    },

    saveApiUrl() {
        const url = document.getElementById('cfg-api-url').value.trim().replace(/\/+$/, '');
        if (url) {
            localStorage.setItem('ettur_api_url', url);
            CONFIG.API_BASE = url;
            UI.toast('URL guardada', 'success');
        }
    }
};
