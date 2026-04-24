/**
 * ETTUR - Página de Tarifas v2.2
 * Con edición de temporadas
 */
const PageTarifas = {
    async render() {
        const main = document.getElementById('app-main');
        UI.loading();

        const [resTarifas, resTemp] = await Promise.all([
            API.getTarifas(),
            API.request('/api/config?action=temporadas')
        ]);

        if (!resTarifas.success) {
            main.innerHTML = `<div class="alert alert-danger">${resTarifas.message}</div>`;
            return;
        }

        const data = resTarifas.data;
        const tarifas = data.tarifas || [];
        const temp = resTemp.success ? resTemp.data : {};
        const temporada_actual = temp.temporada_actual || data.temporada_actual || 'normal';

        const meses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

        const veranoDI = temp.verano_dia_inicio || 1;
        const veranoMI = temp.verano_mes_inicio || 1;
        const veranoDF = temp.verano_dia_fin || 15;
        const veranoMF = temp.verano_mes_fin || 4;

        // Agrupar por tipo
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
                            <div class="stat-icon blue"><i class="bi bi-${info.icon}"></i></div>
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

        const mesesOptions = meses.map((m, i) => i === 0 ? '' : `<option value="${i}">${m}</option>`).join('');

        main.innerHTML = `
            <div class="page-title"><i class="bi bi-tags-fill"></i> Gestión de Tarifas</div>

            <div class="card-ettur fade-in mb-3">
                <div class="card-head">
                    <h3><i class="bi bi-calendar-range text-info"></i> Configuración de Temporadas</h3>
                    <span class="badge bg-${temporada_actual === 'verano' ? 'warning' : 'info'} text-dark">
                        Actual: ${temporada_actual.toUpperCase()}
                    </span>
                </div>
                <div class="card-body-inner">
                    <p style="font-size:0.8rem;color:var(--text-secondary)">
                        Define las fechas que determinan la temporada de verano. Todo lo que esté fuera de este rango será temporada normal.
                    </p>
                    <div class="row g-2 mb-3">
                        <div class="col-6">
                            <label class="form-label" style="font-size:0.75rem;font-weight:600">
                                <i class="bi bi-sun-fill text-warning"></i> Inicio Verano
                            </label>
                            <div class="row g-1">
                                <div class="col-5">
                                    <input type="number" class="form-control form-control-sm" id="temp-dia-ini" value="${veranoDI}" min="1" max="31" placeholder="Día">
                                </div>
                                <div class="col-7">
                                    <select class="form-select form-select-sm" id="temp-mes-ini">
                                        ${mesesOptions.replace(`value="${veranoMI}"`, `value="${veranoMI}" selected`)}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="col-6">
                            <label class="form-label" style="font-size:0.75rem;font-weight:600">
                                <i class="bi bi-sun-fill text-warning"></i> Fin Verano
                            </label>
                            <div class="row g-1">
                                <div class="col-5">
                                    <input type="number" class="form-control form-control-sm" id="temp-dia-fin" value="${veranoDF}" min="1" max="31" placeholder="Día">
                                </div>
                                <div class="col-7">
                                    <select class="form-select form-select-sm" id="temp-mes-fin">
                                        ${mesesOptions.replace(`value="${veranoMF}"`, `value="${veranoMF}" selected`)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="alert alert-light border py-2 mb-3" style="font-size:0.8rem" id="temp-preview">
                        <i class="bi bi-sun-fill text-warning"></i> <strong>Verano:</strong> ${veranoDI} de ${meses[veranoMI]} — ${veranoDF} de ${meses[veranoMF]}<br>
                        <i class="bi bi-cloud-sun-fill text-info"></i> <strong>Normal:</strong> Resto del año
                    </div>
                    <button class="btn btn-primary-ettur btn-ettur w-100" onclick="PageTarifas.guardarTemporadas()">
                        <i class="bi bi-save"></i> Guardar Fechas de Temporada
                    </button>
                </div>
            </div>

            <div class="alert alert-light border mb-3" style="font-size:0.8rem">
                <strong>Nota:</strong> Los trabajadores <em>Personalizado</em> tienen montos individuales configurados al registrarlos.
            </div>

            ${tarifasHtml}`;

        // Preview en tiempo real
        const updatePreview = () => {
            const di = document.getElementById('temp-dia-ini').value;
            const mi = document.getElementById('temp-mes-ini').value;
            const df = document.getElementById('temp-dia-fin').value;
            const mf = document.getElementById('temp-mes-fin').value;
            document.getElementById('temp-preview').innerHTML = `
                <i class="bi bi-sun-fill text-warning"></i> <strong>Verano:</strong> ${di} de ${meses[mi] || '?'} — ${df} de ${meses[mf] || '?'}<br>
                <i class="bi bi-cloud-sun-fill text-info"></i> <strong>Normal:</strong> Resto del año`;
        };
        ['temp-dia-ini', 'temp-mes-ini', 'temp-dia-fin', 'temp-mes-fin'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', updatePreview);
        });
    },

    async guardarTemporadas() {
        const data = {
            verano_dia_inicio: document.getElementById('temp-dia-ini').value,
            verano_mes_inicio: document.getElementById('temp-mes-ini').value,
            verano_dia_fin: document.getElementById('temp-dia-fin').value,
            verano_mes_fin: document.getElementById('temp-mes-fin').value
        };

        if (!data.verano_dia_inicio || !data.verano_mes_inicio || !data.verano_dia_fin || !data.verano_mes_fin) {
            UI.toast('Complete todos los campos de fecha', 'error');
            return;
        }

        const res = await API.updateConfig(data);
        if (res.success) {
            UI.toast('Fechas de temporada actualizadas. Los cambios se reflejarán en las tarifas de los trabajadores.', 'success');
            this.render();
        } else {
            UI.toast(res.message, 'error');
        }
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
            if (res.success) { modal.hide(); UI.toast('Tarifa actualizada', 'success'); this.render(); }
            else { document.getElementById('tar-error').textContent = res.message; document.getElementById('tar-error').classList.remove('d-none'); }
        };
    }
};
