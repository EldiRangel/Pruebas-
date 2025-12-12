// js/movimientos.js
// Depende de js/db.js (STORES, helpers CRUD)
document.addEventListener('db-ready', async () => {
    await cargarCategoriasFiltro();
    configurarBotonesModal();
    configurarFormularioTransaccion();
    await listarMovimientos();
    configurarFiltros();
});

// carga categorías en selects (modal y filtro)
async function cargarCategoriasFiltro() {
    const categorias = await obtenerTodos(STORES.CATEGORIAS);
    const selectModal = document.getElementById('categoria-mov');
    const filtroCat = document.getElementById('filtro-categoria');

    if (selectModal) {
        selectModal.innerHTML = '';
        // si no hay categorias, agregar placeholder
        if (!categorias || categorias.length === 0) {
            const op = document.createElement('option');
            op.value = '';
            op.textContent = '— Sin categorías —';
            selectModal.appendChild(op);
        } else {
            categorias.forEach(cat => {
                const op = document.createElement('option');
                op.value = cat.id;
                op.textContent = cat.nombre;
                selectModal.appendChild(op);
            });
        }
    }

    if (filtroCat) {
        filtroCat.innerHTML = `<option value="todas">Todas las categorías</option>`;
        categorias.forEach(cat => {
            const op = document.createElement('option');
            op.value = cat.id;
            op.textContent = cat.nombre;
            filtroCat.appendChild(op);
        });
    }

    // notifica para que otros módulos actualicen si necesitan
    document.dispatchEvent(new Event('categorias-actualizadas'));
}

// modal abrir/cerrar y boton nuevo movimiento
function configurarBotonesModal() {
    const btnNuevo = document.getElementById('btn-nuevo-mov'); // botón en pestaña movimientos
    const btnPanel = document.getElementById('btn-nueva-transaccion'); // botón rápido en panel
    const modal = document.getElementById('modal-transaccion');
    const cerrar = document.getElementById('cerrar-modal');

    if (btnNuevo) btnNuevo.addEventListener('click', () => abrirModalTransaccion());
    if (btnPanel) {
        btnPanel.addEventListener('click', () => {
            // abrir sección transacciones (navegacion.js maneja navegación)
            const event = new Event('abrir-transacciones');
            document.dispatchEvent(event);
            // abrir modal con pequeño delay para que la sección esté visible
            setTimeout(() => abrirModalTransaccion(), 180);
        });
    }

    if (cerrar) cerrar.addEventListener('click', cerrarModalTransaccion);
    if (modal) {
        modal.querySelector('.modal-overlay')?.addEventListener('click', cerrarModalTransaccion);
    }
}

function abrirModalTransaccion(trans = null) {
    const modal = document.getElementById('modal-transaccion');
    if (!modal) return;
    // limpiar y preparar formulario
    const form = document.getElementById('form-transaccion');
    form.reset();
    delete form.dataset.editando;

    // default fecha hoy
    const fechaInput = document.getElementById('fecha-mov');
    if (fechaInput) {
        const hoy = new Date();
        fechaInput.value = hoy.toISOString().slice(0,10);
    }

    // si viene para editar
    if (trans) {
        document.getElementById('tipo-mov').value = trans.tipo || 'gasto';
        document.getElementById('monto-mov').value = trans.monto;
        document.getElementById('fecha-mov').value = trans.fecha;
        document.getElementById('categoria-mov').value = trans.categoria;
        document.getElementById('descripcion-mov').value = trans.descripcion || '';
        form.dataset.editando = trans.id;
    }

    // cargar categorias antes de mostrar (por si se crearon recientemente)
    cargarCategoriasFiltro().then(() => {
        modal.classList.remove('modal-oculto');
        // focus en monto
        setTimeout(() => {
            const m = document.getElementById('monto-mov');
            if (m) m.focus();
        }, 120);
    });
}

function cerrarModalTransaccion() {
    const modal = document.getElementById('modal-transaccion');
    if (!modal) return;
    modal.classList.add('modal-oculto');
    const form = document.getElementById('form-transaccion');
    if (form) form.reset();
}

