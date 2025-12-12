// js/dashboard.js
class DashboardComponent {
    constructor() {
        this.graficoGastos = null;
        this.graficoBalance = null;
        this.graficoComparativa = null;
        this.graficoEvolucion = null;
    }

    async afterRender() {
        // hook para select de mes en panel principal
        const selector = document.getElementById('selector-grafico');
        if (selector) {
            selector.addEventListener('change', async (e) => {
                const val = e.target.value;
                if (val === 'acumulado') {
                    await this.crearGraficoGastos(null, true);
                } else {
                    await this.crearGraficoGastos(parseInt(val), false);
                }
            });
        }

        await this.cargarResumen();
        await this.cargarTransaccionesRecientes();
        await this.cargarPresupuestosDashboard();
        await this.inicializarGraficos();
    }

    async cargarResumen() {
        try {
            const transacciones = await obtenerTodos(STORES.MOVIMIENTOS);
            const anoActual = new Date().getFullYear();
            let ingresosAno = 0;
            let gastosAno = 0;
            transacciones.forEach(trans => {
                // robust parse
                if (!trans.fecha) return;
                const [y, m, d] = String(trans.fecha).split('-');
                const fecha = new Date(Number(y), Number(m) - 1, Number(d));
                if (fecha.getFullYear() === anoActual) {
                    if (trans.tipo === 'ingreso') ingresosAno += Number(trans.monto || 0);
                    else gastosAno += Number(trans.monto || 0);
                }
            });
            const balanceAno = ingresosAno - gastosAno;
            document.getElementById('total-ingresos').textContent = `$${ingresosAno.toFixed(2)}`;
            document.getElementById('total-gastos').textContent = `$${gastosAno.toFixed(2)}`;
            document.getElementById('balance-total').textContent = `$${balanceAno.toFixed(2)}`;
            const estadoBalance = document.getElementById('estado-balance');
            if (balanceAno > 0) { estadoBalance.textContent = 'Superávit'; estadoBalance.style.color = '#27ae60'; }
            else if (balanceAno < 0) { estadoBalance.textContent = 'Déficit'; estadoBalance.style.color = '#e74c3c'; }
            else { estadoBalance.textContent = 'Equilibrado'; estadoBalance.style.color = '#f39c12'; }
        } catch (error) { console.error('Error cargando resumen:', error); }
    }

    async cargarTransaccionesRecientes() {
        try {
            const transacciones = await obtenerTodos(STORES.MOVIMIENTOS);
            const categorias = await obtenerTodos(STORES.CATEGORIAS);
            transacciones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            const lista = document.getElementById('lista-transacciones-recientes');
            if (!lista) return;
            const recientes = transacciones.slice(0,5);
            if (recientes.length === 0) {
                lista.innerHTML = `<div class="estado-vacio"><p>No hay transacciones registradas</p><a href="#transacciones" class="btn-pequeno">Agregar transacción</a></div>`;
                return;
            }
            lista.innerHTML = recientes.map(trans => {
                const cat = categorias.find(c => c.id === trans.categoria);
                const fecha = new Date(trans.fecha).toLocaleDateString('es-ES');
                const color = trans.tipo === 'ingreso' ? '#27ae60' : '#e74c3c';
                const simbolo = trans.tipo === 'ingreso' ? '+' : '-';
                return `
                    <div class="item-transaccion">
                        <span class="trans-descripcion">${trans.descripcion || 'Sin descripción'}</span>
                        <span class="trans-categoria">${cat ? cat.nombre : 'Sin categoría'}</span>
                        <span class="trans-monto" style="color:${color}">${simbolo}$${Number(trans.monto).toFixed(2)}</span>
                        <span class="trans-fecha">${fecha}</span>
                    </div>
                `;
            }).join('');
        } catch (err) { console.error(err); }
    }

