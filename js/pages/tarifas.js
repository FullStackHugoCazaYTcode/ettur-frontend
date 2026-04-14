/**
 * ETTUR - Página de Tarifas (Solo Admin)
 */
const PageTarifas = {
    async render() {
        const main = document.getElementById('app-main');
        UI.loading();

        const res = await API.getTarifas();

        if (!res.success) {
            main.innerHTML = `<div class="alert alert-danger">${res.message}</div>`;
            return;
        }

        const tarifas = res.data;

        // Determinar tarifa actual
        const hoy = new Date();
        const mesActual = hoy.getMonth() + 1;
        const diaActual = hoy.getDate();

        const tarifasHtml = tarifas.map(t => {
            const fechaNum = mesActual * 100 + diaActual;
            const inicioNum = t.mes_inicio * 100 + t.dia_inicio;
            const finNum = t.mes_fin * 100 + t.dia_fin;
            let esActual = false;
            if (inicioNum <= finNum) {
                esActual = fechaNum >= inicioNum && fechaNum <= finNum;
            } else {
                esActual = fechaNum >= inicioNum || fechaNum <= finNum;
            }

            const icon = t.tipo === 'verano' ? 'sun-fill' : 'cloud-sun-fill';
            const color = t.tipo === 'verano' ? 'warning' : 'info';

            return `
                <div class="card-ettur fade-in mb-3">
                    <div class="card-body-inner pt-3">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div class="d-flex align-items-center gap-2">
                                <div class="stat-icon ${t.tipo === 'verano' ? 'orange' : 'blue'}">
                                    <i class="bi bi-${icon}"></i>
                                </div>
                                <div>
                                    <div class="fw-bold text-capitalize">${t.tipo}</div>
                                    <small class="text-muted">${t.descripcion || ''}</small>
                                </div>
                            </div>
                            ${esActual ? '<span class="badge bg-success">Vigente</span>' : '<span class="badge bg-secondary">Inactiva</span>'}
                        </div>

                        <div class="d-flex justify-content-between align-items-center my-3 p-3 rounded" style="background:var(--border-light)">
                            <div>
                                <div class="text-muted" style="font-size:0.75rem">Monto Quincenal</div>
                                <div class="stat-value text-primary">${CONFIG.formatMoney(t.monto)}</div>
                            </div>
                            <div class="text-end">
                                <div class="text-muted" style="font-size:0.75rem">Periodo</div>
                                <div class="fw-semibold">${t.dia_inicio}/${CONFIG.MESES_CORTO[t.mes_inicio]} — ${t.dia_fin}/${CONFIG.MESES_CORTO[t.mes_fin]}</div>
                            </div>
                        </div>

                        <button class="btn btn-outline-ettur btn-ettur w-100" onclick="PageTarifas.editar(${t.id}, '${t.tipo}', ${t.monto}, '${t.descripcion || ''}', ${t.dia_inicio}, ${t.mes_inicio}, ${t.dia_fin}, ${t.mes_fin})">
                            <i class="bi bi-pencil"></i> Editar Tarifa
                        </button>
                    </div>
                </div>`;
        }).join('');

        main.innerHTML = `
            <div class="page-title"><i class="bi bi-tags-fill"></i> Gestión de Tarifas</div>

            <div class="alert alert-info d-flex align-items-start gap-2 mb-3 fade-in" style="font-size:0.85rem">
                <i class="bi bi-info-circle-fill mt-1"></i>
                <div>
                    <strong>Regla de temporadas:</strong> Las tarifas se aplican automáticamente según las fechas configuradas.
                    Los periodos de pago usarán la tarifa vigente en su fecha de inicio.
                </div>
            </div>

            ${tarifasHtml}`;
    },

    editar(id, tipo, monto, descripcion, diaInicio, mesInicio, diaFin, mesFin) {
        const mesesOptions = CONFIG.MESES.map((m, i) => i === 0 ? '' : `<option value="${i}">${m}</option>`).join('');

        const body = `
            <form id="form-tarifa">
                <div class="mb-3">
                    <label class="form-label" style="font-size:0.8rem">Tipo</label>
                    <input type="text" class="form-control text-capitalize" value="${tipo}" disabled>
                </div>
                <div class="mb-3">
                    <label class="form-label" style="font-size:0.8rem">Monto Quincenal (S/.) *</label>
                    <input type="number" class="form-control fs-4 fw-bold text-center" id="tar-monto" 
                           value="${monto}" step="0.50" min="0.01" required>
                </div>
                <div class="mb-3">
                    <label class="form-label" style="font-size:0.8rem">Descripción</label>
                    <input type="text" class="form-control" id="tar-desc" value="${descripcion}">
                </div>
                <div class="row g-2 mb-3">
                    <div class="col-3">
                        <label class="form-label" style="font-size:0.75rem">Día inicio</label>
                        <input type="number" class="form-control" id="tar-dia-ini" value="${diaInicio}" min="1" max="31">
                    </div>
                    <div class="col-3">
                        <label class="form-label" style="font-size:0.75rem">Mes inicio</label>
                        <select class="form-select" id="tar-mes-ini">${mesesOptions.replace(`value="${mesInicio}"`, `value="${mesInicio}" selected`)}</select>
                    </div>
                    <div class="col-3">
                        <label class="form-label" style="font-size:0.75rem">Día fin</label>
                        <input type="number" class="form-control" id="tar-dia-fin" value="${diaFin}" min="1" max="31">
                    </div>
                    <div class="col-3">
                        <label class="form-label" style="font-size:0.75rem">Mes fin</label>
                        <select class="form-select" id="tar-mes-fin">${mesesOptions.replace(`value="${mesFin}"`, `value="${mesFin}" selected`)}</select>
                    </div>
                </div>
                <div id="tar-error" class="alert alert-danger d-none"></div>
            </form>`;

        const footer = `
            <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button class="btn btn-primary-ettur btn-ettur" id="btn-save-tarifa">Guardar Cambios</button>`;

        const modal = UI.modal(`Editar Tarifa ${tipo}`, body, footer);

        document.getElementById('btn-save-tarifa').onclick = async () => {
            const data = {
                id: id,
                monto: parseFloat(document.getElementById('tar-monto').value),
                descripcion: document.getElementById('tar-desc').value,
                dia_inicio: parseInt(document.getElementById('tar-dia-ini').value),
                mes_inicio: parseInt(document.getElementById('tar-mes-ini').value),
                dia_fin: parseInt(document.getElementById('tar-dia-fin').value),
                mes_fin: parseInt(document.getElementById('tar-mes-fin').value)
            };

            if (!data.monto || data.monto <= 0) {
                document.getElementById('tar-error').textContent = 'Ingrese un monto válido';
                document.getElementById('tar-error').classList.remove('d-none');
                return;
            }

            const res = await API.editarTarifa(data);
            if (res.success) {
                modal.hide();
                UI.toast('Tarifa actualizada correctamente', 'success');
                this.render();
            } else {
                document.getElementById('tar-error').textContent = res.message;
                document.getElementById('tar-error').classList.remove('d-none');
            }
        };
    }
};