// formulario submit: crear o editar movimiento
function configurarFormularioTransaccion() {
    const form = document.getElementById('form-transaccion');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const tipo = document.getElementById('tipo-mov').value;
        const montoRaw = document.getElementById('monto-mov').value;
        const monto = parseFloat(montoRaw);
        const fecha = document.getElementById('fecha-mov').value;
        const categoria = parseInt(document.getElementById('categoria-mov').value) || null;
        const descripcion = document.getElementById('descripcion-mov').value.trim();

        if (!tipo || !monto || !fecha || !categoria) {
            alert('Complete todos los campos obligatorios (tipo, monto, fecha, categoría).');
            return;
        }

        const nuevo = {
            tipo,
            monto,
            fecha, // formato YYYY-MM-DD
            categoria,
            descripcion,
            creado: Date.now()
        };

        try {
            const editId = form.dataset.editando;
            if (editId) {
                nuevo.id = parseInt(editId);
                // conservar campo creado si existe
                const existente = await obtenerPorId(STORES.MOVIMIENTOS, nuevo.id);
                if (existente && existente.creado) nuevo.creado = existente.creado;
                await actualizarItem(STORES.MOVIMIENTOS, nuevo);
            } else {
                await agregarItem(STORES.MOVIMIENTOS, nuevo);
            }

            cerrarModalTransaccion();
            await listarMovimientos();
            document.dispatchEvent(new Event('movimientos-actualizados'));
        } catch (err) {
            console.error('Error guardando movimiento', err);
            alert('Ocurrió un error al guardar el movimiento.');
        }
    });
}

// listar movimientos en la UI principal (pestaña transacciones)
async function listarMovimientos() {
    const lista = document.getElementById('lista-movimientos');
    const movVacio = document.getElementById('mov-vacio');

    if (!lista) return;

    const transacciones = await obtenerTodos(STORES.MOVIMIENTOS);
    const categorias = await obtenerTodos(STORES.CATEGORIAS);

    if (!transacciones || transacciones.length === 0) {
        lista.innerHTML = '';
        if (movVacio) movVacio.style.display = 'block';
        return;
    }
    if (movVacio) movVacio.style.display = 'none';

    // ordenar por fecha descendente
    transacciones.sort((a,b) => {
        if (a.creado && b.creado) return b.creado - a.creado;
        return new Date(b.fecha) - new Date(a.fecha);
    });

    lista.innerHTML = '';
    transacciones.forEach(t => {
        const cat = categorias.find(c => c.id === t.categoria);
        const li = document.createElement('li');
        li.className = 'item-lista';
        li.style.display = 'grid';
        li.style.gridTemplateColumns = '1fr 1fr 1fr 1fr 1fr 100px';
        li.style.alignItems = 'center';
        li.style.gap = '8px';

        const fechaTexto = t.fecha ? new Date(t.fecha).toLocaleDateString('es-ES') : '-';
        const tipoTexto = t.tipo === 'ingreso' ? 'Ingreso' : 'Gasto';
        const montoTexto = `$${t.monto.toFixed(2)}`;

        li.innerHTML = `
            <span>${tipoTexto}</span>
            <span>${cat ? cat.nombre : 'Sin categoría'}</span>
            <span>${montoTexto}</span>
            <span>${fechaTexto}</span>
            <span title="${t.descripcion || ''}">${t.descripcion ? (t.descripcion.length > 30 ? t.descripcion.slice(0,30) + '…' : t.descripcion) : ''}</span>
            <span style="display:flex; gap:6px;">
                <button class="boton-chico" data-edit="${t.id}">Editar</button>
                <button class="boton-chico boton-eliminar" data-del="${t.id}">X</button>
            </span>
        `;

        lista.appendChild(li);

        // editar
        li.querySelector('[data-edit]')?.addEventListener('click', async () => {
            const id = parseInt(li.querySelector('[data-edit]').getAttribute('data-edit'));
            const trans = await obtenerPorId(STORES.MOVIMIENTOS, id);
            abrirModalTransaccion(trans);
        });

        // eliminar
        li.querySelector('[data-del]')?.addEventListener('click', async () => {
            const id = parseInt(li.querySelector('[data-del]').getAttribute('data-del'));
            if (!confirm('Eliminar movimiento?')) return;
            try {
                await eliminarItem(STORES.MOVIMIENTOS, id);
                await listarMovimientos();
                document.dispatchEvent(new Event('movimientos-actualizados'));
            } catch (err) {
                console.error('Error eliminando movimiento', err);
                alert('No se pudo eliminar el movimiento.');
            }
        });
    });
}