    async cargarPresupuestosDashboard() {
        try {
            const presupuestos = await obtenerTodos(STORES.PRESUPUESTOS);
            const categorias = await obtenerTodos(STORES.CATEGORIAS);
            const transacciones = await obtenerTodos(STORES.MOVIMIENTOS);
            const mesActual = new Date().getMonth() + 1;
            const anoActual = new Date().getFullYear();
            const lista = document.getElementById('lista-presupuestos-dashboard');
            if (!lista) return;
            const mesLabel = document.getElementById('mes-actual-label');
            if (mesLabel) {
                const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
                mesLabel.textContent = `${meses[mesActual-1]} ${anoActual}`;
            }
            const actuales = presupuestos.filter(p => p.mes === mesActual && p.ano === anoActual);
            if (actuales.length === 0) {
                lista.innerHTML = `<div class="estado-vacio"><p>No hay presupuestos para este mes</p><a href="#presupuestos" class="btn-pequeno">Configurar presupuesto</a></div>`;
                return;
            }
            lista.innerHTML = await Promise.all(actuales.map(async pres => {
                const cat = categorias.find(c => c.id === pres.categoria);
                if (!cat) return '';
                const gastosMes = transacciones.filter(t => t.categoria === pres.categoria && t.tipo === 'gasto' && new Date(t.fecha).getMonth()+1 === mesActual && new Date(t.fecha).getFullYear() === anoActual);
                const gastoTotal = gastosMes.reduce((s, t) => s + Number(t.monto || 0), 0);
                const porcentaje = (gastoTotal / pres.monto) * 100;
                let estado = 'normal'; let estadoColor = '#27ae60';
                if (porcentaje >= 100) { estado = 'excedido'; estadoColor = '#e74c3c'; }
                else if (porcentaje >= 80) { estado = 'alerta'; estadoColor = '#f39c12'; }
                return `
                    <div class="item-presupuesto-dash">
                        <div class="presupuesto-header">
                            <span class="presupuesto-categoria" style="color:${cat.color}">${cat.nombre}</span>
                            <span class="presupuesto-porcentaje" style="color:${estadoColor}">${porcentaje.toFixed(0)}%</span>
                        </div>
                        <div class="presupuesto-detalle">
                            <span>Presupuesto: $${pres.monto.toFixed(2)}</span>
                            <span>Gastado: $${gastoTotal.toFixed(2)}</span>
                        </div>
                        <div class="barra-progreso">
                            <div class="progreso-fill ${estado}" style="width: ${Math.min(porcentaje,100)}%"></div>
                        </div>
                    </div>
                `;
            })).then(items => items.filter(i => i !== '').join(''));
        } catch (err) { console.error(err); }
    }

    async inicializarGraficos() {
        const mesActual = new Date().getMonth() + 1;
        // por defecto mostrar acumulado
        await this.crearGraficoGastos(null, true);
        await this.crearGraficoEvolucion(new Date().getFullYear());
        await this.crearGraficoBalance(mesActual);
        await this.crearGraficoComparativa(mesActual);
    }

