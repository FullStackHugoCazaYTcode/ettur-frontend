/**
 * ETTUR - Validar Pagos v3.0
 * Agrupado por trabajador, con buscador y filtros
 */
const PageValidar = {
    _pagos: [],
    _busqueda: '',

    async render() {
        const main = document.getElementById('app-main');
        UI.loading();

        const res = await API.getPagosPendientes();
        if (!res.success) { main.innerHTML = `<div class="alert alert-danger">${res.message}</div>`; return; }

        this._pagos = res.data || [];

        main.innerHTML = `
            <div class="page-title"><i class="bi bi-clipboard-check"></i> Validar Pagos</div>

            <div class="card-ettur fade-in mb-3">
                <div class="card-body-inner py-2">
                    <div class="input-group input-group-sm">
                        <span class="input-group-text"><i class="bi bi-search"></i></span>
                        <input type="text" class="form-control" id="validar-search" placeholder="Buscar trabajador, DNI o placa..." oninput="PageValidar.filtrar()">
                    </div>
                </div>
            </div>

            <div id="validar-resumen" class="mb-3"></div>
            <div id="validar-list"></div>`;

        this.renderContent();
    },

    filtrar() {
        this._busqueda = (document.getElementById('validar-search')?.value || '').toLowerCase();
        this.renderContent();
    },

    renderContent() {
        let pagos = this._pagos;

        // Filtrar por búsqueda
        if (this._busqueda) {
            const q = this._busqueda;
            pagos = pagos.filter(p =>
                (p.trabajador_nombre || '').toLowerCase().includes(q) ||
                (p.trabajador_dni || '').includes(q) ||
                (p.trabajador_placa || '').toLowerCase().includes(q)
            );
        }

        // Resumen
        const resumenEl = document.getElementById('validar-resumen');
        if (resumenEl) {
            const total = pagos.length;
            const totalMonto = pagos.reduce((s, p) => s + parseFloat(p.monto_pagado), 0);
            const historicos = pagos.filter(p => p.tipo_periodo === 'historico').length;
            const corrientes = pagos.filter(p => p.tipo_periodo !== 'historico').length;

            resumenEl.innerHTML = total > 0 ? `
                <div class="row g-2 fade-in">
                    <div class="col-4">
                        <div class="stat-card py-2"><div class="stat-info text-center" style="width:100%">
                            <div class="stat-value text-warning" style="font-size:1.1rem">${total}</div>
                            <div class="stat-label" style="font-size:0.65rem">Por Validar</div>
                        </div></div>
                    </div>
                    <div class="col-4">
                        <div class="stat-card py-2"><div class="stat-info text-center" style="width:100%">
                            <div class="stat-value text-primary" style="font-size:1.1rem">${CONFIG.formatMoney(totalMonto)}</div>
                            <div class="stat-label" style="font-size:0.65rem">Monto Total</div>
                        </div></div>
                    </div>
                    <div class="col-4">
                        <div class="stat-card py-2"><div class="stat-info text-center" style="width:100%">
                            <div class="stat-value" style="font-size:0.8rem">${corrientes} <small class="text-primary">Corr</small> · ${historicos} <small class="text-secondary">Hist</small></div>
                            <div class="stat-label" style="font-size:0.65rem">Tipo</div>
                        </div></div>
                    </div>
                </div>` : '';
        }

        // Agrupar por trabajador
        const grupos = {};
        pagos.forEach(p => {
            const tid = p.trabajador_id;
            if (!grupos[tid]) {
                grupos[tid] = {
                    id: tid,
                    nombre: p.trabajador_nombre,
                    dni: p.trabajador_dni,
                    placa: p.trabajador_placa,
                    tipo: p.tipo_trabajador,
                    pagos: []
                };
            }
            grupos[tid].pagos.push(p);
        });

        const listEl = document.getElementById('validar-list');
        if (!listEl) return;

        const trabajadores = Object.values(grupos);

        if (trabajadores.length === 0) {
            listEl.innerHTML = `
                <div class="card-ettur fade-in">
                    <div class="card-body-inner text-center py-4">
                        <i class="bi bi-check-circle-fill text-success" style="font-size:2.5rem"></i>
                        <p class="mt-2 mb-0 fw-semibold">No hay pagos pendientes de validación</p>
                        <small class="text-muted">${this._busqueda ? 'No se encontraron resultados para la búsqueda' : 'Todos los pagos han sido procesados'}</small>
                    </div>
                </div>`;
            return;
        }

        listEl.innerHTML = trabajadores.map(t => {
            const tipoLabel = CONFIG.tipoTrabajadorBadge(t.tipo || 'normal');
            const totalTrab = t.pagos.reduce((s, p) => s + parseFloat(p.monto_pagado), 0);

            const pagosHtml = t.pagos.map(p => {
                const esHist = p.tipo_periodo === 'historico';
                const fechaPago = CONFIG.formatDateTime(p.fecha_pago);

                return `
                <div class="p-2 mb-2 rounded" style="background:var(--border-light)">
                    <div class="d-flex justify-content-between align-items-start mb-1">
                        <div>
                            <div class="fw-semibold" style="font-size:0.85rem">
                                ${CONFIG.periodLabelShort(p)}
                                ${esHist ? '<span class="badge bg-secondary" style="font-size:0.55rem;margin-left:4px">HISTÓRICO</span>' : '<span class="badge bg-primary" style="font-size:0.55rem;margin-left:4px">CORRIENTE</span>'}
                            </div>
                            <div style="font-size:0.7rem;color:var(--text-secondary)">
                                ${UI.metodoPagoIcon(p.metodo_pago)} · Tarifa ${p.tipo_tarifa} · ${p.frecuencia === 'mensual' ? 'Mensual' : 'Semanal'}
                            </div>
                            <div style="font-size:0.65rem;color:var(--text-secondary)">
                                <i class="bi bi-clock"></i> Enviado: ${fechaPago}
                            </div>
                            ${p.observaciones ? `<div style="font-size:0.7rem;margin-top:2px"><i class="bi bi-chat-left-text"></i> ${p.observaciones}</div>` : ''}
                        </div>
                        <div class="text-end">
                            <div class="fw-bold text-primary">${CONFIG.formatMoney(p.monto_pagado)}</div>
                        </div>
                    </div>

                    ${p.comprobante_url ? `
                    <div class="text-center my-2">
                        <img src="${API.getComprobanteUrl(p.comprobante_url)}" class="img-fluid rounded" 
                             style="max-height:200px;cursor:pointer;border:2px solid #e2e8f0" 
                             onclick="UI.showImage('${API.getComprobanteUrl(p.comprobante_url)}')" alt="Comprobante">
                    </div>` : '<div class="text-muted text-center py-2" style="font-size:0.75rem"><i class="bi bi-image"></i> Sin comprobante</div>'}

                    <div class="d-flex gap-2">
                        <button class="btn btn-success btn-sm flex-fill" onclick="PageValidar.aprobar(${p.id})">
                            <i class="bi bi-check-lg"></i> Aprobar
                        </button>
                        <button class="btn btn-danger btn-sm flex-fill" onclick="PageValidar.rechazar(${p.id})">
                            <i class="bi bi-x-lg"></i> Rechazar
                        </button>
                    </div>
                </div>`;
            }).join('');

            return `
            <div class="card-ettur fade-in mb-3">
                <div class="card-head" style="cursor:pointer" onclick="PageValidar.toggleTrabajador(${t.id})">
                    <div class="d-flex align-items-center gap-2">
                        <div class="user-avatar-sm trabajador" style="font-size:0.7rem;width:32px;height:32px">${t.nombre.split(' ').map(n => n[0]).join('').substring(0, 2)}</div>
                        <div>
                            <h3 class="mb-0" style="font-size:0.9rem">${t.nombre}</h3>
                            <div style="font-size:0.7rem;color:var(--text-secondary)">
                                DNI: ${t.dni} · 🚗 ${t.placa || '—'} · ${tipoLabel}
                            </div>
                        </div>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <div class="text-end">
                            <span class="badge bg-warning text-dark">${t.pagos.length} pago(s)</span>
                            <div class="fw-bold text-primary" style="font-size:0.85rem">${CONFIG.formatMoney(totalTrab)}</div>
                        </div>
                        <i class="bi bi-chevron-down" id="chevron-${t.id}" style="transition:transform 0.3s"></i>
                    </div>
                </div>
                <div class="card-body-inner" id="pagos-trab-${t.id}" style="display:none">
                    ${pagosHtml}
                </div>
            </div>`;
        }).join('');
    },

    toggleTrabajador(id) {
        const panel = document.getElementById('pagos-trab-' + id);
        const chevron = document.getElementById('chevron-' + id);
        if (panel) {
            const isOpen = panel.style.display !== 'none';
            panel.style.display = isOpen ? 'none' : '';
            if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
        }
    },

    aprobar(pagoId) {
        UI.confirm('Aprobar Pago', '¿Confirma la aprobación de este pago?',
            async () => {
                const res = await API.validarPago(pagoId, 'aprobar');
                if (res.success) { UI.toast('Pago aprobado', 'success'); this.render(); }
                else { UI.toast(res.message, 'error'); }
            }, 'Aprobar', 'success');
    },

    rechazar(pagoId) {
        const body = `
            <div class="form-section">
                <label>Motivo del rechazo</label>
                <textarea class="form-control" id="motivo-rechazo" rows="3" placeholder="Ej: Comprobante ilegible, monto incorrecto..."></textarea>
            </div>`;
        const footer = `
            <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button class="btn btn-danger" id="btn-confirmar-rechazo">Rechazar Pago</button>`;
        const modal = UI.modal('Rechazar Pago', body, footer);

        document.getElementById('btn-confirmar-rechazo').onclick = async () => {
            const motivo = document.getElementById('motivo-rechazo').value.trim();
            modal.hide();
            const res = await API.validarPago(pagoId, 'rechazar', motivo);
            if (res.success) { UI.toast('Pago rechazado', 'success'); this.render(); }
            else { UI.toast(res.message, 'error'); }
        };
    }
};
