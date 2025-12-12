// js/presupuestos.js
document.addEventListener('db-ready', async () => {
    await configurarFormularioPresupuesto();
    await cargarPresupuestos();
    await cargarCategoriasEnPresupuesto();
    configurarBotonesPresupuesto();
});

async function cargarCategoriasEnPresupuesto() {
    const categorias = await obtenerTodos(STORES.CATEGORIAS);
    const select = document.getElementById('categoria-pres');
    const filtroCat = document.getElementById('filtro-categoria');

    if (select) {
        select.innerHTML = '';
        categorias.forEach(cat => {
            const op = document.createElement('option');
            op.value = cat.id;
            op.textContent = cat.nombre;
            select.appendChild(op);
        });
    }

    if (filtroCat) {
        // refill filtro-categoria de movimientos si existe
        filtroCat.innerHTML = `<option value="todas">Todas las categorías</option>`;
        categorias.forEach(cat => {
            const op = document.createElement('option');
            op.value = cat.id;
            op.textContent = cat.nombre;
            filtroCat.appendChild(op);
        });
    }
}

// configurar botones abrir/cerrar modal
function configurarBotonesPresupuesto() {
    const btnNuevo = document.getElementById('btn-nuevo-presupuesto');
    const modal = document.getElementById('modal-presupuesto');
    const cerrar = document.getElementById('cerrar-modal-pres');

    if (btnNuevo) btnNuevo.addEventListener('click', () => abrirModalPresupuesto());
    if (cerrar) cerrar.addEventListener('click', cerrarModalPresupuesto);
    if (modal) {
        modal.querySelector('.modal-overlay').addEventListener('click', cerrarModalPresupuesto);
    }
}

function abrirModalPresupuesto(pres = null) {
    const form = document.getElementById('form-presupuesto');
    form.reset();
    // default año actual
    const anoInput = document.getElementById('ano-pres');
    if (anoInput && !anoInput.value) anoInput.value = new Date().getFullYear();

    if (pres) {
        // edición
        document.getElementById('categoria-pres').value = pres.categoria;
        document.getElementById('monto-pres').value = pres.monto;
        document.getElementById('mes-pres').value = pres.mes;
        document.getElementById('ano-pres').value = pres.ano;
        form.dataset.editando = pres.id;
    } else {
        form.dataset.editando = '';
    }

    document.getElementById('modal-presupuesto').classList.remove('modal-oculto');
}

function cerrarModalPresupuesto() {
    document.getElementById('modal-presupuesto').classList.add('modal-oculto');
}

// formulario crear/editar
async function configurarFormularioPresupuesto() {
    const form = document.getElementById('form-presupuesto');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const categoria = parseInt(document.getElementById('categoria-pres').value);
        const monto = parseFloat(document.getElementById('monto-pres').value);
        const mes = parseInt(document.getElementById('mes-pres').value);
        const ano = parseInt(document.getElementById('ano-pres').value);

        if (!categoria || !monto || !mes || !ano) {
            alert('Complete todos los campos del presupuesto');
            return;
        }

        const presupuesto = { categoria, monto, mes, ano };

        const editId = form.dataset.editando;

        try {
            if (editId) {
                presupuesto.id = parseInt(editId);
                await actualizarItem(STORES.PRESUPUESTOS, presupuesto);
            } else {
                await agregarItem(STORES.PRESUPUESTOS, presupuesto);
            }

            cerrarModalPresupuesto();
            await cargarPresupuestos();
            document.dispatchEvent(new Event('presupuestos-actualizados'));
            alert('Presupuesto guardado');
        } catch (err) {
            console.error('Error guardando presupuesto', err);
            alert('Error al guardar presupuesto');
        }
    });
}

// listar presupuestos en la UI
async function cargarPresupuestos() {
    const lista = document.getElementById('lista-presupuestos');
    const vacio = document.getElementById('pres-vacio');

    const presupuestos = await obtenerTodos(STORES.PRESUPUESTOS);
    const categorias = await obtenerTodos(STORES.CATEGORIAS);

    lista.innerHTML = '';

    if (!presupuestos || presupuestos.length === 0) {
        if (vacio) vacio.style.display = 'block';
        return;
    }

    if (vacio) vacio.style.display = 'none';

    // ordenar por año, mes
    presupuestos.sort((a,b) => {
        if (a.ano !== b.ano) return b.ano - a.ano;
        return b.mes - a.mes;
    });

    presupuestos.forEach(pres => {
        const cat = categorias.find(c => c.id === pres.categoria);
        const li = document.createElement('li');
        li.className = 'item-lista';
        li.style.display = 'grid';
        li.style.gridTemplateColumns = '1fr 1fr 1fr 100px';
        li.style.alignItems = 'center';
        li.style.gap = '8px';
        const mesNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        li.innerHTML = `
            <span>${cat ? cat.nombre : 'Sin categoría'}</span>
            <span>${mesNames[pres.mes - 1]} / ${pres.ano}</span>
            <span>$${pres.monto.toFixed(2)}</span>
            <span style="display:flex; gap:6px;">
                <button class="boton-chico" data-edit="${pres.id}">Editar</button>
                <button class="boton-chico boton-eliminar" data-del="${pres.id}">X</button>
            </span>
        `;

        lista.appendChild(li);

        // listeners
        li.querySelector('[data-edit]')?.addEventListener('click', async (e) => {
            abrirEdicionPresupuesto(pres.id);
        });

        li.querySelector('[data-del]')?.addEventListener('click', async (e) => {
            if (!confirm('Eliminar este presupuesto?')) return;
            await eliminarItem(STORES.PRESUPUESTOS, pres.id);
            await cargarPresupuestos();
            document.dispatchEvent(new Event('presupuestos-actualizados'));
        });
    });
}

async function abrirEdicionPresupuesto(id) {
    const pres = await obtenerPorId(STORES.PRESUPUESTOS, id);
    if (!pres) return;
    // abrir modal en modo edición
    await cargarCategoriasEnPresupuesto();
    abrirModalPresupuesto(pres);
}
