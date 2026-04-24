/**
 * ETTUR - Dashboard v2.2
 * Semana actual visible + temporadas editables
 */
const PageDashboard = {
    async render() {
        const main = document.getElementById('app-main');
        UI.loading();
        if (Auth.isTrabajador()) { await this.renderTrabajador(main); }
        else { await this.renderAdmin(main); }
    },

    async renderTrabajador(main) {
        const res = await API.getPeriodosPendientes();
        let deudaHTML = '';
        let periodosHTML = '';
        let accionesHTML = '';

        if (res.success) {
            const data = res.data;

            deudaHTML = `
                <div class="debt-banner fade-in">
                    <div class="debt-label">Mi deuda total</div>
                    <div class="debt-amount">
                        <span class="currency">S/</span> ${parseFloat(data.total_deuda).toFixed(2)}
                    </div>
                    <div class="debt-periods">
                        <i class="bi bi-calendar3"></i> ${data.total_periodos_pendientes} periodo(s) pendiente(s)
                    </div>
                </div>`;

            if (data.periodo_siguiente_pago) {
                const p = data.periodo_siguiente_pago;
                const frecLabel = p.frecuencia === 'mensual' ? 'Mensual' : 'Semanal';
                const esActual = p.es_semana_actual ? '<span class="badge bg-info ms-2" style="font-size:0.65rem">Semana Actual</span>' : '';
                accionesHTML = `
                    <div class="card-ettur fade-in" style="animation-delay:0.1s">
                        <div class="card-head">
                            <h3><i class="bi bi-arrow-right-circle text-warning"></i> Próximo Pago</h3>
                        </div>
                        <div class="card-body-inner">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <div class="fw-bold">${CONFIG.periodLabelShort(p)} ${esActual}</div>
                                    <small class="text-muted">Tarifa ${p.tipo_tarifa} · ${frecLabel}</small>
                                </div>
                                <div class="stat-value text-primary">${CONFIG.formatMoney(p.monto)}</div>
                            </div>
                            <button class="btn btn-accent btn-ettur w-100" onclick="App.navigate('pagar')">
                                <i class="bi bi-upload"></i> Subir Comprobante de Pago
                            </button>
                        </div>
                    </div>`;
            }

            if (data.periodos_pendientes.length > 0) {
                const items = data.periodos_pendientes.map(p => {
                    const esActual = p.es_semana_actual;
                    return `
                    <div class="payment-item" style="${esActual ? 'background:rgba(59,130,246,0.06);border-radius:8px;padding-left:0.5rem;padding-right:0.5rem' : ''}">
                        <div class="payment-dot pendiente"></div>
                        <div class="payment-info">
                            <div class="payment-period">
                                ${CONFIG.periodLabelShort(p)}
                                ${esActual ? '<span class="badge bg-info" style="font-size:0.6rem;margin-left:4px">ACTUAL</span>' : ''}
                            </div>
                            <div class="payment-meta">Tarifa ${p.tipo_tarifa} · ${p.frecuencia === 'mensual' ? 'Mensual' : 'Semanal'}</div>
                        </div>
                        <div class="payment-amount">${CONFIG.formatMoney(p.monto)}</div>
                    </div>`;
                }).join('');

                periodosHTML = `
                    <div class="card-ettur fade-in" style="animation-delay:0.2s">
                        <div class="card-head">
                            <h3>Periodos Pendientes</h3>
                        </div>
                        <div class="card-body-inner">${items}</div>
                    </div>`;
            }
        } else {
            deudaHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle"></i> ${res.message || 'No se pudo cargar la información'}
                </div>`;
        }

        main.innerHTML = `
            <div class="page-title"><i class="bi bi-house-fill"></i> ¡Hola, ${Auth.user.nombres}!</div>
            ${deudaHTML}
            ${accionesHTML}
            <div class="quick-actions fade-in" style="animation-delay:0.15s">
                <div class="quick-action" onclick="App.navigate('pagar')">
                    <i class="bi bi-cash-stack"></i>
                    <span>Subir Pago</span>
                </div>
                <div class="quick-action" onclick="App.navigate('mis-pagos')">
                    <i class="bi bi-receipt"></i>
                    <span>Mis Pagos</span>
                </div>
            </div>
            ${periodosHTML}`;
    },

    async renderAdmin(main) {
        const res = await API.getDashboard();
        if (!res.success) { main.innerHTML = `<div class="alert alert-danger">${res.message}</div>`; return; }
        const d = res.data;

        main.innerHTML = `
            <div class="page-title"><i class="bi bi-speedometer2"></i> Dashboard</div>
            <div class="row g-3 mb-3 fade-in">
                <div class="col-6">
                    <div class="stat-card">
                        <div class="stat-icon gold"><i class="bi bi-cash-stack"></i></div>
                        <div class="stat-info">
                            <div class="stat-value">${CONFIG.formatMoney(d.recaudado_mes)}</div>
                            <div class="stat-label">Recaudado este mes</div>
                        </div>
                    </div>
                </div>
                <div class="col-6">
                    <div class="stat-card">
                        <div class="stat-icon orange"><i class="bi bi-clock-history"></i></div>
                        <div class="stat-info">
                            <div class="stat-value">${d.pagos_pendientes}</div>
                            <div class="stat-label">Pagos por validar</div>
                        </div>
                    </div>
                </div>
                <div class="col-6">
                    <div class="stat-card">
                        <div class="stat-icon blue"><i class="bi bi-people-fill"></i></div>
                        <div class="stat-info">
                            <div class="stat-value">${d.trabajadores_activos}</div>
                            <div class="stat-label">Trabajadores activos</div>
                        </div>
                    </div>
                </div>
                <div class="col-6">
                    <div class="stat-card">
                        <div class="stat-icon green"><i class="bi bi-graph-up-arrow"></i></div>
                        <div class="stat-info">
                            <div class="stat-value">${CONFIG.formatMoney(d.recaudado_total)}</div>
                            <div class="stat-label">Total histórico</div>
                        </div>
                    </div>
                </div>
            </div>

            ${d.pagos_pendientes > 0 ? `
            <div class="card-ettur fade-in" style="animation-delay:0.1s">
                <div class="card-head">
                    <h3><i class="bi bi-exclamation-circle text-warning"></i> Pagos por Validar</h3>
                    <button class="btn btn-sm btn-primary-ettur btn-sm-ettur" onclick="App.navigate('validar')">Ver todos</button>
                </div>
            </div>` : ''}

            <div class="quick-actions fade-in" style="animation-delay:0.15s">
                <div class="quick-action" onclick="App.navigate('validar')">
                    <i class="bi bi-clipboard-check"></i>
                    <span>Validar Pagos</span>
                </div>
                <div class="quick-action" onclick="App.navigate('reportes')">
                    <i class="bi bi-bar-chart-line-fill"></i>
                    <span>Reportes</span>
                </div>
                ${Auth.isAdmin() ? `
                <div class="quick-action" onclick="App.navigate('usuarios')">
                    <i class="bi bi-people-fill"></i>
                    <span>Usuarios</span>
                </div>
                <div class="quick-action" onclick="App.navigate('tarifas')">
                    <i class="bi bi-tags-fill"></i>
                    <span>Tarifas</span>
                </div>` : ''}
            </div>

            <div class="card-ettur fade-in" style="animation-delay:0.2s">
                <div class="card-head"><h3>Últimos Pagos Registrados</h3></div>
                <div class="card-body-inner">
                    ${d.ultimos_pagos.length > 0 ? d.ultimos_pagos.map(p => `
                        <div class="payment-item">
                            <div class="payment-dot ${p.estado}"></div>
                            <div class="payment-info">
                                <div class="payment-period">${p.trabajador}</div>
                                <div class="payment-meta">${CONFIG.periodLabelShort(p)} · ${UI.metodoPagoIcon(p.metodo_pago)}</div>
                            </div>
                            <div class="payment-status">
                                ${UI.badgeEstado(p.estado)}
                                <div class="payment-amount">${CONFIG.formatMoney(p.monto_pagado)}</div>
                            </div>
                        </div>`).join('') : UI.emptyState('inbox', 'Sin pagos recientes')}
                </div>
            </div>`;
    }
};
