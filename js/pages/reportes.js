/**
 * ETTUR - Reportes v3.0
 * Meta mensual, barras de progreso, deudas por trabajador
 */
const PageReportes = {
    async render() {
        const main = document.getElementById('app-main');
        const hoy = new Date();

        main.innerHTML = `
            <div class="page-title"><i class="bi bi-bar-chart-line-fill"></i> Reportes</div>

            <!-- Tabs -->
            <div class="d-flex gap-2 mb-3 flex-wrap">
                <button class="btn btn-primary-ettur btn-ettur btn-sm-ettur active" id="tab-meta" onclick="PageReportes.showTab('meta')">
                    <i class="bi bi-bullseye"></i> Meta del Mes
                </button>
                <button class="btn btn-outline-ettur btn-sm-ettur" id="tab-deudas" onclick="PageReportes.showTab('deudas')">
                    <i class="bi bi-exclamation-triangle"></i> Deudas
                </button>
                <button class="btn btn-outline-ettur btn-sm-ettur" id="tab-liquidacion" onclick="PageReportes.showTab('liquidacion')">
                    <i class="bi bi-cash-stack"></i> Liquidación
                </button>
            </div>

            <div id="tab-content"></div>`;

        this.showTab('meta');
    },

    showTab(tab) {
        // Update tab styles
        ['meta', 'deudas', 'liquidacion'].forEach(t => {
            const btn = document.getElementById('tab-' + t);
            if (btn) {
                btn.className = t === tab
                    ? 'btn btn-primary-ettur btn-ettur btn-sm-ettur active'
                    : 'btn btn-outline-ettur btn-sm-ettur';
            }
        });

        switch (tab) {
            case 'meta': this.renderMeta(); break;
            case 'deudas': this.renderDeudas(); break;
            case 'liquidacion': this.renderLiquidacion(); break;
        }
    },

    // ============= META MENSUAL =============
    async renderMeta() {
        const container = document.getElementById('tab-content');
        container.innerHTML = '<div class="loading-center"><div class="spinner-ettur"></div></div>';

        const hoy = new Date();
        const anio = hoy.getFullYear();
        const mes = hoy.getMonth() + 1;

        const res = await API.getMetaMensual(anio, mes);

        if (!res.success) {
            container.innerHTML = `<div class="alert alert-danger">${res.message}</div>`;
            return;
        }

        const d = res.data;
        const porcentaje = Math.min(d.porcentaje, 100);
        const colorBarra = porcentaje >= 80 ? '#22c55e' : porcentaje >= 50 ? '#f59e0b' : '#ef4444';

        let trabajadoresHtml = '';
        if (d.trabajadores.length > 0) {
            trabajadoresHtml = d.trabajadores.map(t => {
                const pct = Math.min(t.porcentaje, 100);
                const color = pct >= 100 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
                const tipoLabel = CONFIG.tipoTrabajadorBadge(t.tipo_trabajador);
                return `
                <div class="payment-item">
                    <div class="user-avatar-sm trabajador" style="font-size:0.7rem">${t.nombre.split(' ').map(n=>n[0]).join('').substring(0,2)}</div>
                    <div class="payment-info" style="flex:1">
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="payment-period">${t.nombre}</div>
                            <small class="fw-bold">${pct}%</small>
                        </div>
                        <div class="d-flex align-items-center gap-2 mt-1">
                            <div style="flex:1;height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden">
                                <div style="width:${pct}%;height:100%;background:${color};border-radius:3px;transition:width 0.5s"></div>
                            </div>
                        </div>
                        <div class="d-flex justify-content-between mt-1" style="font-size:0.7rem">
                            <span class="text-muted">🚗 ${t.placa || '—'} ${tipoLabel}</span>
                            <span><span class="text-success">${CONFIG.formatMoney(t.pagado)}</span> / ${CONFIG.formatMoney(t.meta)}</span>
                        </div>
                    </div>
                </div>`;
            }).join('');
        }

        container.innerHTML = `
            <div class="card-ettur fade-in mb-3">
                <div class="card-body-inner pt-3">
                    <div class="text-center mb-3">
                        <div class="text-muted" style="font-size:0.8rem">Meta de Recaudación</div>
                        <h3 class="mb-0">${d.mes_nombre} ${d.anio}</h3>
                    </div>

                    <!-- Barra principal -->
                    <div class="p-3 rounded mb-3" style="background:var(--border-light)">
                        <div class="d-flex justify-content-between mb-2">
                            <span style="font-size:0.8rem" class="fw-semibold">Recaudado</span>
                            <span class="fw-bold" style="font-size:1.1rem;color:${colorBarra}">${porcentaje}%</span>
                        </div>
                        <div style="height:12px;background:#e2e8f0;border-radius:6px;overflow:hidden;margin-bottom:0.75rem">
                            <div style="width:${porcentaje}%;height:100%;background:${colorBarra};border-radius:6px;transition:width 0.8s"></div>
                        </div>
                        <div class="row text-center g-2">
                            <div class="col-4">
                                <div class="fw-bold text-success">${CONFIG.formatMoney(d.recaudado_total)}</div>
                                <div style="font-size:0.7rem" class="text-muted">Recaudado</div>
                            </div>
                            <div class="col-4">
                                <div class="fw-bold text-danger">${CONFIG.formatMoney(d.pendiente_total)}</div>
                                <div style="font-size:0.7rem" class="text-muted">Pendiente</div>
                            </div>
                            <div class="col-4">
                                <div class="fw-bold text-primary">${CONFIG.formatMoney(d.meta_total)}</div>
                                <div style="font-size:0.7rem" class="text-muted">Meta Total</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card-ettur fade-in">
                <div class="card-head">
                    <h3>Progreso por Trabajador</h3>
                    <span class="badge bg-secondary">${d.trabajadores.length}</span>
                </div>
                <div class="card-body-inner">
                    ${trabajadoresHtml || '<p class="text-center text-muted py-3">Sin trabajadores activos</p>'}
                </div>
            </div>`;
    },

    // ============= DEUDAS =============
    async renderDeudas() {
        const container = document.getElementById('tab-content');
        container.innerHTML = '<div class="loading-center"><div class="spinner-ettur"></div></div>';

        const res = await API.getDeudas();

        if (!res.success) {
            container.innerHTML = `<div class="alert alert-danger">${res.message}</div>`;
            return;
        }

        const d = res.data;
        const totales = d.totales;

        let trabajadoresHtml = '';
        if (d.trabajadores.length > 0) {
            trabajadoresHtml = d.trabajadores.map(t => {
                const tieneDeuda = t.deuda_total > 0;
                return `
                <div class="card-ettur mb-2" style="${!tieneDeuda ? 'opacity:0.6' : ''}">
                    <div class="card-body-inner py-3">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <div class="fw-bold">${t.nombre}</div>
                                <small class="text-muted">DNI: ${t.dni} · 🚗 ${t.placa || '—'} · ${CONFIG.tipoTrabajadorBadge(t.tipo_trabajador)}</small>
                            </div>
                            <div class="text-end">
                                <div class="fw-bold fs-5 ${tieneDeuda ? 'text-danger' : 'text-success'}">${CONFIG.formatMoney(t.deuda_total)}</div>
                                ${t.pagos_por_validar > 0 ? `<span class="badge bg-warning text-dark" style="font-size:0.6rem">${t.pagos_por_validar} por validar</span>` : ''}
                            </div>
                        </div>
                        ${tieneDeuda ? `
                        <div class="d-flex gap-3" style="font-size:0.8rem">
                            <div>
                                <i class="bi bi-lightning-charge text-primary"></i> Corriente: <strong>${CONFIG.formatMoney(t.deuda_corriente)}</strong>
                                <small class="text-muted">(${t.periodos_corriente} sem.)</small>
                            </div>
                            ${t.deuda_historica > 0 ? `
                            <div>
                                <i class="bi bi-clock-history text-secondary"></i> Histórica: <strong>${CONFIG.formatMoney(t.deuda_historica)}</strong>
                                <small class="text-muted">(${t.periodos_historico} sem.)</small>
                            </div>` : ''}
                        </div>` : `
                        <div style="font-size:0.8rem" class="text-success"><i class="bi bi-check-circle"></i> Al día</div>`}
                    </div>
                </div>`;
            }).join('');
        }

        container.innerHTML = `
            <div class="row g-3 mb-3 fade-in">
                <div class="col-4">
                    <div class="stat-card">
                        <div class="stat-info text-center" style="width:100%">
                            <div class="stat-value text-danger">${CONFIG.formatMoney(totales.deuda_total)}</div>
                            <div class="stat-label">Deuda Total</div>
                        </div>
                    </div>
                </div>
                <div class="col-4">
                    <div class="stat-card">
                        <div class="stat-info text-center" style="width:100%">
                            <div class="stat-value text-primary">${CONFIG.formatMoney(totales.deuda_corriente)}</div>
                            <div class="stat-label">Corriente</div>
                        </div>
                    </div>
                </div>
                <div class="col-4">
                    <div class="stat-card">
                        <div class="stat-info text-center" style="width:100%">
                            <div class="stat-value text-secondary">${CONFIG.formatMoney(totales.deuda_historica)}</div>
                            <div class="stat-label">Histórica</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="fade-in">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="mb-0">Deuda por Trabajador</h6>
                    <span class="badge bg-secondary">${totales.total_trabajadores} trabajadores</span>
                </div>
                ${trabajadoresHtml || '<p class="text-center text-muted py-3">Sin trabajadores</p>'}
            </div>`;
    },

    // ============= LIQUIDACIÓN =============
    async renderLiquidacion() {
        const container = document.getElementById('tab-content');
        const hoy = new Date();
        const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
        const ultimoDia = hoy.toISOString().split('T')[0];

        container.innerHTML = `
            <div class="card-ettur fade-in mb-3">
                <div class="card-head"><h3>Filtros</h3></div>
                <div class="card-body-inner">
                    <div class="row g-2">
                        <div class="col-6">
                            <label class="form-label" style="font-size:0.8rem">Desde</label>
                            <input type="date" class="form-control" id="rep-desde" value="${primerDia}">
                        </div>
                        <div class="col-6">
                            <label class="form-label" style="font-size:0.8rem">Hasta</label>
                            <input type="date" class="form-control" id="rep-hasta" value="${ultimoDia}">
                        </div>
                    </div>
                    <button class="btn btn-primary-ettur btn-ettur w-100 mt-3" onclick="PageReportes.loadLiquidacion()">
                        <i class="bi bi-search"></i> Generar Reporte
                    </button>
                </div>
            </div>
            <div id="liquidacion-results"></div>`;

        this.loadLiquidacion();
    },

    async loadLiquidacion() {
        const desde = document.getElementById('rep-desde').value;
        const hasta = document.getElementById('rep-hasta').value;
        const container = document.getElementById('liquidacion-results');
        container.innerHTML = '<div class="loading-center"><div class="spinner-ettur"></div></div>';

        const res = await API.getLiquidacion(desde, hasta);
        if (!res.success) { container.innerHTML = `<div class="alert alert-danger">${res.message}</div>`; return; }

        const d = res.data;

        let html = `
            <div class="row g-3 mb-3 fade-in">
                <div class="col-6">
                    <div class="stat-card">
                        <div class="stat-icon green"><i class="bi bi-check-circle"></i></div>
                        <div class="stat-info">
                            <div class="stat-value">${CONFIG.formatMoney(d.totales.recaudado)}</div>
                            <div class="stat-label">Recaudado</div>
                        </div>
                    </div>
                </div>
                <div class="col-6">
                    <div class="stat-card">
                        <div class="stat-icon orange"><i class="bi bi-hourglass-split"></i></div>
                        <div class="stat-info">
                            <div class="stat-value">${CONFIG.formatMoney(d.totales.pendiente)}</div>
                            <div class="stat-label">Por Validar</div>
                        </div>
                    </div>
                </div>
            </div>`;

        if (d.por_metodo && d.por_metodo.length > 0) {
            html += `
                <div class="card-ettur fade-in mb-3">
                    <div class="card-head"><h3>Por Método</h3></div>
                    <div class="card-body-inner">
                        ${d.por_metodo.map(m => `
                            <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                                <span>${UI.metodoPagoIcon(m.metodo_pago)}</span>
                                <span><strong>${m.cantidad}</strong> pagos</span>
                                <span class="fw-bold">${CONFIG.formatMoney(m.total)}</span>
                            </div>`).join('')}
                    </div>
                </div>`;
        }

        if (d.trabajadores.length > 0) {
            html += `
                <div class="card-ettur fade-in">
                    <div class="card-head"><h3>Por Trabajador</h3></div>
                    <div class="card-body-inner">
                        <div class="table-responsive">
                            <table class="table table-ettur table-hover mb-0">
                                <thead><tr><th>Trabajador</th><th class="text-center">Pagos</th><th class="text-end">Total</th><th></th></tr></thead>
                                <tbody>
                                    ${d.trabajadores.map(t => `
                                    <tr>
                                        <td><div class="fw-semibold">${t.nombre}</div><small class="text-muted">${t.dni}</small></td>
                                        <td class="text-center">
                                            <span class="badge bg-success">${t.pagos_aprobados}</span>
                                            ${t.pagos_pendientes > 0 ? `<span class="badge bg-warning text-dark">${t.pagos_pendientes}</span>` : ''}
                                        </td>
                                        <td class="text-end fw-bold">${CONFIG.formatMoney(t.total_aprobado)}</td>
                                        <td><button class="btn btn-sm btn-outline-primary" onclick="PageReportes.verTrabajador(${t.id})"><i class="bi bi-eye"></i></button></td>
                                    </tr>`).join('')}
                                </tbody>
                                <tfoot><tr class="fw-bold"><td>TOTAL</td><td></td><td class="text-end">${CONFIG.formatMoney(d.totales.recaudado)}</td><td></td></tr></tfoot>
                            </table>
                        </div>
                    </div>
                </div>`;
        } else {
            html += '<div class="text-center text-muted py-4">Sin registros en este periodo</div>';
        }

        container.innerHTML = html;
    },

    async verTrabajador(id) {
        const res = await API.getLiquidacionTrabajador(id);
        if (!res.success) { UI.toast(res.message, 'error'); return; }
        const d = res.data;
        const t = d.trabajador;

        let pagosHtml = '';
        if (d.pagos.length > 0) {
            pagosHtml = `
                <div class="scroll-area">
                    <table class="table table-sm table-ettur mb-0">
                        <thead><tr><th>Periodo</th><th>Tipo</th><th>Estado</th><th class="text-end">Monto</th></tr></thead>
                        <tbody>
                            ${d.pagos.map(p => {
                                const esHist = p.tipo_periodo === 'historico';
                                return `
                                <tr>
                                    <td>${CONFIG.periodLabelShort(p)}</td>
                                    <td>${esHist ? '<span class="badge bg-secondary" style="font-size:0.6rem">HIST</span>' : '<span class="badge bg-primary" style="font-size:0.6rem">CORR</span>'}</td>
                                    <td>${UI.badgeEstado(p.estado)}</td>
                                    <td class="text-end">${CONFIG.formatMoney(p.monto_pagado)}</td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>`;
        } else {
            pagosHtml = '<p class="text-muted text-center py-3">Sin pagos</p>';
        }

        const body = `
            <div class="mb-3">
                <strong class="fs-5">${t.nombres} ${t.apellidos}</strong><br>
                <small class="text-muted">DNI: ${t.dni} · 🚗 ${t.placa || '—'} · ${CONFIG.tipoTrabajadorBadge(t.tipo_trabajador || 'normal')}</small><br>
                <small class="text-muted">Inicio deuda: ${CONFIG.formatDate(t.fecha_inicio_cobro)} · Lanzamiento: ${CONFIG.formatDate(t.fecha_lanzamiento)}</small>
            </div>
            <div class="stat-card mb-3">
                <div class="stat-info text-center" style="width:100%">
                    <div class="stat-value text-success">${CONFIG.formatMoney(d.resumen.total_pagado)}</div>
                    <div class="stat-label">Total Pagado (Aprobado)</div>
                </div>
            </div>
            <h6>Historial de Pagos</h6>
            ${pagosHtml}`;

        UI.modal(`${t.nombres} ${t.apellidos}`, body, '<button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cerrar</button>');
    }
};
