/**
 * ETTUR - Página de Tarifas v2.0
 * Tarifas por tipo de trabajador y temporada
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

        const data = res.data;
        const tarifas = data.tarifas || [];
        const temporada_actual = data.temporada_actual || 'normal';
        const config = data.config_temporadas || {};

        // Agrupar por tipo de trabajador
        const grupos = {};
        tarifas.forEach(t => {
            if (!grupos[t.tipo_trabajador]) grupos[t.tipo_trabajador] = [];
            grupos[t.tipo_trabajador].push(t);
        });

        const tipoInfo = {
            'normal': { icon: 'person-fill', label: 'Trabajador Normal', desc: 'Pago semanal - varía por temporada' },
            'especial': { icon: 'star-fill', label: 'Trabajador Especial', desc: 'Pago semanal - monto fijo' },
            'mensual': { icon: 'calendar-month-fill', label: 'Trabajador Mensual', desc: 'Pago mensual - monto fijo' }
        };

        let tarifasHtml = '';
        for (const tipo in grupos) {
            const info = tipoInfo[tipo] || { icon: 'gear', label: tipo, desc: '' };
            const items = grupos[tipo];

            tarifasHtml += `
                <div class="card-ettur fade-in mb-3">
                    <div class="card-body-inner pt-3">
                        <div class="d-flex align-items-center gap-2 mb-3">
                            <div class="stat-icon blue">
                                <i class="bi bi-${info.icon}"></i>
                            </div>
                            <div>
                                <div class="fw-bold">${info.label}</div>
                                <small class="text-muted">${info.desc}</small>
                            </div>
                        </div>

                        ${items.map(t => {
                            const esActual = t.temporada === temporada_actual;
                            const iconTemp = t.temporada === 'verano' ? 'sun-fill text-warning' : 'cloud-sun-fill text-info';
                            return `
                            <div class="d-flex justify-content-between align-items-center p-3 mb-2 rounded" style="background:var(--border-light)">
                                <div class="d-flex align-items-center gap-2">
                                    <i class="bi bi-${iconTemp}"></i>
                                    <div>
                                        <div class="fw-semibold text-capitalize">${t.temporada}</div>
                                        <small class="text-muted">${t.frecuencia}</small>
                                    </div>
                                </div>
                                <div class="text-end">
                                    <div class="fw-bold text-primary fs-5">${CONFIG.formatMoney(t.monto)}</div>
                                    ${esActual ? '<span class="badge bg-success" style="font-size:0.65rem">Vigente</span>' : ''}
                                </div>
                                <button class="btn btn-outline-primary btn-sm" onclick="PageTarifas.editar(${t.id}, '${info.label} - ${t.temporada}', ${t.monto})">
                                    <i class="bi bi-pencil"></i>
                                </button>
                            </div>`;
                        }).join('')}
                    </div>
                </div>`;
        }

        main.innerHTML = `
            <div class="page-title"><i class="bi bi-tags-fill"></i> Gestión de Tarifas</div>

            <div class="alert alert-info d-flex align-items-start gap-2 mb-3 fade-in" style="font-size:0.85rem">
                <i class="bi bi-info-circle-fill mt-1"></i>
                <div>
                    <strong>Temporada actual: ${temporada_actual.toUpperCase()}</strong><br>
                    Verano: ${config.verano?.inicio || '1/Ene'} — ${config.verano?.fin || '15/Abr'} · 
                    Normal: ${config.normal?.inicio || '16/Abr'} — ${config.normal?.fin || '31/Dic'}
                </div>
            </div>

            <div class="alert alert-light border mb-3" style="font-size:0.8rem">
                <strong>Nota:</strong> Los trabajadores <em>Personalizado</em> tienen montos individuales configurados al momento de registrarlos.
            </div>

            ${tarifasHtml}`;
    },

    editar(id, nombre, montoActual) {
        const body = `
            <form id="form-tarifa">
                <div class="mb-3">
                    <label class="form-label" style="font-size:0.8rem">Tarifa</label>
                    <input type="text" class="form-control" value="${nombre}" disabled>
                </div>
                <div class="mb-3">
                    <label class="form-label" style="font-size:0.8rem">Monto (S/.) *</label>
                    <input type="number" class="form-control fs-4 fw-bold text-center" id="tar-monto" 
                           value="${montoActual}" step="0.50" min="0.01" required>
                </div>
                <div id="tar-error" class="alert alert-danger d-none"></div>
            </form>`;

        const footer = `
            <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button class="btn btn-primary-ettur btn-ettur" id="btn-save-tarifa">Guardar Cambios</button>`;

        const modal = UI.modal('Editar Tarifa', body, footer);

        document.getElementById('btn-save-tarifa').onclick = async () => {
            const monto = parseFloat(document.getElementById('tar-monto').value);

            if (!monto || monto <= 0) {
                document.getElementById('tar-error').textContent = 'Ingrese un monto válido';
                document.getElementById('tar-error').classList.remove('d-none');
                return;
            }

            const res = await API.editarTarifa({ id, monto });
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
