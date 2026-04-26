/**
 * ETTUR - Gestión de Usuarios v3.1
 * Con documentos del trabajador
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
        if (normal && verano && normal.monto === verano.monto) return `S/${parseFloat(normal.monto).toFixed(2)} ${freq} siempre`;
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
                    <div class="card-head"><h3><i class="bi bi-${icon}"></i> ${title} (${users.length})</h3></div>
                    <div class="card-body-inner">
                        ${users.map(u => {
                            const tipoLabel = u.tipo_trabajador ? CONFIG.tipoTrabajadorBadge(u.tipo_trabajador) : '';
                            const montoP = u.tipo_trabajador === 'personalizado' && u.monto_personalizado ? ` · S/${parseFloat(u.monto_personalizado).toFixed(2)}` : '';
                            const escapedName = (u.nombres + ' ' + u.apellidos).replace(/'/g, "\\'");
                            return `
                            <div class="user-item">
                                <div class="user-avatar-sm ${rolClass}">${u.nombres.charAt(0)}${u.apellidos.charAt(0)}</div>
                                <div class="user-info-text">
                                    <div class="user-name"><span class="status-dot ${u.activo ? 'active' : 'inactive'}"></span>${u.nombres} ${u.apellidos}</div>
                                    <div class="user-detail">DNI: ${u.dni} · 🚗 ${u.placa || '—'}</div>
                                    <div class="user-detail">${tipoLabel}${montoP}</div>
                                    ${u.fecha_inicio_cobro ? `<div class="user-detail"><i class="bi bi-calendar3"></i> Inicio: ${CONFIG.formatDate(u.fecha_inicio_cobro)}</div>` : ''}
                                </div>
                                <div class="user-actions">
                                    <button class="btn btn-outline-primary btn-sm" onclick="PageUsuarios.editar(${u.id})" title="Editar"><i class="bi bi-pencil"></i></button>
                                    ${u.rol === 'trabajador' ? `<button class="btn btn-outline-info btn-sm" onclick="PageUsuarios.editarDocumentos(${u.id}, '${escapedName}')" title="Documentos"><i class="bi bi-folder2-open"></i></button>` : ''}
                                    <button class="btn btn-outline-${u.activo ? 'warning' : 'success'} btn-sm" onclick="PageUsuarios.toggleEstado(${u.id}, '${escapedName}', ${u.activo})"><i class="bi bi-${u.activo ? 'pause' : 'play'}"></i></button>
                                    ${u.rol !== 'admin' ? `<button class="btn btn-outline-danger btn-sm" onclick="PageUsuarios.eliminar(${u.id}, '${escapedName}')"><i class="bi bi-trash"></i></button>` : ''}
                                </div>
                            </div>`;
                        }).join('')}
                    </div>
                </div>`;
        };
        main.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div class="page-title mb-0"><i class="bi bi-people-fill"></i> Usuarios</div>
                <button class="btn btn-accent btn-ettur btn-sm-ettur" onclick="PageUsuarios.nuevo()"><i class="bi bi-plus-lg"></i> Nuevo</button>
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
        let fechaLanzamiento = '';
        if (isEdit && user.rol_id == 3) {
            try {
                const resP = await API.getPeriodosPendientes(user.id);
                if (resP.success) { fechaLanzamiento = resP.data.fecha_lanzamiento || ''; }
            } catch(e) {}
        }
        const body = `
            <form id="form-usuario">
                <div class="row g-2 mb-3">
                    <div class="col-6"><label class="form-label" style="font-size:0.8rem">Nombres *</label><input type="text" class="form-control" id="usr-nombres" value="${user?.nombres || ''}" required></div>
                    <div class="col-6"><label class="form-label" style="font-size:0.8rem">Apellidos *</label><input type="text" class="form-control" id="usr-apellidos" value="${user?.apellidos || ''}" required></div>
                </div>
                <div class="row g-2 mb-3">
                    <div class="col-4"><label class="form-label" style="font-size:0.8rem">DNI *</label><input type="text" class="form-control" id="usr-dni" value="${user?.dni || ''}" maxlength="8" required inputmode="numeric"></div>
                    <div class="col-4"><label class="form-label" style="font-size:0.8rem">Placa *</label><input type="text" class="form-control" id="usr-placa" value="${user?.placa || ''}" required style="text-transform:uppercase"></div>
                    <div class="col-4"><label class="form-label" style="font-size:0.8rem">Teléfono</label><input type="text" class="form-control" id="usr-telefono" value="${user?.telefono || ''}"></div>
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
                            <option value="personalizado" ${user?.tipo_trabajador == 'personalizado' ? 'selected' : ''}>Personalizado</option>
                        </select>
                    </div>
                    <div id="personalizado-fields" style="${user?.tipo_trabajador == 'personalizado' ? '' : 'display:none'}">
                        <div class="row g-2 mb-3">
                            <div class="col-6"><label class="form-label" style="font-size:0.8rem">Monto (S/.)</label><input type="number" class="form-control" id="usr-monto-pers" value="${user?.monto_personalizado || ''}" step="0.50" min="0.01"></div>
                            <div class="col-6"><label class="form-label" style="font-size:0.8rem">Frecuencia</label><select class="form-select" id="usr-freq-pers"><option value="semanal" ${user?.frecuencia_personalizado == 'semanal' ? 'selected' : ''}>Semanal</option><option value="mensual" ${user?.frecuencia_personalizado == 'mensual' ? 'selected' : ''}>Mensual</option></select></div>
                        </div>
                    </div>
                    <div class="row g-2 mb-3">
                        <div class="col-6"><label class="form-label" style="font-size:0.8rem">📅 Fecha Inicio Deuda *</label><input type="date" class="form-control" id="usr-fecha-inicio" value="${user?.fecha_inicio_cobro || ''}"><small class="text-muted">Desde cuándo debe</small></div>
                        <div class="col-6"><label class="form-label" style="font-size:0.8rem">🚀 Fecha Lanzamiento</label><input type="date" class="form-control" id="usr-fecha-lanzamiento" value="${fechaLanzamiento}"><small class="text-muted">Desde cuándo corre la app</small></div>
                    </div>
                </div>
                <div id="usr-error" class="alert alert-danger d-none"></div>
            </form>`;
        const footer = `
            <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
            ${isEdit ? `<button class="btn btn-warning btn-sm" onclick="PageUsuarios.resetPlaca(${user.id}, '${user.placa || ''}')"><i class="bi bi-truck-front"></i></button>` : ''}
            <button class="btn btn-primary-ettur btn-ettur" id="btn-save-user">${isEdit ? 'Guardar' : 'Crear'}</button>`;
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
                document.getElementById('usr-error').textContent = 'Complete campos obligatorios';
                document.getElementById('usr-error').classList.remove('d-none'); return;
            }
            if (data.rol_id == 3) {
                data.tipo_trabajador = document.getElementById('usr-tipo-trab').value;
                data.fecha_inicio_cobro = document.getElementById('usr-fecha-inicio').value;
                data.fecha_lanzamiento = document.getElementById('usr-fecha-lanzamiento').value;
                if (!data.fecha_inicio_cobro) { document.getElementById('usr-error').textContent = 'Fecha inicio deuda obligatoria'; document.getElementById('usr-error').classList.remove('d-none'); return; }
                if (data.tipo_trabajador === 'personalizado') {
                    data.monto_personalizado = parseFloat(document.getElementById('usr-monto-pers').value);
                    data.frecuencia_personalizado = document.getElementById('usr-freq-pers').value;
                    if (!data.monto_personalizado) { document.getElementById('usr-error').textContent = 'Monto requerido'; document.getElementById('usr-error').classList.remove('d-none'); return; }
                }
            }
            let res;
            if (isEdit) { data.id = user.id; res = await API.editarUsuario(data); }
            else { res = await API.crearUsuario(data); }
            if (res.success) { modal.hide(); UI.toast(res.message, 'success'); this.render(); }
            else { document.getElementById('usr-error').textContent = res.message; document.getElementById('usr-error').classList.remove('d-none'); }
        };
    },

    // ============= DOCUMENTOS =============
    async editarDocumentos(userId, nombre) {
        const res = await API.getDocumentos(userId);
        if (!res.success) { UI.toast(res.message, 'error'); return; }
        const docs = res.data;

        const tipos = [
            { key: 'licencia', icon: 'card-heading', label: 'Licencia de Conducir', color: '#3b82f6', hasCategoria: true, hasNumero: true },
            { key: 'soat', icon: 'shield-check', label: 'SOAT', color: '#22c55e' },
            { key: 'revision_tecnica', icon: 'wrench-adjustable', label: 'Revisión Técnica', color: '#f59e0b' },
            { key: 'tarjeta_circulacion', icon: 'credit-card-2-front', label: 'Tarjeta de Circulación', color: '#8b5cf6' },
            { key: 'tarjeta_operatividad', icon: 'file-earmark-check', label: 'Tarjeta de Operatividad', color: '#ec4899' }
        ];

        const tabs = tipos.map((t, i) => `
            <button class="btn btn-sm ${i === 0 ? 'btn-primary' : 'btn-outline-secondary'} doc-tab-btn" data-tab="doc-tab-${t.key}" onclick="PageUsuarios.switchDocTab('${t.key}')" style="font-size:0.7rem;padding:0.25rem 0.5rem">
                <i class="bi bi-${t.icon}"></i> ${t.label.split(' ')[0]}
            </button>`).join('');

        const panels = tipos.map((t, i) => {
            const doc = docs[t.key];
            const dni = document.getElementById('usr-dni')?.value || '';
            return `
            <div id="doc-tab-${t.key}" class="doc-panel" style="${i > 0 ? 'display:none' : ''}">
                <h6 style="color:${t.color}"><i class="bi bi-${t.icon}"></i> ${t.label}</h6>
                ${t.hasNumero ? `
                <div class="mb-2">
                    <label class="form-label" style="font-size:0.75rem">Número de Licencia</label>
                    <input type="text" class="form-control form-control-sm" id="doc-${t.key}-numero" value="${doc?.numero || ''}" placeholder="M + DNI">
                </div>` : ''}
                ${t.hasCategoria ? `
                <div class="mb-2">
                    <label class="form-label" style="font-size:0.75rem">Categoría</label>
                    <select class="form-select form-select-sm" id="doc-${t.key}-categoria">
                        <option value="">Seleccionar...</option>
                        ${['A1','A2A','A2B','A3A','A3B','A3C'].map(c => `<option value="${c}" ${doc?.categoria === c ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                </div>` : ''}
                <div class="row g-2 mb-2">
                    <div class="col-6">
                        <label class="form-label" style="font-size:0.75rem">Fecha Inicio</label>
                        <input type="date" class="form-control form-control-sm" id="doc-${t.key}-inicio" value="${doc?.fecha_inicio || ''}">
                    </div>
                    <div class="col-6">
                        <label class="form-label" style="font-size:0.75rem">Fecha Vencimiento</label>
                        <input type="date" class="form-control form-control-sm" id="doc-${t.key}-vencimiento" value="${doc?.fecha_vencimiento || ''}">
                    </div>
                </div>
                ${doc ? `
                <div class="mb-2" style="font-size:0.75rem">
                    ${doc.vencido ? '<span class="badge bg-danger">VENCIDO</span>' : doc.por_vencer ? '<span class="badge bg-warning text-dark">POR VENCER</span>' : doc.dias_restantes !== null ? '<span class="badge bg-success">VIGENTE</span>' : ''}
                    ${doc.dias_restantes !== null ? (doc.vencido ? ` Venció hace ${Math.abs(doc.dias_restantes)} días` : ` ${doc.dias_restantes} días restantes`) : ''}
                </div>` : ''}
                <button class="btn btn-primary-ettur btn-ettur btn-sm w-100" onclick="PageUsuarios.guardarDocumento(${userId}, '${t.key}')">
                    <i class="bi bi-save"></i> Guardar ${t.label}
                </button>
            </div>`;
        }).join('');

        const body = `
            <div class="d-flex gap-1 flex-wrap mb-3">${tabs}</div>
            <div id="doc-panels">${panels}</div>
            <div id="doc-msg" class="mt-2"></div>`;

        UI.modal(`Documentos — ${nombre}`, body, '<button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cerrar</button>');
    },

    switchDocTab(key) {
        document.querySelectorAll('.doc-panel').forEach(p => p.style.display = 'none');
        document.querySelectorAll('.doc-tab-btn').forEach(b => { b.className = b.className.replace('btn-primary', 'btn-outline-secondary'); });
        const panel = document.getElementById('doc-tab-' + key);
        if (panel) panel.style.display = '';
        const btn = document.querySelector(`[data-tab="doc-tab-${key}"]`);
        if (btn) btn.className = btn.className.replace('btn-outline-secondary', 'btn-primary');
    },

    async guardarDocumento(userId, tipo) {
        const data = {
            usuario_id: userId,
            tipo_documento: tipo,
            fecha_inicio: document.getElementById(`doc-${tipo}-inicio`)?.value || '',
            fecha_vencimiento: document.getElementById(`doc-${tipo}-vencimiento`)?.value || ''
        };

        if (tipo === 'licencia') {
            data.numero = document.getElementById(`doc-${tipo}-numero`)?.value || '';
            data.categoria = document.getElementById(`doc-${tipo}-categoria`)?.value || '';
        }

        const res = await API.guardarDocumento(data);
        if (res.success) {
            UI.toast(`${tipo.replace('_', ' ')} guardado correctamente`, 'success');
            // Recargar modal
            const nombre = document.querySelector('.modal-title')?.textContent?.replace('Documentos — ', '') || '';
            UI.closeModal();
            setTimeout(() => this.editarDocumentos(userId, nombre), 300);
        } else {
            UI.toast(res.message, 'error');
        }
    },

    toggleTipoTrab() {
        document.getElementById('trabajador-fields').style.display = document.getElementById('usr-rol').value == '3' ? '' : 'none';
    },
    togglePersonalizado() {
        document.getElementById('personalizado-fields').style.display = document.getElementById('usr-tipo-trab').value === 'personalizado' ? '' : 'none';
    },
    toggleEstado(id, nombre, activo) {
        UI.confirm(activo ? 'Dar de Baja' : 'Activar', `¿${activo ? 'Dar de baja' : 'Activar'} a <strong>${nombre}</strong>?`,
            async () => { const res = await API.toggleUsuario(id); if (res.success) { UI.toast(res.message, 'success'); this.render(); } else { UI.toast(res.message, 'error'); } },
            activo ? 'Baja' : 'Activar', activo ? 'warning' : 'success');
    },
    eliminar(id, nombre) {
        UI.confirm('Eliminar', `¿Eliminar a <strong>${nombre}</strong>?<br><small class="text-danger">Se borrarán todos sus datos.</small>`,
            async () => { const res = await API.eliminarUsuario(id); if (res.success) { UI.toast(res.message, 'success'); this.render(); } else { UI.toast(res.message, 'error'); } },
            'Eliminar', 'danger');
    },
    resetPlaca(id, placaActual) {
        const body = `<div class="form-section"><label>Nueva Placa</label><input type="text" class="form-control" id="new-placa" value="${placaActual}" style="text-transform:uppercase"></div>`;
        const footer = `<button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button><button class="btn btn-warning" id="btn-reset-placa">Actualizar</button>`;
        const modal = UI.modal('Cambiar Placa', body, footer);
        document.getElementById('btn-reset-placa').onclick = async () => {
            const placa = document.getElementById('new-placa').value.trim().toUpperCase();
            if (!placa) { UI.toast('Ingrese placa', 'error'); return; }
            modal.hide(); const res = await API.resetPlaca(id, placa);
            UI.toast(res.message, res.success ? 'success' : 'error');
            if (res.success) this.render();
        };
    }
};
