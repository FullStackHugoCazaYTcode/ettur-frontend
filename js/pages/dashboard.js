/**
 * ETTUR - Dashboard v3.0
 * Dos carriles: Corriente + Deuda Histórica
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

        if (!res.success) {
            main.innerHTML = `
                <div class="page-title"><i class="bi bi-house-fill"></i> ¡Hola, ${Auth.user.nombres}!</div>
                <div class="alert alert-warning"><i class="bi bi-exclamation-triangle"></i> ${res.message}</div>`;
            return;
        }

        const data = res.data;
        const corriente = data.corriente || { periodos_pendientes: [], total_deuda: 0, total_pendientes: 0, periodo_siguiente: null };
        const historico = data.historico || { periodos_pendientes: [], total_deuda: 0, total_pendientes: 0, periodo_siguiente: null };
        const deudaTotal = data.total_deuda || 0;

        // Banner deuda total
        let deudaHTML = `
            <div class="debt-banner fade-in">
                <div class="debt-label">Mi deuda total</div>
                <div class="debt-amount"><span class="currency">S/</span> ${parseFloat(deudaTotal).toFixed(2)}</div>
                <div class="debt-periods">
                    <i class="bi bi-calendar3"></i> ${corriente.total_pendientes + historico.total_pendientes} periodo(s) pendiente(s)
                    ${historico.total_pendientes > 0 ? ` · <span style="opacity:0.8">${historico.total_pendientes} histórico(s)</span>` : ''}
                </div>
            </div>`;

        // Carril 1: Pago corriente
        let corrienteHTML = '';
        if (corriente.periodo_siguiente) {
            const p = corriente.periodo_siguiente;
            const frecLabel = p.frecuencia === 'mensual' ? 'Mensual' : 'Semanal';
            const esActual = p.es_semana_actual ? '<span class="badge bg-info ms-2" style="font-size:0.65rem">Semana Actual</span>' : '';
            corrienteHTML = `
                <div class="card-ettur fade-in" style="animation-delay:0.1s">
                    <div class="card-head">
                        <h3><i class="bi bi-lightning-charge-fill text-warning"></i> Pago Corriente</h3>
                        <span class="badge bg-primary">${corriente.total_pendientes} pendiente(s)</span>
                    </div>
                    <div class="card-body-inner">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <div>
                                <div class="fw-bold">${CONFIG.periodLabelShort(p)} ${esActual}</div>
                                <small class="text-muted">Tarifa ${p.tipo_tarifa} · ${frecLabel}</small>
                            </div>
                            <div class="stat-value text-primary">${CONFIG.formatMoney(p.monto)}</div>
                        </div>
                        ${corriente.total_deuda > p.monto ? `<div class="text-muted mb-2" style="font-size:0.8rem">Deuda corriente total: <strong>${CONFIG.formatMoney(corriente.total_deuda)}</strong></div>` : ''}
                        <button class="btn btn-accent btn-ettur w-100" onclick="App.navigate('pagar')">
                            <i class="bi bi-upload"></i> Pagar Semana
                        </button>
                    </div>
                </div>`;
        } else {
            corrienteHTML = `
                <div class="card-ettur fade-in" style="animation-delay:0.1s">
                    <div class="card-head"><h3><i class="bi bi-lightning-charge-fill text-success"></i> Pagos Corrientes</h3></div>
                    <div class="card-body-inner text-center py-3">
                        <i class="bi bi-check-circle-fill text-success" style="font-size:2rem"></i>
                        <p class="mb-0 mt-2 fw-semibold">¡Estás al día con tus pagos!</p>
                    </div>
                </div>`;
        }

        // Carril 2: Deuda histórica
        let historicoHTML = '';
        if (historico.total_pendientes > 0) {
            const items = historico.periodos_pendientes.slice(0, 5).map((p, i) => {
                const esSiguiente = i === 0;
                return `
                <div class="payment-item" style="${esSiguiente ? 'background:rgba(232,168,56,0.06);border-radius:8px;padding-left:0.5rem;padding-right:0.5rem' : ''}">
                    <div class="payment-dot pendiente"></div>
                    <div class="payment-info">
                        <div class="payment-period">
                            ${CONFIG.periodLabelShort(p)}
                            ${esSiguiente ? '<span class="badge bg-warning text-dark" style="font-size:0.6rem;margin-left:4px">SIGUIENTE</span>' : ''}
                        </div>
                        <div class="payment-meta">Tarifa ${p.tipo_tarifa} · ${p.frecuencia === 'mensual' ? 'Mensual' : 'Semanal'}</div>
                    </div>
                    <div class="payment-amount">${CONFIG.formatMoney(p.monto)}</div>
                </div>`;
            }).join('');

            historicoHTML = `
                <div class="card-ettur fade-in" style="animation-delay:0.2s">
                    <div class="card-head">
                        <h3><i class="bi bi-clock-history text-secondary"></i> Deuda Histórica</h3>
                        <span class="badge bg-warning text-dark">${historico.total_pendientes} semana(s)</span>
                    </div>
                    <div class="card-body-inner">
                        <div class="d-flex justify-content-between align-items-center mb-3 p-2 rounded" style="background:var(--border-light)">
                            <div>
                                <div class="text-muted" style="font-size:0.75rem">Deuda histórica total</div>
                                <div class="fw-bold fs-5 text-danger">${CONFIG.formatMoney(historico.total_deuda)}</div>
                            </div>
                            <div class="text-end">
                                <div class="text-muted" style="font-size:0.75rem">Periodo</div>
                                <div style="font-size:0.8rem">${CONFIG.formatDate(data.fecha_inicio_cobro)} — ${CONFIG.formatDate(data.fecha_lanzamiento)}</div>
                            </div>
                        </div>
                        ${items}
                        ${historico.total_pendientes > 5 ? `<p class="text-center text-muted mt-2" style="font-size:0.8rem">...y ${historico.total_pendientes - 5} semana(s) más</p>` : ''}
                        <button class="btn btn-outline-ettur btn-ettur w-100 mt-2" onclick="App.navigate('pagar-historico')">
                            <i class="bi bi-cash-stack"></i> Abonar a Deuda Histórica
                        </button>
                    </div>
                </div>`;
        }

        // Periodos corrientes pendientes
        let periodosHTML = '';
        if (corriente.periodos_pendientes.length > 0) {
            const items = corriente.periodos_pendientes.map(p => {
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
                <div class="card-ettur fade-in" style="animation-delay:0.3s">
                    <div class="card-head"><h3>Semanas Corrientes Pendientes</h3></div>
                    <div class="card-body-inner">${items}</div>
                </div>`;
        }

        main.innerHTML = `
            <div class="page-title"><i class="bi bi-house-fill"></i> ¡Hola, ${Auth.user.nombres}!</div>
            ${deudaHTML}
            ${corrienteHTML}
            <div class="quick-actions fade-in" style="animation-delay:0.15s">
                <div class="quick-action" onclick="App.navigate('pagar')">
                    <i class="bi bi-cash-stack"></i>
                    <span>Pagar Semana</span>
                </div>
                <div class="quick-action" onclick="App.navigate('mis-pagos')">
                    <i class="bi bi-receipt"></i>
                    <span>Mis Pagos</span>
                </div>
            </div>
            ${historicoHTML}
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
                    <i class="bi bi-clipboard-check"></i><span>Validar Pagos</span>
                </div>
                <div class="quick-action" onclick="App.navigate('reportes')">
                    <i class="bi bi-bar-chart-line-fill"></i><span>Reportes</span>
                </div>
                ${Auth.isAdmin() ? `
                <div class="quick-action" onclick="App.navigate('usuarios')">
                    <i class="bi bi-people-fill"></i><span>Usuarios</span>
                </div>
                <div class="quick-action" onclick="App.navigate('tarifas')">
                    <i class="bi bi-tags-fill"></i><span>Tarifas</span>
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
