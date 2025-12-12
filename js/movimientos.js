// js/movimientos.js
document.addEventListener('db-ready', async () => {
    await cargarCategoriasFiltro();
    await cargarCategoriasEnModal();
    await cargarMovimientos();
    configurarBotones();
    configurarFiltros();
    configurarFormularioMov();
});
document.addEventListener("categorias-actualizadas", async () => {
    await cargarCategoriasEnModal();
    await cargarCategoriasFiltro();
});

async function cargarCategoriasFiltro() {
    const categorias = await obtenerTodos(STORES.CATEGORIAS);
    const filtro = document.getElementById("filtro-categoria");
    if (!filtro) return;
    filtro.innerHTML = `<option value="todas">Todas las categorías</option>`;
    categorias.forEach(cat => {
        const op = document.createElement("option");
        op.value = cat.id;
        op.textContent = cat.nombre;
        filtro.appendChild(op);
    });
}

async function cargarCategoriasEnModal() {
    const categorias = await obtenerTodos(STORES.CATEGORIAS);
    const select = document.getElementById("categoria-mov");
    if (!select) return;
    select.innerHTML = "";
    categorias.forEach(cat => {
        const op = document.createElement("option");
        op.value = cat.id;
        op.textContent = cat.nombre;
        select.appendChild(op);
    });
    // también actualizar select del panel de presupuestos si existe
    const selPres = document.getElementById("pres-categoria");
    if (selPres) {
        selPres.innerHTML = '';
        categorias.filter(c => c.tipo === 'gasto').forEach(cat => {
            const op = document.createElement("option");
            op.value = cat.id;
            op.textContent = cat.nombre;
            selPres.appendChild(op);
        });
    }
}

/* cargarMovimientos y demás se mantienen igual (mismo formato que ya usabas) */
async function cargarMovimientos() {
    const lista = document.getElementById("lista-movimientos");
    const vacio = document.getElementById("mov-vacio");
    if (!lista) return;
    const movimientos = await obtenerTodos(STORES.MOVIMIENTOS);
    const categorias = await obtenerTodos(STORES.CATEGORIAS);
    lista.innerHTML = "";
    if (movimientos.length === 0) {
        vacio.style.display = "block";
        return;
    }
    vacio.style.display = "none";
    movimientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    movimientos.forEach(mov => {
        const cat = categorias.find(c => c.id === mov.categoria) || null;
        const li = document.createElement("li");
        li.className = "item-lista";
        li.style.gridTemplateColumns = "1fr 1fr 1fr 1fr 1fr 100px";
        li.innerHTML = `
            <span style="color:${mov.tipo === 'ingreso' ? '#27ae60' : '#c0392b'};">
                ${mov.tipo.toUpperCase()}
            </span>
            <span>${cat ? cat.nombre : 'Sin categoría'}</span>
            <span>$${Number(mov.monto).toFixed(2)}</span>
            <span>${new Date(mov.fecha).toLocaleDateString('es-ES')}</span>
            <span>${mov.descripcion || '-'}</span>
            <span style="display:flex; gap:6px;">
                <button class="boton-chico" onclick="editarMovimiento(${mov.id})">Editar</button>
                <button class="boton-chico boton-eliminar" onclick="eliminarMovimiento(${mov.id})">X</button>
            </span>
        `;
        lista.appendChild(li);
    });
}

function configurarBotones() {
    const btn = document.getElementById("btn-nuevo-mov");
    if (btn) btn.addEventListener("click", abrirModalNuevo);
    const cerrar = document.getElementById("cerrar-modal");
    if (cerrar) cerrar.addEventListener("click", cerrarModal);
}

function abrirModalNuevo() {
    const form = document.getElementById("form-transaccion");
    if (!form) return;
    form.reset();
    form.dataset.editando = "";
    document.getElementById("modal-transaccion").classList.remove("modal-oculto");
}

async function editarMovimiento(id) {
    const mov = await obtenerPorId(STORES.MOVIMIENTOS, id);
    if (!mov) return;
    const form = document.getElementById("form-transaccion");
    form.dataset.editando = id;
    document.getElementById("tipo-mov").value = mov.tipo;
    document.getElementById("monto-mov").value = mov.monto;
    document.getElementById("fecha-mov").value = mov.fecha;
    document.getElementById("categoria-mov").value = mov.categoria;
    document.getElementById("descripcion-mov").value = mov.descripcion || "";
    document.getElementById("modal-transaccion").classList.remove("modal-oculto");
}

