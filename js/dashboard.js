class DashboardComponent {
    constructor() {
        this.graficoGastos = null;
        this.graficoBalance = null;
        this.graficoComparativa = null;
        this.graficoEvolucion = null;
    }

    async init() {
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
                if (!trans.fecha) return;
                const [y, m, d] = trans.fecha.split('-');
                const fecha = new Date(Number(y), Number(m) - 1, Number(d));
                if (fecha.getFullYear() === anoActual) {
                    if (trans.tipo === 'ingreso') ingresosAno += trans.monto;
                    else gastosAno += trans.monto;
                }
            });

            const balanceAno = ingresosAno - gastosAno;

            const totalIngresosEl = document.getElementById('total-ingresos');
            const totalGastosEl = document.getElementById('total-gastos');
            const balanceEl = document.getElementById('balance-total');
            const estadoBalance = document.getElementById('estado-balance');

            if (totalIngresosEl) totalIngresosEl.textContent = `$${ingresosAno.toFixed(2)}`;
            if (totalGastosEl) totalGastosEl.textContent = `$${gastosAno.toFixed(2)}`;
            if (balanceEl) balanceEl.textContent = `$${balanceAno.toFixed(2)}`;

            if (estadoBalance) {
                if (balanceAno > 0) {
                    estadoBalance.textContent = 'Superávit';
                    estadoBalance.style.color = '#27ae60';
                } else if (balanceAno < 0) {
                    estadoBalance.textContent = 'Déficit';
                    estadoBalance.style.color = '#e74c3c';
                } else {
                    estadoBalance.textContent = 'Equilibrado';
                    estadoBalance.style.color = '#f39c12';
                }
            }
        } catch (err) {
            console.error('Error cargarResumen', err);
        }
    }

    async cargarTransaccionesRecientes() {
        try {
            const transacciones = await obtenerTodos(STORES.MOVIMIENTOS);
            const categorias = await obtenerTodos(STORES.CATEGORIAS);

            transacciones.sort((a,b) => {
                if (a.creado && b.creado) return b.creado - a.creado;
                return new Date(b.fecha) - new Date(a.fecha);
            });

            const lista = document.getElementById('lista-transacciones-recientes');
            if (!lista) return;

            const recientes = transacciones.slice(0,5);
            if (recientes.length === 0) {
                lista.innerHTML = `<div class="estado-vacio"><p>No hay transacciones registradas</p><a href="#transacciones" class="btn-pequeno">Agregar transacción</a></div>`;
                return;
            }

            lista.innerHTML = recientes.map(trans => {
                const cat = categorias.find(c => c.id === trans.categoria);
                const fecha = trans.fecha ? new Date(trans.fecha).toLocaleDateString('es-ES') : '-';
                const color = trans.tipo === 'ingreso' ? '#27ae60' : '#e74c3c';
                const simbolo = trans.tipo === 'ingreso' ? '+' : '-';
                return `<div class="item-transaccion">
                    <span class="trans-descripcion">${trans.descripcion || 'Sin descripción'}</span>
                    <span class="trans-categoria">${cat ? cat.nombre : 'Sin categoría'}</span>
                    <span class="trans-monto" style="color:${color}">${simbolo}$${trans.monto.toFixed(2)}</span>
                    <span class="trans-fecha">${fecha}</span>
                </div>`;
            }).join('');
        } catch (err) {
            console.error('Error cargarTransaccionesRecientes', err);
        }
    }

    async cargarPresupuestosDashboard() {
        try {
            const presupuestos = await obtenerTodos(STORES.PRESUPUESTOS);
        } catch(err) {
            console.error('Error cargarPresupuestosDashboard', err);
        }
    }

    async inicializarGraficos() {
        const mesActual = new Date().getMonth() + 1;
        const anoActual = new Date().getFullYear();

        await this.crearGraficoGastos(mesActual);
        await this.crearGraficoEvolucion(anoActual);
        await this.crearGraficoComparativa(mesActual);
        await this.crearGraficoBalance(mesActual);
    }

    async crearGraficoGastos(mes) {
        try {
            const transacciones = await obtenerTodos(STORES.MOVIMIENTOS);
            const categorias = await obtenerTodos(STORES.CATEGORIAS);
            const anoActual = new Date().getFullYear();

            const gastosPorCategoria = {};
            categorias.forEach(cat => {
                if (cat.tipo === 'gasto') {
                    gastosPorCategoria[cat.id] = { nombre: cat.nombre, color: cat.color || '#ccc', total: 0 };
                }
            });

            transacciones.forEach(t => {
                if (t.tipo !== 'gasto' || !t.fecha) return;
                const [y,m,d] = t.fecha.split('-');
                const fecha = new Date(Number(y), Number(m)-1, Number(d));
                const mesTrans = fecha.getMonth() + 1;
                const anoTrans = fecha.getFullYear();
                if (anoTrans !== anoActual) return;
                if (mes === 'acumulado' || mes === 'ac' || mes === 'all') {
                    if (gastosPorCategoria[t.categoria]) gastosPorCategoria[t.categoria].total += t.monto;
                } else {
                    if (Number(mes) === mesTrans) {
                        if (gastosPorCategoria[t.categoria]) gastosPorCategoria[t.categoria].total += t.monto;
                    }
                }
            });

            const categoriasConGastos = Object.values(gastosPorCategoria).filter(c => c.total > 0);
            const canvas = document.getElementById('grafico-gastos');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');

            if (this.graficoGastos) this.graficoGastos.destroy();

            if (categoriasConGastos.length === 0) {
                ctx.clearRect(0,0,canvas.width, canvas.height);
                ctx.font = '14px Arial';
                ctx.fillStyle = '#95a5a6';
                ctx.textAlign = 'center';
                ctx.fillText('No hay gastos para este período', canvas.width/2, canvas.height/2);
                return;
            }

            this.graficoGastos = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: categoriasConGastos.map(c => c.nombre),
                    datasets: [{
                        data: categoriasConGastos.map(c => c.total),
                        backgroundColor: categoriasConGastos.map(c => c.color),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' },
                        tooltip: {
                            callbacks: {
                                label(ctx) {
                                    const label = ctx.label || '';
                                    const value = ctx.raw || 0;
                                    const total = ctx.dataset.data.reduce((a,b)=>a+b,0);
                                    const pct = Math.round((value/total)*100);
                                    return `${label}: $${value.toFixed(2)} (${pct}%)`;
                                }
                            }
                        }
                    }
                }
            });

        } catch (err) {
            console.error('Error crearGraficoGastos', err);
        }
    }

    async crearGraficoEvolucion(ano) {
        try {
            const transacciones = await obtenerTodos(STORES.MOVIMIENTOS);
            const balancesMensuales = Array(12).fill(0);

            for (let mes = 0; mes < 12; mes++) {
                let ingresos = 0, gastos = 0;
                transacciones.forEach(t => {
                    if (!t.fecha) return;
                    const fecha = new Date(...t.fecha.split('-').map((v,i)=> i===0?Number(v):Number(v)-1));
                    if (fecha.getFullYear() !== ano) return;
                    if (fecha.getMonth() === mes) {
                        if (t.tipo === 'ingreso') ingresos += t.monto;
                        else gastos += t.monto;
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
                data: { labels: meses, datasets: [{ label: 'Balance Mensual', data: balancesMensuales, borderColor: '#3498db', backgroundColor: 'rgba(52,152,219,0.1)', tension:0.3 }]},
                options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom'}}, scales:{ y:{ beginAtZero:true, ticks:{ callback: v => `$${v}`}}}}
            });

        } catch (err) {
            console.error('Error crearGraficoEvolucion', err);
        }
    }

    async crearGraficoComparativa(mes) {
        try {
            const transacciones = await obtenerTodos(STORES.MOVIMIENTOS);
            const anoActual = new Date().getFullYear();
            let ingresos = 0, gastos = 0;
            transacciones.forEach(t => {
                if (!t.fecha) return;
                const [y,m,d] = t.fecha.split('-');
                const fecha = new Date(Number(y), Number(m)-1, Number(d));
                if (fecha.getFullYear() !== anoActual) return;
                if (fecha.getMonth() + 1 === Number(mes)) {
                    if (t.tipo === 'ingreso') ingresos += t.monto;
                    else gastos += t.monto;
                }
            });

            const canvas = document.getElementById('grafico-comparativa');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (this.graficoComparativa) this.graficoComparativa.destroy();

            this.graficoComparativa = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Ingresos vs Gastos'],
                    datasets: [
                        { label:'Ingresos', data:[ingresos], backgroundColor:'#27ae60' },
                        { label:'Gastos', data:[gastos], backgroundColor:'#e74c3c' }
                    ]
                },
                options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom'}}, scales:{ y:{ beginAtZero:true, ticks:{ callback: v => `$${v}`}}}}
            });

        } catch (err) {
            console.error('Error crearGraficoComparativa', err);
        }
    }

    async crearGraficoBalance(mes) {
        try {
            const transacciones = await obtenerTodos(STORES.MOVIMIENTOS);
            const presupuestos = await obtenerTodos(STORES.PRESUPUESTOS);
            const categorias = await obtenerTodos(STORES.CATEGORIAS);
            const anoActual = new Date().getFullYear();

            let ingresosReales = 0, gastosReales = 0, gastosEstimados = 0;

            transacciones.forEach(t => {
                if (!t.fecha) return;
                const [y,m,d] = t.fecha.split('-');
                const fecha = new Date(Number(y), Number(m)-1, Number(d));
                if (fecha.getFullYear() !== anoActual) return;
                if (fecha.getMonth()+1 === Number(m)) {
                    if (t.tipo === 'ingreso') ingresosReales += t.monto;
                    else gastosReales += t.monto;
                }
            });

            presupuestos.forEach(p => {
                if (p.mes === Number(m) && p.ano === anoActual) {
                    const cat = categorias.find(c => c.id === p.categoria);
                    if (cat && cat.tipo === 'gasto') gastosEstimados += p.monto;
                }
            });

            const balanceReal = ingresosReales - gastosReales;
            const balanceEstimado = ingresosReales - gastosEstimados;

            const canvas = document.getElementById('grafico-balance');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (this.graficoBalance) this.graficoBalance.destroy();

            this.graficoBalance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Balance'],
                    datasets: [
                        { label:'Real', data:[balanceReal], backgroundColor:'#27ae60' },
                        { label:'Estimado', data:[balanceEstimado], backgroundColor:'#3498db' }
                    ]
                },
                options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom'}}, scales:{ y:{ beginAtZero:true, ticks:{ callback: v => `$${v}`}}}}
            });

        } catch (err) {
            console.error('Error crearGraficoBalance', err);
        }
    }

    async actualizarDashboard() {
        await this.cargarResumen();
        await this.cargarTransaccionesRecientes();
        await this.cargarPresupuestosDashboard();

        const mesActual = new Date().getMonth() + 1;
        await this.crearGraficoGastos(mesActual);
        await this.crearGraficoBalance(mesActual);
        await this.crearGraficoComparativa(mesActual);
    }
}

