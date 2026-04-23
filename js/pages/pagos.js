/**
 * ETTUR - Página de Pagos v2.2
 * Con info de Yape del admin
 */
const PagePagos = {
    yapeInfo: null,

    async cargarYapeInfo() {
        try {
            const res = await API.getYapeInfo();
            if (res.success) { this.yapeInfo = res.data; }
        } catch (e) { }
    },

    async renderPagar(main) {
        main = main || document.getElementById('app-main');
        UI.loading();

        await this.cargarYapeInfo();
        const res = await API.getPeriodosPendientes();

        if (!res.success) {
            main.innerHTML = `
                <div class="page-title"><i class="bi bi-cash-stack"></i> Subir Pago</div>
                <div class="alert alert-warning"><i class="bi bi-exclamation-triangle"></i> ${res.message}</div>`;
            return;
        }

        const data = res.data;

        if (!data.periodo_siguiente_pago) {
            main.innerHTML = `
                <div class="page-title"><i class="bi bi-cash-stack"></i> Subir Pago</div>
                ${UI.emptyState('check-circle', '¡Estás al día!', 'No tienes periodos pendientes de pago.')}`;
            return;
        }

        const p = data.periodo_siguiente_pago;
        const frecLabel = p.frecuencia === 'mensual' ? 'Mensual' : 'Semanal';

        const yapeNombre = this.yapeInfo?.yape_nombre || '';
        const yapeNumero = this.yapeInfo?.yape_numero || '';
        const tieneYape = yapeNombre || yapeNumero;

        main.innerHTML = `
            <div class="page-title"><i class="bi bi-cash-stack"></i> Subir Pago</div>

            <div class="card-ettur fade-in">
                <div class="card-head">
                    <h3>Periodo a Pagar</h3>
                    ${UI.badgeEstado('pendiente')}
                </div>
                <div class="card-body-inner">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="fw-bold fs-5">${CONFIG.periodLabelShort(p)}</span>
                        <span class="stat-value text-primary">${CONFIG.formatMoney(p.monto)}</span>
                    </div>
                    <small class="text-muted">
                        <i class="bi bi-calendar3"></i> Del ${p.fecha_inicio} al ${p.fecha_fin} · Tarifa ${p.tipo_tarifa} · ${frecLabel}
                    </small>
                    ${data.total_periodos_pendientes > 1 ? `
                    <div class="alert alert-warning mt-3 mb-0 py-2" style="font-size:0.8rem">
                        <i class="bi bi-info-circle"></i> Tienes ${data.total_periodos_pendientes} periodos pendientes.
                        Debes pagar en orden correlativo.
                    </div>` : ''}
                </div>
            </div>

            <div class="card-ettur fade-in" style="animation-delay:0.1s">
                <div class="card-head"><h3>Datos del Pago</h3></div>
                <div class="card-body-inner">
                    <form id="form-pago" enctype="multipart/form-data">
                        <input type="hidden" id="pago-fecha-inicio" value="${p.fecha_inicio}">
                        <input type="hidden" id="pago-fecha-fin" value="${p.fecha_fin}">

                        <div class="form-section">
                            <label>Método de Pago</label>
                            <div class="d-flex gap-2">
                                <button type="button" class="btn btn-outline-ettur flex-fill metodo-btn active" data-metodo="yape" onclick="PagePagos.selectMetodo(this)">
                                    <i class="bi bi-phone-fill"></i> Yape
                                </button>
                                <button type="button" class="btn btn-outline-ettur flex-fill metodo-btn" data-metodo="transferencia" onclick="PagePagos.selectMetodo(this)">
                                    <i class="bi bi-bank"></i> Transferencia
                                </button>
                                <button type="button" class="btn btn-outline-ettur flex-fill metodo-btn" data-metodo="efectivo" onclick="PagePagos.selectMetodo(this)">
                                    <i class="bi bi-cash-coin"></i> Efectivo
                                </button>
                            </div>
                            <input type="hidden" id="pago-metodo" value="yape">
                        </div>

                        <!-- Info Yape -->
                        <div id="yape-info-box" class="mb-3">
                            ${tieneYape ? `
                            <div style="background:linear-gradient(135deg,#6B21A8,#7C3AED);border-radius:12px;padding:1rem;color:#fff">
                                <div class="d-flex align-items-center gap-2 mb-2">
                                    <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center">
                                        <i class="bi bi-phone-fill"></i>
                                    </div>
                                    <div>
                                        <div style="font-size:0.75rem;opacity:0.8">Yapear a:</div>
                                        <div class="fw-bold">${yapeNombre}</div>
                                    </div>
                                </div>
                                <div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:0.6rem;text-align:center;font-size:1.3rem;font-weight:800;letter-spacing:2px">
                                    ${yapeNumero}
                                </div>
                                <div class="text-center mt-2" style="font-size:0.75rem;opacity:0.7">
                                    Monto a yapear: <strong>${CONFIG.formatMoney(p.monto)}</strong>
                                </div>
                            </div>` : `
                            <div class="alert alert-info py-2 mb-0" style="font-size:0.8rem">
                                <i class="bi bi-info-circle"></i> Contacte al administrador para obtener el número de Yape.
                            </div>`}
                        </div>

                        <!-- Info Transferencia (oculto por defecto) -->
                        <div id="transferencia-info-box" class="mb-3" style="display:none">
                            <div class="alert alert-info py-2 mb-0" style="font-size:0.8rem">
                                <i class="bi bi-bank"></i> Realice la transferencia y suba la captura del comprobante.
                            </div>
                        </div>

                        <!-- Info Efectivo (oculto por defecto) -->
                        <div id="efectivo-info-box" class="mb-3" style="display:none">
                            <div class="alert alert-success py-2 mb-0" style="font-size:0.8rem">
                                <i class="bi bi-cash-coin"></i> Pago en efectivo. No necesita comprobante.
                            </div>
                        </div>

                        <div class="form-section" id="comprobante-section">
                            <label>Comprobante (Captura de pantalla)</label>
                            <div class="upload-area" id="upload-area" onclick="document.getElementById('file-comprobante').click()">
                                <i class="bi bi-cloud-arrow-up"></i>
                                <p>Toca para subir tu captura de pago<br><small>JPG, PNG o WebP · Máx. 5MB</small></p>
                                <img id="preview-img" class="upload-preview" style="display:none" alt="Preview">
                            </div>
                            <input type="file" id="file-comprobante" accept="image/jpeg,image/png,image/webp" style="display:none" onchange="PagePagos.handleFileSelect(event)">
                        </div>

                        <div class="form-section">
                            <label>Observaciones (opcional)</label>
                            <textarea class="form-control" id="pago-observaciones" rows="2" placeholder="Ej: Pago adelantado"></textarea>
                        </div>

                        <div id="pago-error" class="alert alert-danger d-none"></div>

                        <button type="submit" class="btn btn-primary-ettur btn-ettur w-100 btn-lg" id="btn-enviar-pago">
                            <i class="bi bi-send-fill"></i> Enviar Pago para Validación
                        </button>
                    </form>
                </div>
            </div>`;

        document.getElementById('form-pago').onsubmit = (e) => {
            e.preventDefault();
            this.submitPago();
        };

        const uploadArea = document.getElementById('upload-area');
        uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
        uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            if (e.dataTransfer.files.length) {
                document.getElementById('file-comprobante').files = e.dataTransfer.files;
                this.handleFileSelect({ target: { files: e.dataTransfer.files } });
            }
        });
    },

    selectMetodo(btn) {
        document.querySelectorAll('.metodo-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('pago-metodo').value = btn.dataset.metodo;

        const metodo = btn.dataset.metodo;

        // Mostrar/ocultar info boxes
        document.getElementById('yape-info-box').style.display = metodo === 'yape' ? '' : 'none';
        document.getElementById('transferencia-info-box').style.display = metodo === 'transferencia' ? '' : 'none';
        document.getElementById('efectivo-info-box').style.display = metodo === 'efectivo' ? '' : 'none';

        // Mostrar/ocultar comprobante
        const section = document.getElementById('comprobante-section');
        section.style.display = metodo === 'efectivo' ? 'none' : '';
    },

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { UI.toast('El archivo excede 5MB', 'error'); return; }
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowed.includes(file.type)) { UI.toast('Formato no permitido', 'error'); return; }
        const reader = new FileReader();
        reader.onload = (ev) => {
            const preview = document.getElementById('preview-img');
            preview.src = ev.target.result;
            preview.style.display = 'block';
            document.getElementById('upload-area').classList.add('has-file');
        };
        reader.readAsDataURL(file);
    },

    async submitPago() {
        const btn = document.getElementById('btn-enviar-pago');
        const errorEl = document.getElementById('pago-error');
        errorEl.classList.add('d-none');
        const metodo = document.getElementById('pago-metodo').value;
        const file = document.getElementById('file-comprobante').files[0];
        if (metodo !== 'efectivo' && !file) {
            errorEl.textContent = 'Debe adjuntar el comprobante de pago';
            errorEl.classList.remove('d-none');
            return;
        }
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Enviando...';
        const formData = new FormData();
        formData.append('fecha_inicio', document.getElementById('pago-fecha-inicio').value);
        formData.append('fecha_fin', document.getElementById('pago-fecha-fin').value);
        formData.append('metodo_pago', metodo);
        formData.append('observaciones', document.getElementById('pago-observaciones').value);
        if (file) formData.append('comprobante', file);
        const res = await API.registrarPago(formData);
        if (res.success) {
            UI.toast('¡Pago registrado! Pendiente de aprobación.', 'success');
            App.navigate('mis-pagos');
        } else {
            errorEl.textContent = res.message;
            errorEl.classList.remove('d-none');
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-send-fill"></i> Enviar Pago para Validación';
        }
    },

    async renderMisPagos(main) {
        main = main || document.getElementById('app-main');
        UI.loading();
        const res = await API.getMisPagos();
        let content = '';
        if (res.success && res.data.length > 0) {
            content = res.data.map(p => `
                <div class="payment-item" onclick="PagePagos.verDetalle(${p.id})">
                    <div class="payment-dot ${p.estado}"></div>
                    <div class="payment-info">
                        <div class="payment-period">${CONFIG.periodLabelShort(p)}</div>
                        <div class="payment-meta">
                            ${UI.metodoPagoIcon(p.metodo_pago)} · ${CONFIG.formatDate(p.fecha_pago)}
                            · <small class="text-muted">${p.frecuencia === 'mensual' ? 'Mensual' : 'Semanal'}</small>
                        </div>
                    </div>
                    <div class="payment-status">
                        ${UI.badgeEstado(p.estado)}
                        <div class="payment-amount">${CONFIG.formatMoney(p.monto_pagado)}</div>
                    </div>
                </div>`).join('');
        } else {
            content = UI.emptyState('receipt', 'Sin pagos registrados', 'Aún no has registrado ningún pago.');
        }
        main.innerHTML = `
            <div class="page-title"><i class="bi bi-receipt"></i> Mis Comprobantes</div>
            <div class="card-ettur fade-in">
                <div class="card-body-inner pt-3">${content}</div>
            </div>`;
    },

    async verDetalle(id) {
        const res = await API.getDetallePago(id);
        if (!res.success) { UI.toast(res.message, 'error'); return; }
        const p = res.data;
        const comprobanteHtml = p.comprobante_url
            ? `<div class="text-center mt-3">
                <img src="${API.getComprobanteUrl(p.comprobante_url)}" class="img-fluid rounded" style="max-height:300px;cursor:pointer"
                     onclick="UI.showImage('${API.getComprobanteUrl(p.comprobante_url)}')" alt="Comprobante">
               </div>`
            : '<p class="text-muted text-center mt-2"><i class="bi bi-image"></i> Sin comprobante</p>';
        const body = `
            <div class="mb-3">
                <div class="d-flex justify-content-between mb-2">
                    <strong>${CONFIG.periodLabelShort(p)}</strong>
                    ${UI.badgeEstado(p.estado)}
                </div>
                <table class="table table-sm table-borderless mb-0" style="font-size:0.85rem">
                    <tr><td class="text-muted">Monto:</td><td class="fw-bold">${CONFIG.formatMoney(p.monto_pagado)}</td></tr>
                    <tr><td class="text-muted">Método:</td><td>${UI.metodoPagoIcon(p.metodo_pago)}</td></tr>
                    <tr><td class="text-muted">Frecuencia:</td><td>${p.frecuencia === 'mensual' ? 'Mensual' : 'Semanal'}</td></tr>
                    <tr><td class="text-muted">Fecha pago:</td><td>${CONFIG.formatDateTime(p.fecha_pago)}</td></tr>
                    ${p.fecha_validacion ? `<tr><td class="text-muted">Validado:</td><td>${CONFIG.formatDateTime(p.fecha_validacion)}</td></tr>` : ''}
                    ${p.validado_por_nombre ? `<tr><td class="text-muted">Validado por:</td><td>${p.validado_por_nombre}</td></tr>` : ''}
                    ${p.observaciones ? `<tr><td class="text-muted">Observación:</td><td>${p.observaciones}</td></tr>` : ''}
                    ${p.observacion_rechazo ? `<tr><td class="text-muted text-danger">Motivo rechazo:</td><td class="text-danger">${p.observacion_rechazo}</td></tr>` : ''}
                </table>
            </div>
            ${comprobanteHtml}`;
        UI.modal('Detalle del Pago', body, '<button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cerrar</button>');
    }
};