function cerrarModal() {
    document.getElementById("modal-transaccion").classList.add("modal-oculto");
}

function configurarFormularioMov() {
    const form = document.getElementById("form-transaccion");
    if (!form) return;
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const mov = {
            tipo: document.getElementById("tipo-mov").value,
            monto: parseFloat(document.getElementById("monto-mov").value) || 0,
            fecha: document.getElementById("fecha-mov").value,
            categoria: parseInt(document.getElementById("categoria-mov").value),
            descripcion: document.getElementById("descripcion-mov").value.trim()
        };
        const editId = form.dataset.editando;
        if (editId) {
            mov.id = parseInt(editId);
            await actualizarItem(STORES.MOVIMIENTOS, mov);
        } else {
            mov.creado = Date.now();
            await agregarItem(STORES.MOVIMIENTOS, mov);
        }
        cerrarModal();
        await cargarMovimientos();
        document.dispatchEvent(new Event("movimientos-actualizados"));
    });
}

async function eliminarMovimiento(id) {
    if (!confirm("¿Seguro que deseas eliminar este movimiento?")) return;
    await eliminarItem(STORES.MOVIMIENTOS, id);
    await cargarMovimientos();
    document.dispatchEvent(new Event("movimientos-actualizados"));
}

/* filtros */
function configurarFiltros() {
    const filtroTipo = document.getElementById("filtro-tipo");
    const filtroCat  = document.getElementById("filtro-categoria");
    const busqueda   = document.getElementById("buscar-mov");
    if (filtroTipo) filtroTipo.addEventListener("change", aplicarFiltros);
    if (filtroCat) filtroCat.addEventListener("change", aplicarFiltros);
    if (busqueda) busqueda.addEventListener("input", aplicarFiltros);
}

async function aplicarFiltros() {
    const movimientos = await obtenerTodos(STORES.MOVIMIENTOS);
    const categorias = await obtenerTodos(STORES.CATEGORIAS);
    const tipo = document.getElementById("filtro-tipo")?.value || 'todos';
    const cat = document.getElementById("filtro-categoria")?.value || 'todas';
    const busq = document.getElementById("buscar-mov")?.value.toLowerCase() || '';
    let filtrados = movimientos;
    if (tipo !== "todos") filtrados = filtrados.filter(m => m.tipo === tipo);
    if (cat !== "todas") filtrados = filtrados.filter(m => String(m.categoria) === String(cat));
    if (busq.trim() !== "") filtrados = filtrados.filter(m => (m.descripcion || "").toLowerCase().includes(busq));
    const lista = document.getElementById("lista-movimientos");
    const vacio = document.getElementById("mov-vacio");
    lista.innerHTML = "";
    if (filtrados.length === 0) { if (vacio) vacio.style.display = "block"; return; }
    if (vacio) vacio.style.display = "none";
    filtrados.sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
    filtrados.forEach(mov => {
        const catObj = categorias.find(c => c.id === mov.categoria);
        const li = document.createElement("li");
        li.className = "item-lista";
        li.style.gridTemplateColumns = "1fr 1fr 1fr 1fr 1fr 100px";
        li.innerHTML = `
            <span style="color:${mov.tipo === 'ingreso' ? '#27ae60' : '#c0392b'};">${mov.tipo.toUpperCase()}</span>
            <span>${catObj ? catObj.nombre : 'Sin categoría'}</span>
            <span>$${Number(mov.monto).toFixed(2)}</span>
            <span>${new Date(mov.fecha).toLocaleDateString('es-ES')}</span>
            <span>${mov.descripcion || '-'}</span>
            <span style="display:flex; gap:6px;">
                <button class="boton-chico" onclick="editarMovimiento(${mov.id})">Editar</button>
                <button class="boton-chico boton-eliminar" onclick="eliminarMovimiento(${mov.id})">X</button>
            </span>
        `;
        lista.appendChild(li);
    });
}
