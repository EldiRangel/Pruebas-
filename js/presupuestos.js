// js/presupuestos.js
document.addEventListener('db-ready', async () => {
    await inicializarPresupuestos();
});

document.addEventListener("categorias-actualizadas", async () => {
    await cargarSelectCategoriasPresupuesto();
    await cargarPresupuestosUI();
});

document.addEventListener("movimientos-actualizados", async () => {
    await cargarPresupuestosUI();
});

async function inicializarPresupuestos() {
    await cargarSelectCategoriasPresupuesto();
    configurarBotonesPres();
    await cargarPresupuestosUI();
}

async function cargarSelectCategoriasPresupuesto() {
    const categorias = await obtenerTodos(STORES.CATEGORIAS);
    const select = document.getElementById('pres-categoria');
    if (!select) return;
    select.innerHTML = '';
    categorias.filter(c => c.tipo === 'gasto').forEach(cat => {
        const op = document.createElement('option');
        op.value = cat.id;
        op.textContent = cat.nombre;
        select.appendChild(op);
    });
}

function configurarBotonesPres() {
    const btnNuevo = document.getElementById('btn-nuevo-pres');
    if (btnNuevo) btnNuevo.addEventListener('click', abrirModalPres);
    const cerrar = document.getElementById('cerrar-modal-pres');
    if (cerrar) cerrar.addEventListener('click', cerrarModalPres);
    const overlay = document.querySelector('#modal-presupuesto .modal-overlay');
    if (overlay) overlay.addEventListener('click', cerrarModalPres);
    const form = document.getElementById('form-presupuesto');
    if (form) form.addEventListener('submit', guardarPresupuestoForm);
}

function abrirModalPres() {
    const form = document.getElementById('form-presupuesto');
    if (!form) return;
    form.reset();
    form.dataset.editando = '';
    document.getElementById('modal-presupuesto').classList.remove('modal-oculto');
}

function cerrarModalPres() {
    document.getElementById('modal-presupuesto').classList.add('modal-oculto');
}

async function guardarPresupuestoForm(e) {
    if (e) e.preventDefault();
    const form = document.getElementById('form-presupuesto');
    const categoria = parseInt(document.getElementById('pres-categoria').value);
    const mes = parseInt(document.getElementById('pres-mes').value);
    const monto = parseFloat(document.getElementById('pres-monto').value) || 0;
    const editId = form.dataset.editando;
    const pres = { categoria, mes, monto };
    try {
        if (editId) {
            pres.id = parseInt(editId);
            await actualizarItem(STORES.PRESUPUESTOS, pres);
        } else {
            await agregarItem(STORES.PRESUPUESTOS, pres);
        }
        cerrarModalPres();
        await cargarPresupuestosUI();
        document.dispatchEvent(new Event("presupuestos-actualizados"));
    } catch (err) {
        console.error(err);
        alert('Error guardando presupuesto');
    }
}

async function cargarPresupuestosUI() {
    const lista = document.getElementById('lista-presupuestos');
    const vacio = document.getElementById('pres-vacio');
    if (!lista) return;
    const presupuestos = await obtenerTodos(STORES.PRESUPUESTOS);
    const categorias = await obtenerTodos(STORES.CATEGORIAS);
    const transacciones = await obtenerTodos(STORES.MOVIMIENTOS);

    lista.innerHTML = '';
    if (!presupuestos || presupuestos.length === 0) {
        if (vacio) vacio.style.display = 'block';
        return;
    }
    if (vacio) vacio.style.display = 'none';

    // mostrar cada presupuesto con lo gastado en ese mes
    presupuestos.forEach(p => {
        const cat = categorias.find(c => c.id === p.categoria);
        const gastoMes = transacciones
            .filter(t => t.tipo === 'gasto' && t.categoria === p.categoria && (new Date(t.fecha).getMonth() + 1) === p.mes)
            .reduce((acc, t) => acc + t.monto, 0);
        const li = document.createElement('li');
        li.className = 'item-lista';
        li.style.gridTemplateColumns = "1fr 1fr 1fr 1fr 100px";
        const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        li.innerHTML = `
            <span style="color:${cat ? cat.color : '#999'}">${cat ? cat.nombre : 'Sin categoría'}</span>
            <span>${meses[(p.mes - 1)] || p.mes}</span>
            <span>$${p.monto.toFixed(2)}</span>
            <span>$${gastoMes.toFixed(2)}</span>
            <span style="display:flex; gap:6px;">
                <button class="boton-chico" onclick="editarPresupuesto(${p.id})">Editar</button>
                <button class="boton-chico boton-eliminar" onclick="borrarPresupuesto(${p.id})">X</button>
            </span>
        `;
        lista.appendChild(li);
    });
}

async function editarPresupuesto(id) {
    const pres = await obtenerPorId(STORES.PRESUPUESTOS, id);
    if (!pres) return;
    const form = document.getElementById('form-presupuesto');
    form.dataset.editando = id;
    document.getElementById('pres-categoria').value = pres.categoria;
    document.getElementById('pres-mes').value = pres.mes;
    document.getElementById('pres-monto').value = pres.monto;
    document.getElementById('modal-presupuesto').classList.remove('modal-oculto');
}

async function borrarPresupuesto(id) {
    if (!confirm('Eliminar presupuesto?')) return;
    await eliminarItem(STORES.PRESUPUESTOS, id);
    await cargarPresupuestosUI();
    document.dispatchEvent(new Event("presupuestos-actualizados"));
                                        }
