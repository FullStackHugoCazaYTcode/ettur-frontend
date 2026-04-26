/**
 * ETTUR - Página Mi Perfil v3.0
 * Con documentos del trabajador y config Yape para admin
 */
const PagePerfil = {
    async render() {
        const main = document.getElementById('app-main');
        UI.loading();
        const user = Auth.getUser();

        // Cargar documentos si es trabajador
        let docsHtml = '';
        if (Auth.isTrabajador()) {
            docsHtml = await this.renderDocumentosTrabajador();
        }

        // Cargar config Yape si es admin
        let yapeHtml = '';
        if (Auth.isAdmin()) {
            yapeHtml = await this.renderYapeConfig();
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

            ${docsHtml}
            ${yapeHtml}

            <div class="card-ettur fade-in" style="animation-delay:0.3s">
                <div class="card-head"><h3><i class="bi bi-gear"></i> Configuración</h3></div>
                <div class="card-body-inner">
                    <div class="form-section">
                        <label>URL del Servidor (API)</label>
                        <div class="input-group">
                            <input type="text" class="form-control" id="cfg-api-url" value="${CONFIG.API_BASE}">
                            <button class="btn btn-outline-primary" onclick="PagePerfil.saveApiUrl()"><i class="bi bi-save"></i></button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="text-center mt-3 mb-4">
                <button class="btn btn-outline-danger" onclick="Auth.logout()"><i class="bi bi-box-arrow-left"></i> Cerrar Sesión</button>
                <p class="text-muted mt-2" style="font-size:0.75rem">${CONFIG.APP_NAME} v${CONFIG.VERSION}</p>
            </div>`;
    },

    async renderDocumentosTrabajador() {
        const res = await API.getMisDocumentos();
        if (!res.success) return '';

        const docs = res.data;
        const tipos = [
            { key: 'licencia', icon: 'card-heading', label: 'Licencia de Conducir', color: '#3b82f6' },
            { key: 'soat', icon: 'shield-check', label: 'SOAT', color: '#22c55e' },
            { key: 'revision_tecnica', icon: 'wrench-adjustable', label: 'Revisión Técnica', color: '#f59e0b' },
            { key: 'tarjeta_circulacion', icon: 'credit-card-2-front', label: 'Tarjeta de Circulación', color: '#8b5cf6' },
            { key: 'tarjeta_operatividad', icon: 'file-earmark-check', label: 'Tarjeta de Operatividad', color: '#ec4899' }
        ];

        let cards = tipos.map(t => {
            const doc = docs[t.key];
            if (!doc) {
                return `
                <div class="card-ettur mb-2" style="opacity:0.5">
                    <div class="card-body-inner py-3">
                        <div class="d-flex align-items-center gap-2">
                            <div style="width:36px;height:36px;border-radius:8px;background:${t.color}15;color:${t.color};display:flex;align-items:center;justify-content:center">
                                <i class="bi bi-${t.icon}"></i>
                            </div>
                            <div>
                                <div class="fw-semibold" style="font-size:0.85rem">${t.label}</div>
                                <small class="text-muted">Sin registrar</small>
                            </div>
                        </div>
                    </div>
                </div>`;
            }

            const diasR = doc.dias_restantes;
            const vencido = doc.vencido;
            const porVencer = doc.por_vencer;

            let estadoBadge = '';
            let barraColor = '#22c55e';
            let diasTexto = '';

            if (vencido) {
                estadoBadge = '<span class="badge bg-danger" style="font-size:0.6rem">VENCIDO</span>';
                barraColor = '#ef4444';
                diasTexto = `Venció hace ${Math.abs(diasR)} día(s)`;
            } else if (porVencer) {
                estadoBadge = '<span class="badge bg-warning text-dark" style="font-size:0.6rem">POR VENCER</span>';
                barraColor = '#f59e0b';
                diasTexto = `Vence en ${diasR} día(s)`;
            } else if (diasR !== null) {
                estadoBadge = '<span class="badge bg-success" style="font-size:0.6rem">VIGENTE</span>';
                diasTexto = `Vence en ${diasR} día(s)`;
            }

            // Barra de progreso de vigencia
            let barraHtml = '';
            if (doc.fecha_inicio && doc.fecha_vencimiento) {
                const inicio = new Date(doc.fecha_inicio + 'T00:00:00');
                const fin = new Date(doc.fecha_vencimiento + 'T00:00:00');
                const hoy = new Date();
                const totalDias = (fin - inicio) / (1000 * 60 * 60 * 24);
                const diasPasados = (hoy - inicio) / (1000 * 60 * 60 * 24);
                const pct = totalDias > 0 ? Math.min(Math.max((diasPasados / totalDias) * 100, 0), 100) : 0;
                barraHtml = `
                    <div style="height:4px;background:#e2e8f0;border-radius:2px;overflow:hidden;margin-top:6px">
                        <div style="width:${pct}%;height:100%;background:${barraColor};border-radius:2px"></div>
                    </div>`;
            }

            let extraInfo = '';
            if (t.key === 'licencia') {
                extraInfo = `
                    ${doc.numero ? `<div style="font-size:0.75rem"><strong>N°:</strong> ${doc.numero}</div>` : ''}
                    ${doc.categoria ? `<div style="font-size:0.75rem"><strong>Categoría:</strong> <span class="badge bg-primary">${doc.categoria}</span></div>` : ''}`;
            }

            return `
            <div class="card-ettur mb-2">
                <div class="card-body-inner py-3">
                    <div class="d-flex align-items-start gap-2">
                        <div style="width:36px;height:36px;border-radius:8px;background:${t.color}15;color:${t.color};display:flex;align-items:center;justify-content:center;flex-shrink:0">
                            <i class="bi bi-${t.icon}"></i>
                        </div>
                        <div style="flex:1">
                            <div class="d-flex justify-content-between align-items-center">
                                <div class="fw-semibold" style="font-size:0.85rem">${t.label}</div>
                                ${estadoBadge}
                            </div>
                            ${extraInfo}
                            <div class="d-flex justify-content-between mt-1" style="font-size:0.7rem;color:var(--text-secondary)">
                                <span>${doc.fecha_inicio ? CONFIG.formatDate(doc.fecha_inicio) : '—'} — ${doc.fecha_vencimiento ? CONFIG.formatDate(doc.fecha_vencimiento) : '—'}</span>
                            </div>
                            ${diasTexto ? `<div style="font-size:0.7rem;color:${barraColor};font-weight:600;margin-top:2px">${diasTexto}</div>` : ''}
                            ${barraHtml}
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');

        return `
            <div class="card-ettur fade-in" style="animation-delay:0.1s">
                <div class="card-head"><h3><i class="bi bi-folder2-open"></i> Mis Documentos</h3></div>
                <div class="card-body-inner">${cards}</div>
            </div>`;
    },

    async renderYapeConfig() {
        let yapeNumero = '';
        let yapeNombre = '';
        const res = await API.getConfig();
        if (res.success) {
            yapeNumero = res.data.yape_numero || '';
            yapeNombre = res.data.yape_nombre || '';
        }

        return `
            <div class="card-ettur fade-in" style="animation-delay:0.2s">
                <div class="card-head"><h3><i class="bi bi-phone-fill text-success"></i> Configuración de Yape</h3></div>
                <div class="card-body-inner">
                    <p style="font-size:0.8rem;color:var(--text-secondary)">
                        Estos datos se mostrarán a los trabajadores al pagar por Yape.
                    </p>
                    <div class="mb-3">
                        <label class="form-label" style="font-size:0.8rem">Nombre del titular</label>
                        <input type="text" class="form-control" id="cfg-yape-nombre" value="${yapeNombre}" placeholder="Ej: Juan Pérez">
                    </div>
                    <div class="mb-3">
                        <label class="form-label" style="font-size:0.8rem">Número de Yape</label>
                        <input type="text" class="form-control" id="cfg-yape-numero" value="${yapeNumero}" placeholder="Ej: 999888777" maxlength="15">
                    </div>
                    <button class="btn btn-success-ettur btn-ettur w-100" onclick="PagePerfil.guardarYape()">
                        <i class="bi bi-check-lg"></i> Guardar Yape
                    </button>
                </div>
            </div>`;
    },

    async guardarYape() {
        const res = await API.updateConfig({
            yape_nombre: document.getElementById('cfg-yape-nombre').value.trim(),
            yape_numero: document.getElementById('cfg-yape-numero').value.trim()
        });
        UI.toast(res.success ? 'Yape guardado' : res.message, res.success ? 'success' : 'error');
    },

    saveApiUrl() {
        const url = document.getElementById('cfg-api-url').value.trim().replace(/\/+$/, '');
        if (url) { localStorage.setItem('ettur_api_url', url); CONFIG.API_BASE = url; UI.toast('URL guardada', 'success'); }
    }
};
