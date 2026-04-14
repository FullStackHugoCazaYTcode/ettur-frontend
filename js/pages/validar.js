/**
 * ETTUR - Página Validar Pagos
 * Para Admin y Coadmin
 */
const PageValidar = {
    async render() {
        const main = document.getElementById('app-main');
        UI.loading();

        const res = await API.getPagosPendientes();

        if (!res.success) {
            main.innerHTML = `<div class="alert alert-danger">${res.message}</div>`;
            return;
        }

        const pagos = res.data;

        let content = '';
        if (pagos.length > 0) {
            content = pagos.map(p => `
                <div class="card-ettur fade-in mb-3">
                    <div class="card-body-inner pt-3">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <div class="fw-bold">${p.trabajador_nombre}</div>
                                <small class="text-muted">DNI: ${p.trabajador_dni}</small>
                            </div>
                            ${UI.badgeEstado('pendiente')}
                        </div>
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span>${CONFIG.periodLabel(p.anio, p.mes, p.quincena)}</span>
                            <span class="fw-bold fs-5 text-primary">${CONFIG.formatMoney(p.monto_pagado)}</span>
                        </div>
                        <div class="d-flex gap-2 mb-3" style="font-size:0.8rem">
                            <span class="text-muted">${UI.metodoPagoIcon(p.metodo_pago)}</span>
                            <span class="text-muted"><i class="bi bi-calendar3"></i> ${CONFIG.formatDateTime(p.fecha_pago)}</span>
                        </div>

                        ${p.comprobante_url ? `
                        <div class="text-center mb-3">
                            <img src="${API.getComprobanteUrl(p.comprobante_url)}" 
                                 class="img-fluid rounded" style="max-height:250px;cursor:pointer;border:1px solid var(--border)"
                                 onclick="UI.showImage('${API.getComprobanteUrl(p.comprobante_url)}')" alt="Comprobante">
                        </div>` : '<p class="text-muted text-center"><i class="bi bi-image"></i> Sin comprobante adjunto</p>'}

                        ${p.observaciones ? `<div class="alert alert-light py-2 mb-3" style="font-size:0.8rem"><i class="bi bi-chat-text"></i> ${p.observaciones}</div>` : ''}

                        <div class="d-flex gap-2">
                            <button class="btn btn-success-ettur btn-ettur flex-fill" onclick="PageValidar.aprobar(${p.id}, '${p.trabajador_nombre}')">
                                <i class="bi bi-check-lg"></i> Aprobar
                            </button>
                            <button class="btn btn-danger-ettur btn-ettur flex-fill" onclick="PageValidar.rechazar(${p.id}, '${p.trabajador_nombre}')">
                                <i class="bi bi-x-lg"></i> Rechazar
                            </button>
                        </div>
                    </div>
                </div>`).join('');
        } else {
            content = UI.emptyState('clipboard-check', '¡Todo validado!', 'No hay pagos pendientes de aprobación.');
        }

        main.innerHTML = `
            <div class="page-title">
                <i class="bi bi-clipboard-check"></i> Validar Pagos
                ${pagos.length > 0 ? `<span class="badge bg-warning text-dark ms-2">${pagos.length}</span>` : ''}
            </div>
            ${content}`;
    },

    aprobar(pagoId, nombre) {
        UI.confirm(
            'Aprobar Pago',
            `¿Confirma la aprobación del pago de <strong>${nombre}</strong>?`,
            async () => {
                const res = await API.validarPago(pagoId, 'aprobar');
                if (res.success) {
                    UI.toast('Pago aprobado correctamente', 'success');
                    this.render();
                    UI.updateBadges();
                } else {
                    UI.toast(res.message, 'error');
                }
            },
            'Aprobar',
            'success'
        );
    },

    rechazar(pagoId, nombre) {
        const body = `
            <p>Rechazar pago de <strong>${nombre}</strong></p>
            <div class="form-section">
                <label>Motivo del rechazo</label>
                <textarea class="form-control" id="motivo-rechazo" rows="3" placeholder="Ej: Comprobante ilegible, monto no coincide..."></textarea>
            </div>`;

        const footer = `
            <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button class="btn btn-danger" id="btn-confirm-rechazo">Rechazar Pago</button>`;

        const modal = UI.modal('Rechazar Pago', body, footer);

        document.getElementById('btn-confirm-rechazo').onclick = async () => {
            const motivo = document.getElementById('motivo-rechazo').value.trim();
            if (!motivo) {
                UI.toast('Ingrese el motivo del rechazo', 'error');
                return;
            }

            modal.hide();
            const res = await API.validarPago(pagoId, 'rechazar', motivo);
            if (res.success) {
                UI.toast('Pago rechazado', 'info');
                this.render();
                UI.updateBadges();
            } else {
                UI.toast(res.message, 'error');
            }
        };
    }
};