    async crearGraficoGastos(mes, acumulado = false) {
        try {
            const transacciones = await obtenerTodos(STORES.MOVIMIENTOS);
            const categorias = await obtenerTodos(STORES.CATEGORIAS);
            const anoActual = new Date().getFullYear();
            const gastosPorCategoria = {};
            categorias.forEach(cat => {
                if (cat.tipo === 'gasto') {
                    gastosPorCategoria[cat.id] = { nombre: cat.nombre, color: cat.color, total: 0 };
                }
            });
            transacciones.forEach(trans => {
                if (trans.tipo !== 'gasto') return;
                if (!trans.fecha) return;
                const [y,m,d] = String(trans.fecha).split('-');
                const fechaTrans = new Date(Number(y), Number(m)-1, Number(d));
                const mesTrans = fechaTrans.getMonth() + 1;
                const anoTrans = fechaTrans.getFullYear();
                if (acumulado) {
                    if (anoTrans === anoActual) {
                        if (gastosPorCategoria[trans.categoria]) gastosPorCategoria[trans.categoria].total += Number(trans.monto || 0);
                    }
                } else {
                    if (mesTrans === mes && anoTrans === anoActual) {
                        if (gastosPorCategoria[trans.categoria]) gastosPorCategoria[trans.categoria].total += Number(trans.monto || 0);
                    }
                }
            });
            const categoriasConGastos = Object.values(gastosPorCategoria).filter(c => c.total > 0);
            const canvas = document.getElementById('grafico-gastos');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (this.graficoGastos) this.graficoGastos.destroy();
            if (categoriasConGastos.length === 0) {
                ctx.clearRect(0,0,canvas.width,canvas.height);
                ctx.font = '14px Arial';
                ctx.fillStyle = '#95a5a6';
                ctx.textAlign = 'center';
                ctx.fillText('No hay datos', canvas.width / 2, canvas.height / 2);
                return;
            }
            this.graficoGastos = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: categoriasConGastos.map(c => c.nombre),
                    datasets: [{ data: categoriasConGastos.map(c => c.total), backgroundColor: categoriasConGastos.map(c => c.color), borderWidth: 1 }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend:{ position:'bottom' },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a,b)=>a+b,0);
                                    const percentage = Math.round((value/total)*100);
                                    return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creando grafico de gastos:', error);
        }
    }

    async crearGraficoEvolucion(ano) {
        try {
            const transacciones = await obtenerTodos(STORES.MOVIMIENTOS);
            const balancesMensuales = Array(12).fill(0);
            for (let mes = 0; mes < 12; mes++) {
                let ingresos = 0; let gastos = 0;
                transacciones.forEach(trans => {
                    if (!trans.fecha) return;
                    const fechaTrans = new Date(trans.fecha);
                    const mesTrans = fechaTrans.getMonth();
                    const anoTrans = fechaTrans.getFullYear();
                    if (mesTrans === mes && anoTrans === ano) {
                        if (trans.tipo === 'ingreso') ingresos += Number(trans.monto || 0);
                        else gastos += Number(trans.monto || 0);
                    }
                });
                balancesMensuales[mes] = ingresos - gastos;
            }
            const canvas = document.getElementById('grafico-evolucion');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (this.graficoEvolucion) this.graficoEvolucion.destroy();
            const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
            this.graficoEvolucion = new Chart(ctx, {
                type: 'line',
                data: { labels: meses, datasets: [{ label:'Balance Mensual', data: balancesMensuales, borderColor:'#3498db', backgroundColor:'rgba(52,152,219,0.1)', tension:0.3 }]},
                options: { responsive:true, maintainAspectRatio:false, scales:{ y:{ beginAtZero:true, ticks:{ callback: v => `$${v}` }}}}
            });
        } catch (err) { console.error('Error grafico evolucion', err); }
    }

    async crearGraficoBalance(mes) {
        try {
            const transacciones = await obtenerTodos(STORES.MOVIMIENTOS);
            const presupuestos = await obtenerTodos(STORES.PRESUPUESTOS);
            const categorias = await obtenerTodos(STORES.CATEGORIAS);
            const anoActual = new Date().getFullYear();
            let ingresosReales = 0, gastosReales = 0, gastosEstimados = 0;
            transacciones.forEach(trans => {
                if (!trans.fecha) return;
                const fechaTrans = new Date(trans.fecha);
                const mesTrans = fechaTrans.getMonth()+1;
                const anoTrans = fechaTrans.getFullYear();
                if (mesTrans === mes && anoTrans === anoActual) {
                    if (trans.tipo === 'ingreso') ingresosReales += Number(trans.monto || 0);
                    else gastosReales += Number(trans.monto || 0);
                }
            });
            presupuestos.forEach(pres => {
                if (pres.mes === mes && pres.ano === anoActual) {
                    const cat = categorias.find(c => c.id === pres.categoria);
                    if (cat && cat.tipo === 'gasto') gastosEstimados += Number(pres.monto || 0);
                }
            });
            const balanceReal = ingresosReales - gastosReales;
            const balanceEstimado = ingresosReales - gastosEstimados;
            const canvas = document.getElementById('grafico-balance');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (this.graficoBalance) this.graficoBalance.destroy();
            this.graficoBalance = new Chart(ctx, {
                type:'bar',
                data: {
                    labels:['Balance'],
                    datasets: [
                        { label:'Real', data:[balanceReal], backgroundColor:'#27ae60'},
                        { label:'Estimado', data:[balanceEstimado], backgroundColor:'#3498db'}
                    ]
                },
                options: { responsive:true, maintainAspectRatio:false, scales:{ y:{ beginAtZero:true, ticks:{ callback: v => `$${v}` }}}}
            });
        } catch (err) { console.error('Error creando grafico de balance', err); }
    }

    async crearGraficoComparativa(mes) {
        try {
            const transacciones = await obtenerTodos(STORES.MOVIMIENTOS);
            const anoActual = new Date().getFullYear();
            let ingresos=0, gastos=0;
            transacciones.forEach(trans => {
                if (!trans.fecha) return;
                const fechaTrans = new Date(trans.fecha);
                const mesTrans = fechaTrans.getMonth()+1;
                const anoTrans = fechaTrans.getFullYear();
                if (mesTrans === mes && anoTrans === anoActual) {
                    if (trans.tipo === 'ingreso') ingresos += Number(trans.monto || 0);
                    else gastos += Number(trans.monto || 0);
                }
            });
            const canvas = document.getElementById('grafico-comparativa');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (this.graficoComparativa) this.graficoComparativa.destroy();
            this.graficoComparativa = new Chart(ctx, {
                type:'bar',
                data: { labels:['Ingresos vs Gastos'], datasets:[ { label:'Ingresos', data:[ingresos], backgroundColor:'#27ae60'}, { label:'Gastos', data:[gastos], backgroundColor:'#e74c3c'} ]},
                options:{ responsive:true, maintainAspectRatio:false, scales:{ y:{ beginAtZero:true, ticks:{ callback:v => `$${v}` }}}}
            });
        } catch (err) { console.error(err); }
    }

    async actualizarDashboard() {
        await this.cargarResumen();
        await this.cargarTransaccionesRecientes();
        await this.cargarPresupuestosDashboard();
        const mesActual = new Date().getMonth() + 1;
        await this.crearGraficoGastos(mesActual, false); // por defecto actualizar con mes actual
        await this.crearGraficoBalance(mesActual);
        await this.crearGraficoComparativa(mesActual);
    }
}

if (typeof window.components === 'undefined') window.components = {};
window.components.DashboardComponent = DashboardComponent;

// instancia global para que otros módulos la llamen
document.addEventListener('db-ready', async () => {
    window.dashboardInstance = new DashboardComponent();
    await window.dashboardInstance.afterRender();
});

// escuchar eventos para actualización en tiempo real
document.addEventListener("movimientos-actualizados", () => {
    window.dashboardInstance?.actualizarDashboard();
});
document.addEventListener("categorias-actualizadas", () => {
    window.dashboardInstance?.actualizarDashboard();
});
document.addEventListener("presupuestos-actualizados", () => {
    window.dashboardInstance?.actualizarDashboard();
});
