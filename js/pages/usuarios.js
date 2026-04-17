/**
 * ETTUR - Gestión de Usuarios v2.2
 * Con eliminación, tarifas dinámicas y placa
 */
const PageUsuarios = {
    tarifasCache: null,

    async cargarTarifas() {
        if (this.tarifasCache) return this.tarifasCache;
        const res = await API.getTarifas();
        if (res.success) { this.tarifasCache = res.data.tarifas || []; }
        return this.tarifasCache || [];
    },

    getTarifaTexto(tipo, tarifas) {
        const items = tarifas.filter(t => t.tipo_trabajador === tipo);
        if (items.length === 0) return '';
        const normal = items.find(t => t.temporada === 'normal');
        const verano = items.find(t => t.temporada === 'verano');
        const freq = items[0].frecuencia === 'mensual' ? 'mes.' : 'sem.';
        if (normal && verano && normal.monto === verano.monto) {
            return `S/${parseFloat(normal.monto).toFixed(2)} ${freq} siempre`;
        }
        let texto = '';
        if (normal) texto += `S/${parseFloat(normal.monto).toFixed(2)} ${freq} normal`;
        if (verano) texto += ` / S/${parseFloat(verano.monto).toFixed(2)} ${freq} verano`;
        return texto;
    },

    async render() {
        const main = document.getElementById('app-main');
        UI.loading();
        const res = await API.getUsuarios();
        if (!res.success) { main.innerHTML = `<div class="alert alert-danger">${res.message}</div>`; return; }
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
                        ${users.map(u => {
                            const tipoLabel = u.tipo_trabajador ? CONFIG.tipoTrabajadorBadge(u.tipo_trabajador) : '';
                            const montoPersonalizado = u.tipo_trabajador === 'personalizado' && u.monto_personalizado
                                ? ` · S/${parseFloat(u.monto_personalizado).toFixed(2)} ${u.frecuencia_personalizado || 'sem.'}`
                                : '';
                            const escapedName = (u.nombres + ' ' + u.apellidos).replace(/'/g, "\\'");
                            return `
                            <div class="user-item">
                                <div class="user-avatar-sm ${rolClass}">${u.nombres.charAt(0)}${u.apellidos.charAt(0)}</div>
                                <div class="user-info-text">
                                    <div class="user-name">
                                        <span class="status-dot ${u.activo ? 'active' : 'inactive'}"></span>
                                        ${u.nombres} ${u.apellidos}
                                    </div>
                                    <div class="user-detail">DNI: ${u.dni} · 🚗 ${u.placa || '—'}</div>
                                    <div class="user-detail">${tipoLabel}${montoPersonalizado}</div>
                                    ${u.fecha_inicio_cobro ? `<div class="user-detail"><i class="bi bi-calendar3"></i> Inicio: ${CONFIG.formatDate(u.fecha_inicio_cobro)}</div>` : ''}
                                </div>
                                <div class="user-actions">
                                    <button class="btn btn-outline-primary btn-sm" onclick="PageUsuarios.editar(${u.id})" title="Editar"><i class="bi bi-pencil"></i></button>
                                    <button class="btn btn-outline-${u.activo ? 'warning' : 'success'} btn-sm"
                                            onclick="PageUsuarios.toggleEstado(${u.id}, '${escapedName}', ${u.activo})"
                                            title="${u.activo ? 'Dar de baja' : 'Activar'}">
                                        <i class="bi bi-${u.activo ? 'pause' : 'play'}"></i>
                                    </button>
                                    ${u.rol !== 'admin' ? `
                                    <button class="btn btn-outline-danger btn-sm" onclick="PageUsuarios.eliminar(${u.id}, '${escapedName}')" title="Eliminar">
                                        <i class="bi bi-trash"></i>
                                    </button>` : ''}
                                </div>
                            </div>`;
                        }).join('')}
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
            ${renderGroup('Trabajadores', 'people', grouped.trabajador, 'trabajador')}`;
    },

    nuevo() { this.tarifasCache = null; this.showForm(null); },

    async editar(id) {
        this.tarifasCache = null;
        const res = await API.getUsuario(id);
        if (!res.success) { UI.toast(res.message, 'error'); return; }
        this.showForm(res.data);
    },

    async showForm(user) {
        const isEdit = !!user;
        const title = isEdit ? 'Editar Usuario' : 'Nuevo Usuario';
        const tarifas = await this.cargarTarifas();
        const textoNormal = this.getTarifaTexto('normal', tarifas);
        const textoEspecial = this.getTarifaTexto('especial', tarifas);
        const textoMensual = this.getTarifaTexto('mensual', tarifas);

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
                    <div class="col-4">
                        <label class="form-label" style="font-size:0.8rem">DNI *</label>
                        <input type="text" class="form-control" id="usr-dni" value="${user?.dni || ''}" maxlength="8" pattern="\\d{8}" required inputmode="numeric">
                    </div>
                    <div class="col-4">
                        <label class="form-label" style="font-size:0.8rem">Placa *</label>
                        <input type="text" class="form-control" id="usr-placa" value="${user?.placa || ''}" required style="text-transform:uppercase" placeholder="ABC-123">
                    </div>
                    <div class="col-4">
                        <label class="form-label" style="font-size:0.8rem">Teléfono</label>
                        <input type="text" class="form-control" id="usr-telefono" value="${user?.telefono || ''}">
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label" style="font-size:0.8rem">Rol *</label>
                    <select class="form-select" id="usr-rol" onchange="PageUsuarios.toggleTipoTrab()">
                        <option value="3" ${user?.rol_id == 3 ? 'selected' : ''}>Trabajador</option>
                        <option value="2" ${user?.rol_id == 2 ? 'selected' : ''}>Coadministrador</option>
                        <option value="1" ${user?.rol_id == 1 ? 'selected' : ''}>Administrador</option>
                    </select>
                </div>
                <div id="trabajador-fields" style="${(!user || user.rol_id == 3) ? '' : 'display:none'}">
                    <div class="mb-3">
                        <label class="form-label" style="font-size:0.8rem">Tipo de Trabajador *</label>
                        <select class="form-select" id="usr-tipo-trab" onchange="PageUsuarios.togglePersonalizado()">
                            <option value="normal" ${user?.tipo_trabajador == 'normal' ? 'selected' : ''}>Normal — ${textoNormal}</option>
                            <option value="especial" ${user?.tipo_trabajador == 'especial' ? 'selected' : ''}>Especial — ${textoEspecial}</option>
                            <option value="mensual" ${user?.tipo_trabajador == 'mensual' ? 'selected' : ''}>Mensual — ${textoMensual}</option>
                            <option value="personalizado" ${user?.tipo_trabajador == 'personalizado' ? 'selected' : ''}>Personalizado — monto a medida</option>
                        </select>
                    </div>
                    <div id="tipo-detalle" class="alert alert-light border mb-3" style="font-size:0.8rem">
                        <div id="detalle-normal" ${user?.tipo_trabajador && user.tipo_trabajador !== 'normal' ? 'style="display:none"' : ''}>
                            <i class="bi bi-person-fill text-primary"></i> <strong>Trabajador Normal</strong><br>Pago <strong>semanal</strong> — ${textoNormal}
                        </div>
                        <div id="detalle-especial" style="${user?.tipo_trabajador == 'especial' ? '' : 'display:none'}">
                            <i class="bi bi-star-fill text-info"></i> <strong>Trabajador Especial</strong><br>Pago <strong>semanal</strong> — ${textoEspecial}
                        </div>
                        <div id="detalle-mensual" style="${user?.tipo_trabajador == 'mensual' ? '' : 'display:none'}">
                            <i class="bi bi-calendar-month-fill text-success"></i> <strong>Trabajador Mensual</strong><br>Pago <strong>mensual</strong> — ${textoMensual}
                        </div>
                        <div id="detalle-personalizado" style="${user?.tipo_trabajador == 'personalizado' ? '' : 'display:none'}">
                            <i class="bi bi-gear-fill text-warning"></i> <strong>Trabajador Personalizado</strong><br>El monto y frecuencia se configuran manualmente abajo.
                        </div>
                    </div>
                    <div id="personalizado-fields" style="${user?.tipo_trabajador == 'personalizado' ? '' : 'display:none'}">
                        <div class="row g-2 mb-3">
                            <div class="col-6">
                                <label class="form-label" style="font-size:0.8rem">Monto (S/.) *</label>
                                <input type="number" class="form-control" id="usr-monto-pers" value="${user?.monto_personalizado || ''}" step="0.50" min="0.01">
                            </div>
                            <div class="col-6">
                                <label class="form-label" style="font-size:0.8rem">Frecuencia *</label>
                                <select class="form-select" id="usr-freq-pers">
                                    <option value="semanal" ${user?.frecuencia_personalizado == 'semanal' ? 'selected' : ''}>Semanal</option>
                                    <option value="mensual" ${user?.frecuencia_personalizado == 'mensual' ? 'selected' : ''}>Mensual</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label" style="font-size:0.8rem">Fecha Inicio de Cobro (Puesta en Marcha) *</label>
                        <input type="date" class="form-control" id="usr-fecha-inicio" value="${user?.fecha_inicio_cobro || ''}">
                        <small class="text-muted">Solo se cobrarán periodos a partir de esta fecha</small>
                    </div>
                </div>
                <div id="usr-error" class="alert alert-danger d-none"></div>
            </form>`;

        const footer = `
            <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
            ${isEdit ? `<button class="btn btn-warning btn-sm" onclick="PageUsuarios.resetPlaca(${user.id}, '${user.placa || ''}')"><i class="bi bi-truck-front"></i> Cambiar Placa</button>` : ''}
            <button class="btn btn-primary-ettur btn-ettur" id="btn-save-user">${isEdit ? 'Guardar' : 'Crear Usuario'}</button>`;

        const modal = UI.modal(title, body, footer);

        document.getElementById('btn-save-user').onclick = async () => {
            const data = {
                nombres: document.getElementById('usr-nombres').value.trim(),
                apellidos: document.getElementById('usr-apellidos').value.trim(),
                dni: document.getElementById('usr-dni').value.trim(),
                placa: document.getElementById('usr-placa').value.trim().toUpperCase(),
                telefono: document.getElementById('usr-telefono').value.trim(),
                rol_id: parseInt(document.getElementById('usr-rol').value),
            };
            if (!data.nombres || !data.apellidos || !data.dni || !data.placa) {
                document.getElementById('usr-error').textContent = 'Complete los campos obligatorios';
                document.getElementById('usr-error').classList.remove('d-none');
                return;
            }
            if (data.rol_id == 3) {
                data.tipo_trabajador = document.getElementById('usr-tipo-trab').value;
                data.fecha_inicio_cobro = document.getElementById('usr-fecha-inicio').value;
                if (!data.fecha_inicio_cobro) {
                    document.getElementById('usr-error').textContent = 'La fecha de inicio de cobro es obligatoria';
                    document.getElementById('usr-error').classList.remove('d-none');
                    return;
                }
                if (data.tipo_trabajador === 'personalizado') {
                    data.monto_personalizado = parseFloat(document.getElementById('usr-monto-pers').value);
                    data.frecuencia_personalizado = document.getElementById('usr-freq-pers').value;
                    if (!data.monto_personalizado || data.monto_personalizado <= 0) {
                        document.getElementById('usr-error').textContent = 'Ingrese el monto personalizado';
                        document.getElementById('usr-error').classList.remove('d-none');
                        return;
                    }
                }
            }
            let res;
            if (isEdit) { data.id = user.id; res = await API.editarUsuario(data); }
            else { res = await API.crearUsuario(data); }
            if (res.success) { modal.hide(); UI.toast(res.message, 'success'); this.render(); }
            else { document.getElementById('usr-error').textContent = res.message; document.getElementById('usr-error').classList.remove('d-none'); }
        };
    },

    toggleTipoTrab() {
        const rol = document.getElementById('usr-rol').value;
        document.getElementById('trabajador-fields').style.display = rol == '3' ? '' : 'none';
    },

    togglePersonalizado() {
        const tipo = document.getElementById('usr-tipo-trab').value;
        document.getElementById('personalizado-fields').style.display = tipo === 'personalizado' ? '' : 'none';
        ['normal', 'especial', 'mensual', 'personalizado'].forEach(t => {
            const el = document.getElementById('detalle-' + t);
            if (el) el.style.display = t === tipo ? '' : 'none';
        });
    },

    toggleEstado(id, nombre, activo) {
        UI.confirm(
            activo ? 'Dar de Baja' : 'Activar Usuario',
            `¿Desea ${activo ? 'dar de baja' : 'activar'} a <strong>${nombre}</strong>?`,
            async () => {
                const res = await API.toggleUsuario(id);
                if (res.success) { UI.toast(res.message, 'success'); this.render(); }
                else { UI.toast(res.message, 'error'); }
            },
            activo ? 'Dar de Baja' : 'Activar',
            activo ? 'warning' : 'success'
        );
    },

    eliminar(id, nombre) {
        UI.confirm(
            'Eliminar Usuario',
            `¿Está seguro de eliminar permanentemente a <strong>${nombre}</strong>?<br><br><small class="text-danger">Esta acción eliminará todos sus pagos y no se puede deshacer.</small>`,
            async () => {
                const res = await API.eliminarUsuario(id);
                if (res.success) { UI.toast(res.message, 'success'); this.render(); }
                else { UI.toast(res.message, 'error'); }
            },
            'Eliminar',
            'danger'
        );
    },

    resetPlaca(id, placaActual) {
        const body = `
            <div class="form-section">
                <label>Nueva Placa</label>
                <input type="text" class="form-control" id="new-placa" value="${placaActual}" style="text-transform:uppercase" placeholder="ABC-123">
            </div>`;
        const footer = `
            <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button class="btn btn-warning" id="btn-reset-placa">Actualizar Placa</button>`;
        const modal = UI.modal('Cambiar Placa', body, footer);
        document.getElementById('btn-reset-placa').onclick = async () => {
            const placa = document.getElementById('new-placa').value.trim().toUpperCase();
            if (!placa) { UI.toast('Ingrese la placa', 'error'); return; }
            modal.hide();
            const res = await API.resetPlaca(id, placa);
            UI.toast(res.message, res.success ? 'success' : 'error');
            if (res.success) this.render();
        };
    }
};