window.dashboardInstance = new DashboardComponent();

document.addEventListener('db-ready', async () => {
    await window.dashboardInstance.init();
});

document.addEventListener('movimientos-actualizados', () => {
    window.dashboardInstance?.actualizarDashboard();
});
document.addEventListener('categorias-actualizadas', () => {
    window.dashboardInstance?.actualizarDashboard();
});
document.addEventListener('presupuestos-actualizados', () => {
    window.dashboardInstance?.actualizarDashboard();
});

// Categorías y filtros
document.addEventListener('db-ready', async () => {
    await cargarCategorias();
    configurarFiltrosCategorias();
});

document.addEventListener("categorias-actualizadas", async () => {
    await cargarCategorias();
});

async function cargarCategorias() {
    const categorias = await obtenerTodos(STORES.CATEGORIAS);
    const lista = document.getElementById('lista-categorias');
    if (!lista) return;
    lista.innerHTML = '';
    const predefinidas = ['Alimentacion', 'Transporte', 'Ocio', 'Servicios', 'Salud', 'Educacion', 'Otros'];
    categorias.forEach(cat => {
        const li = document.createElement('li');
        li.className = 'item-categoria';
        li.style.borderLeftColor = cat.color;
        li.innerHTML = `
            <div class="item-categoria-info">
                <div class="item-categoria-color" style="background-color:${cat.color}"></div>
                <div>
                    <div class="item-categoria-nombre">${cat.nombre}</div>
                    <div class="item-categoria-tipo">${cat.tipo}</div>
                </div>
            </div>
            <button class="boton boton-eliminar" onclick="eliminarCategoria(${cat.id})"
                ${predefinidas.includes(cat.nombre) ? 'disabled style="opacity:0.5; cursor:not-allowed"' : ''}>
                Eliminar
            </button>
        `;
        lista.appendChild(li);
    });
}

async function agregarCategoria(cat) {
    await agregarItem(STORES.CATEGORIAS, cat);
    document.dispatchEvent(new Event("categorias-actualizadas"));
}

async function eliminarCategoria(id) {
    if (!confirm("¿Deseas eliminar esta categoría?")) return;
    await eliminarItem(STORES.CATEGORIAS, id);
    document.dispatchEvent(new Event("categorias-actualizadas"));
}

function configurarFiltrosCategorias() {
    const filtros = document.querySelectorAll('.filtro');
    filtros.forEach(filtro => {
        filtro.addEventListener('click', async (e) => {
            filtros.forEach(f => f.classList.remove('activo'));
            e.target.classList.add('activo');
            await cargarCategorias();
        });
    });
                }
