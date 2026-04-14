/**
 * ETTUR - Página Mi Perfil
 */
const PagePerfil = {
    render() {
        const main = document.getElementById('app-main');
        const user = Auth.getUser();

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
                        <tr><td class="text-muted" style="width:40%">Usuario:</td><td class="fw-semibold">@${user.username}</td></tr>
                        <tr><td class="text-muted">DNI:</td><td>${user.dni}</td></tr>
                        ${user.telefono ? `<tr><td class="text-muted">Teléfono:</td><td>${user.telefono}</td></tr>` : ''}
                        ${user.email ? `<tr><td class="text-muted">Email:</td><td>${user.email}</td></tr>` : ''}
                        ${user.fecha_inicio_cobro ? `<tr><td class="text-muted">Inicio cobro:</td><td>${CONFIG.formatDate(user.fecha_inicio_cobro)}</td></tr>` : ''}
                    </table>
                </div>
            </div>

            <div class="card-ettur fade-in" style="animation-delay:0.1s">
                <div class="card-head"><h3><i class="bi bi-key"></i> Cambiar Contraseña</h3></div>
                <div class="card-body-inner">
                    <form id="form-password">
                        <div class="mb-3">
                            <label class="form-label" style="font-size:0.8rem">Contraseña Actual</label>
                            <input type="password" class="form-control" id="pass-actual" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label" style="font-size:0.8rem">Nueva Contraseña</label>
                            <input type="password" class="form-control" id="pass-nuevo" minlength="6" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label" style="font-size:0.8rem">Confirmar Nueva Contraseña</label>
                            <input type="password" class="form-control" id="pass-confirmar" minlength="6" required>
                        </div>
                        <div id="pass-error" class="alert alert-danger d-none"></div>
                        <button type="submit" class="btn btn-primary-ettur btn-ettur w-100">
                            <i class="bi bi-check-lg"></i> Actualizar Contraseña
                        </button>
                    </form>
                </div>
            </div>

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

        document.getElementById('form-password').onsubmit = async (e) => {
            e.preventDefault();
            const errorEl = document.getElementById('pass-error');
            errorEl.classList.add('d-none');

            const actual = document.getElementById('pass-actual').value;
            const nuevo = document.getElementById('pass-nuevo').value;
            const confirmar = document.getElementById('pass-confirmar').value;

            if (nuevo !== confirmar) {
                errorEl.textContent = 'Las contraseñas no coinciden';
                errorEl.classList.remove('d-none');
                return;
            }

            if (nuevo.length < 6) {
                errorEl.textContent = 'Mínimo 6 caracteres';
                errorEl.classList.remove('d-none');
                return;
            }

            const res = await API.changePassword(actual, nuevo);
            if (res.success) {
                UI.toast('Contraseña actualizada', 'success');
                document.getElementById('form-password').reset();
            } else {
                errorEl.textContent = res.message;
                errorEl.classList.remove('d-none');
            }
        };
    },

    saveApiUrl() {
        const url = document.getElementById('cfg-api-url').value.trim().replace(/\/+$/, '');
        if (url) {
            localStorage.setItem('ettur_api_url', url);
            CONFIG.API_BASE = url;
            UI.toast('URL guardada. Se usará en las próximas peticiones.', 'success');
        }
    }
};
