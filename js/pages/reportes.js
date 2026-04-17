/**
 * ETTUR - Página de Reportes v2.0
 */
const PageReportes = {
    async render() {
        const main = document.getElementById('app-main');

        const hoy = new Date();
        const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
        const ultimoDia = hoy.toISOString().split('T')[0];

        main.innerHTML = `
            <div class="page-title"><i class="bi bi-bar-chart-line-fill"></i> Reportes</div>

            <div class="card-ettur fade-in">
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
                    <button class="btn btn-primary-ettur btn-ettur w-100 mt-3" onclick="PageReportes.loadReport()">
                        <i class="bi bi-search"></i> Generar Reporte
                    </button>
                </div>
            </div>

            <div id="report-results"></div>`;

        this.loadReport();
    },

    async loadReport() {
        const desde = document.getElementById('rep-desde').value;
        const hasta = document.getElementById('rep-hasta').value;
        const container = document.getElementById('report-results');
        container.innerHTML = '<div class="loading-center"><div class="spinner-ettur"></div></div>';

        const res = await API.getLiquidacion(desde, hasta);

        if (!res.success) {
            container.innerHTML = `<div class="alert alert-danger">${res.message}</div>`;
            return;
        }

        const d = res.data;

        let html = `
            <div class="row g-3 mb-3 fade-in">
                <div class="col-6">
                    <div class="stat-card">
                        <div class="stat-icon green"><i class="bi bi-check-circle"></i></div>
                        <div class="stat-info">
                            <div class="stat-value">${CONFIG.formatMoney(d.totales.recaudado)}</div>
                            <div class="stat-label">Total Recaudado</div>
                        </div>
                    </div>
                </div>
                <div class="col-6">
                    <div class="stat-card">
                        <div class="stat-icon orange"><i class="bi bi-hourglass-split"></i></div>
                        <div class="stat-info">
                            <div class="stat-value">${CONFIG.formatMoney(d.totales.pendiente)}</div>
                            <div class="stat-label">Pendiente</div>
                        </div>
                    </div>
                </div>
            </div>`;

        if (d.por_metodo.length > 0) {
            html += `
                <div class="card-ettur fade-in mb-3">
                    <div class="card-head"><h3>Por Método de Pago</h3></div>
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
                    <div class="card-head">
                        <h3>Liquidación por Trabajador</h3>
                        <button class="btn btn-sm btn-outline-ettur btn-sm-ettur" onclick="PageReportes.exportar()">
                            <i class="bi bi-download"></i> Exportar
                        </button>
                    </div>
                    <div class="card-body-inner">
                        <div class="table-responsive">
                            <table class="table table-ettur table-hover mb-0">
                                <thead>
                                    <tr>
                                        <th>Trabajador</th>
                                        <th class="text-center">Aprobados</th>
                                        <th class="text-end">Total</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${d.trabajadores.map(t => `
                                    <tr>
                                        <td>
                                            <div class="fw-semibold">${t.nombre}</div>
                                            <small class="text-muted">${t.dni}</small>
                                        </td>
                                        <td class="text-center">
                                            <span class="badge bg-success">${t.pagos_aprobados}</span>
                                            ${t.pagos_pendientes > 0 ? `<span class="badge bg-warning text-dark">${t.pagos_pendientes}</span>` : ''}
                                        </td>
                                        <td class="text-end fw-bold">${CONFIG.formatMoney(t.total_aprobado)}</td>
                                        <td>
                                            <button class="btn btn-sm btn-outline-primary" onclick="PageReportes.verTrabajador(${t.id})" title="Ver detalle">
                                                <i class="bi bi-eye"></i>
                                            </button>
                                        </td>
                                    </tr>`).join('')}
                                </tbody>
                                <tfoot>
                                    <tr class="fw-bold">
                                        <td>TOTAL</td>
                                        <td></td>
                                        <td class="text-end">${CONFIG.formatMoney(d.totales.recaudado)}</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>`;
        } else {
            html += UI.emptyState('bar-chart-line', 'Sin datos', 'No se encontraron registros en el periodo seleccionado.');
        }

        container.innerHTML = html;
    },

    async verTrabajador(id) {
        const res = await API.getLiquidacionTrabajador(id);
        if (!res.success) {
            UI.toast(res.message, 'error');
            return;
        }

        const d = res.data;
        const t = d.trabajador;

        let pagosHtml = '';
        if (d.pagos.length > 0) {
            pagosHtml = `
                <div class="scroll-area">
                    <table class="table table-sm table-ettur mb-0">
                        <thead>
                            <tr><th>Periodo</th><th>Estado</th><th class="text-end">Monto</th></tr>
                        </thead>
                        <tbody>
                            ${d.pagos.map(p => {
                                const periodoTexto = (p.periodo_inicio || p.fecha_inicio)
                                    ? CONFIG.periodLabelShort({
                                        fecha_inicio: p.periodo_inicio || p.fecha_inicio,
                                        fecha_fin: p.periodo_fin || p.fecha_fin
                                      })
                                    : CONFIG.periodLabelShort(p);
                                return `
                                <tr>
                                    <td>${periodoTexto}</td>
                                    <td>${UI.badgeEstado(p.estado)}</td>
                                    <td class="text-end">${CONFIG.formatMoney(p.monto_pagado)}</td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>`;
        } else {
            pagosHtml = '<p class="text-muted text-center py-3">Sin pagos registrados</p>';
        }

        const body = `
            <div class="mb-3">
                <strong class="fs-5">${t.nombres} ${t.apellidos}</strong><br>
                <small class="text-muted">DNI: ${t.dni} · Tel: ${t.telefono || '—'}</small><br>
                <small class="text-muted">Inicio cobro: ${CONFIG.formatDate(t.fecha_inicio_cobro)}</small>
            </div>
            <div class="d-flex gap-3 mb-3">
                <div class="stat-card flex-fill">
                    <div class="stat-info text-center">
                        <div class="stat-value text-success">${CONFIG.formatMoney(d.resumen.total_pagado)}</div>
                        <div class="stat-label">Total Pagado</div>
                    </div>
                </div>
            </div>
            <h6>Historial de Pagos</h6>
            ${pagosHtml}`;

        UI.modal(`Liquidación - ${t.nombres}`, body, '<button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cerrar</button>');
    },

    exportar() {
        UI.toast('Funcionalidad de exportación disponible próximamente', 'info');
    }
};
