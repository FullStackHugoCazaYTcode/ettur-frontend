/**
 * ETTUR - Página Gestión de Usuarios (Solo Admin)
 */
const PageUsuarios = {
    async render() {
        const main = document.getElementById('app-main');
        UI.loading();

        const res = await API.getUsuarios();

        if (!res.success) {
            main.innerHTML = `<div class="alert alert-danger">${res.message}</div>`;
            return;
        }

        const usuarios = res.data;

        const grouped = { admin: [], coadmin: [], trabajador: [] };
        usuarios.forEach(u => { if (grouped[u.rol]) grouped[u.rol].push(u); });

        const renderGroup = (title, icon, users, rolClass) => {
            if (users.length === 0) return '';
            return `
                <div class="card-ettur fade-in mb-3">
                    <div class="card-head">
                        <h3><i class="bi bi-${icon}"></i> ${title} (${users.length})</h3>
                    </div>
                    <div class="card-body-inner">
                        ${users.map(u => `
                        <div class="user-item">
                            <div class="user-avatar-sm ${rolClass}">${u.nombres.charAt(0)}${u.apellidos.charAt(0)}</div>
                            <div class="user-info-text">
                                <div class="user-name">
                                    <span class="status-dot ${u.activo ? 'active' : 'inactive'}"></span>
                                    ${u.nombres} ${u.apellidos}
                                </div>
                                <div class="user-detail">DNI: ${u.dni} · @${u.username}</div>
                                ${u.fecha_inicio_cobro ? `<div class="user-detail"><i class="bi bi-calendar3"></i> Inicio: ${CONFIG.formatDate(u.fecha_inicio_cobro)}</div>` : ''}
                            </div>
                            <div class="user-actions">
                                <button class="btn btn-outline-primary btn-sm" onclick="PageUsuarios.editar(${u.id})" title="Editar">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-outline-${u.activo ? 'warning' : 'success'} btn-sm" 
                                        onclick="PageUsuarios.toggleEstado(${u.id}, '${u.nombres} ${u.apellidos}', ${u.activo})" 
                                        title="${u.activo ? 'Dar de baja' : 'Activar'}">
                                    <i class="bi bi-${u.activo ? 'pause' : 'play'}"></i>
                                </button>
                            </div>
                        </div>`).join('')}
                    </div>
                </div>`;
        };

        main.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div class="page-title mb-0"><i class="bi bi-people-fill"></i> Usuarios</div>
                <button class="btn btn-accent btn-ettur btn-sm-ettur" onclick="PageUsuarios.nuevo()">
                    <i class="bi bi-plus-lg"></i> Nuevo
                </button>
            </div>

            ${renderGroup('Administradores', 'shield-fill', grouped.admin, 'admin')}
            ${renderGroup('Coadministradores', 'person-badge', grouped.coadmin, 'coadmin')}
            ${renderGroup('Trabajadores', 'people', grouped.trabajador, 'trabajador')}
        `;
    },

    nuevo() {
        this.showForm(null);
    },

    async editar(id) {
        const res = await API.getUsuario(id);
        if (!res.success) { UI.toast(res.message, 'error'); return; }
        this.showForm(res.data);
    },

    showForm(user) {
        const isEdit = !!user;
        const title = isEdit ? 'Editar Usuario' : 'Nuevo Usuario';

        const body = `
            <form id="form-usuario">
                <div class="row g-2 mb-3">
                    <div class="col-6">
                        <label class="form-label" style="font-size:0.8rem">Nombres *</label>
                        <input type="text" class="form-control" id="usr-nombres" value="${user?.nombres || ''}" required>
                    </div>
                    <div class="col-6">
                        <label class="form-label" style="font-size:0.8rem">Apellidos *</label>
                        <input type="text" class="form-control" id="usr-apellidos" value="${user?.apellidos || ''}" required>
                    </div>
                </div>
                <div class="row g-2 mb-3">
                    <div class="col-6">
                        <label class="form-label" style="font-size:0.8rem">DNI *</label>
                        <input type="text" class="form-control" id="usr-dni" value="${user?.dni || ''}" maxlength="8" pattern="\\d{8}" required>
                    </div>
                    <div class="col-6">
                        <label class="form-label" style="font-size:0.8rem">Teléfono</label>
                        <input type="text" class="form-control" id="usr-telefono" value="${user?.telefono || ''}">
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label" style="font-size:0.8rem">Email</label>
                    <input type="email" class="form-control" id="usr-email" value="${user?.email || ''}">
                </div>
                <div class="row g-2 mb-3">
                    <div class="col-6">
                        <label class="form-label" style="font-size:0.8rem">Usuario *</label>
                        <input type="text" class="form-control" id="usr-username" value="${user?.username || ''}" required>
                    </div>
                    <div class="col-6">
                        <label class="form-label" style="font-size:0.8rem">Rol *</label>
                        <select class="form-select" id="usr-rol" onchange="PageUsuarios.toggleFechaInicio()">
                            <option value="3" ${user?.rol_id == 3 ? 'selected' : ''}>Trabajador</option>
                            <option value="2" ${user?.rol_id == 2 ? 'selected' : ''}>Coadministrador</option>
                            <option value="1" ${user?.rol_id == 1 ? 'selected' : ''}>Administrador</option>
                        </select>
                    </div>
                </div>
                ${!isEdit ? `
                <div class="mb-3">
                    <label class="form-label" style="font-size:0.8rem">Contraseña *</label>
                    <input type="password" class="form-control" id="usr-password" minlength="6" required>
                </div>` : ''}
                <div class="mb-3" id="fecha-inicio-section" style="${(!user || user.rol_id == 3) ? '' : 'display:none'}">
                    <label class="form-label" style="font-size:0.8rem">Fecha Inicio de Cobro (Puesta en Marcha)</label>
                    <input type="date" class="form-control" id="usr-fecha-inicio" value="${user?.fecha_inicio_cobro || ''}">
                    <small class="text-muted">Solo se cobrarán periodos a partir de esta fecha</small>
                </div>
                <div id="usr-error" class="alert alert-danger d-none"></div>
            </form>`;

        const footer = `
            <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
            ${isEdit ? `<button class="btn btn-warning btn-sm" onclick="PageUsuarios.resetPassword(${user.id})"><i class="bi bi-key"></i> Reset Pass</button>` : ''}
            <button class="btn btn-primary-ettur btn-ettur" id="btn-save-user">${isEdit ? 'Guardar Cambios' : 'Crear Usuario'}</button>`;

        const modal = UI.modal(title, body, footer);

        document.getElementById('btn-save-user').onclick = async () => {
            const data = {
                nombres: document.getElementById('usr-nombres').value.trim(),
                apellidos: document.getElementById('usr-apellidos').value.trim(),
                dni: document.getElementById('usr-dni').value.trim(),
                telefono: document.getElementById('usr-telefono').value.trim(),
                email: document.getElementById('usr-email').value.trim(),
                username: document.getElementById('usr-username').value.trim(),
                rol_id: parseInt(document.getElementById('usr-rol').value),
                fecha_inicio_cobro: document.getElementById('usr-fecha-inicio').value,
            };

            if (!data.nombres || !data.apellidos || !data.dni || !data.username) {
                document.getElementById('usr-error').textContent = 'Complete los campos obligatorios';
                document.getElementById('usr-error').classList.remove('d-none');
                return;
            }

            let res;
            if (isEdit) {
                data.id = user.id;
                res = await API.editarUsuario(data);
            } else {
                data.password = document.getElementById('usr-password').value;
                if (!data.password || data.password.length < 6) {
                    document.getElementById('usr-error').textContent = 'Contraseña mínima: 6 caracteres';
                    document.getElementById('usr-error').classList.remove('d-none');
                    return;
                }
                res = await API.crearUsuario(data);
            }

            if (res.success) {
                modal.hide();
                UI.toast(res.message, 'success');
                this.render();
            } else {
                document.getElementById('usr-error').textContent = res.message;
                document.getElementById('usr-error').classList.remove('d-none');
            }
        };
    },

    toggleFechaInicio() {
        const rol = document.getElementById('usr-rol').value;
        document.getElementById('fecha-inicio-section').style.display = rol == '3' ? '' : 'none';
    },

    toggleEstado(id, nombre, activo) {
        const accion = activo ? 'dar de baja' : 'activar';
        UI.confirm(
            activo ? 'Dar de Baja' : 'Activar Usuario',
            `¿Desea ${accion} a <strong>${nombre}</strong>?`,
            async () => {
                const res = await API.toggleUsuario(id);
                if (res.success) {
                    UI.toast(res.message, 'success');
                    this.render();
                } else {
                    UI.toast(res.message, 'error');
                }
            },
            activo ? 'Dar de Baja' : 'Activar',
            activo ? 'warning' : 'success'
        );
    },

    resetPassword(id) {
        const body = `
            <div class="form-section">
                <label>Nueva Contraseña</label>
                <input type="password" class="form-control" id="new-pass" minlength="6" placeholder="Mínimo 6 caracteres">
            </div>`;
        const footer = `
            <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button class="btn btn-warning" id="btn-reset-pass">Restablecer</button>`;

        const modal = UI.modal('Restablecer Contraseña', body, footer);

        document.getElementById('btn-reset-pass').onclick = async () => {
            const pass = document.getElementById('new-pass').value;
            if (!pass || pass.length < 6) {
                UI.toast('Mínimo 6 caracteres', 'error');
                return;
            }
            modal.hide();
            const res = await API.resetPassword(id, pass);
            UI.toast(res.success ? res.message : res.message, res.success ? 'success' : 'error');
        };
    }
};