// filtros básicos (tipo, categoria, búsqueda)
function configurarFiltros() {
    const filtroTipo = document.getElementById('filtro-tipo');
    const filtroCat = document.getElementById('filtro-categoria');
    const buscar = document.getElementById('buscar-mov');

    if (filtroTipo) filtroTipo.addEventListener('change', aplicarFiltros);
    if (filtroCat) filtroCat.addEventListener('change', aplicarFiltros);
    if (buscar) buscar.addEventListener('input', aplicarFiltros);
}

let ultimoFiltroTimeout = null;
async function aplicarFiltros() {
    // debounce mínimo
    if (ultimoFiltroTimeout) clearTimeout(ultimoFiltroTimeout);
    ultimoFiltroTimeout = setTimeout(async () => {
        const filtroTipo = document.getElementById('filtro-tipo')?.value || 'todos';
        const filtroCat = document.getElementById('filtro-categoria')?.value || 'todas';
        const buscar = (document.getElementById('buscar-mov')?.value || '').toLowerCase();

        const transacciones = await obtenerTodos(STORES.MOVIMIENTOS);
        const categorias = await obtenerTodos(STORES.CATEGORIAS);

        let filtradas = transacciones.slice();

        if (filtroTipo !== 'todos') {
            filtradas = filtradas.filter(t => t.tipo === filtroTipo);
        }

        if (filtroCat !== 'todas') {
            const catId = parseInt(filtroCat);
            filtradas = filtradas.filter(t => t.categoria === catId);
        }

        if (buscar) {
            filtradas = filtradas.filter(t => (t.descripcion || '').toLowerCase().includes(buscar));
        }

        // renderizar lista usando filtradas
        const lista = document.getElementById('lista-movimientos');
        const movVacio = document.getElementById('mov-vacio');
        if (!lista) return;

        if (!filtradas || filtradas.length === 0) {
            lista.innerHTML = '';
            if (movVacio) movVacio.style.display = 'block';
            return;
        }
        if (movVacio) movVacio.style.display = 'none';

        filtradas.sort((a,b) => {
            if (a.creado && b.creado) return b.creado - a.creado;
            return new Date(b.fecha) - new Date(a.fecha);
        });

        lista.innerHTML = '';
        filtradas.forEach(t => {
            const cat = categorias.find(c => c.id === t.categoria);
            const li = document.createElement('li');
            li.className = 'item-lista';
            li.style.display = 'grid';
            li.style.gridTemplateColumns = '1fr 1fr 1fr 1fr 1fr 100px';
            li.style.alignItems = 'center';
            li.style.gap = '8px';

            const fechaTexto = t.fecha ? new Date(t.fecha).toLocaleDateString('es-ES') : '-';
            const tipoTexto = t.tipo === 'ingreso' ? 'Ingreso' : 'Gasto';
            const montoTexto = `$${t.monto.toFixed(2)}`;

            li.innerHTML = `
                <span>${tipoTexto}</span>
                <span>${cat ? cat.nombre : 'Sin categoría'}</span>
                <span>${montoTexto}</span>
                <span>${fechaTexto}</span>
                <span title="${t.descripcion || ''}">${t.descripcion ? (t.descripcion.length > 30 ? t.descripcion.slice(0,30) + '…' : t.descripcion) : ''}</span>
                <span style="display:flex; gap:6px;">
                    <button class="boton-chico" data-edit="${t.id}">Editar</button>
                    <button class="boton-chico boton-eliminar" data-del="${t.id}">X</button>
                </span>
            `;

            lista.appendChild(li);

            li.querySelector('[data-edit]')?.addEventListener('click', async () => {
                const id = parseInt(li.querySelector('[data-edit]').getAttribute('data-edit'));
                const trans = await obtenerPorId(STORES.MOVIMIENTOS, id);
                abrirModalTransaccion(trans);
            });

            li.querySelector('[data-del]')?.addEventListener('click', async () => {
                const id = parseInt(li.querySelector('[data-del]').getAttribute('data-del'));
                if (!confirm('Eliminar movimiento?')) return;
                try {
                    await eliminarItem(STORES.MOVIMIENTOS, id);
                    await listarMovimientos();
                    document.dispatchEvent(new Event('movimientos-actualizados'));
                } catch (err) {
                    console.error('Error eliminando movimiento', err);
                    alert('No se pudo eliminar el movimiento.');
                }
            });
        });

    }, 120);
                                   }
