document.addEventListener("db-ready", async () => {
    await cargarCategoriasEnFiltros();
    await cargarCategoriasEnModal();
    await cargarMovimientos();
    configurarEventosMovimientos();
});

/* ---------------------------------------------------
    Cargar categorías en los filtros de movimientos
---------------------------------------------------- */
async function cargarCategoriasEnFiltros() {
    const select = document.getElementById("filtro-categoria");
    if (!select) return;

    const categorias = await obtenerTodos(STORES.CATEGORIAS);

    select.innerHTML = `<option value="todas">Todas las categorías</option>`;

    categorias.forEach(cat => {
        const op = document.createElement("option");
        op.value = cat.id;
        op.textContent = cat.nombre;
        select.appendChild(op);
    });
}

/* ---------------------------------------------------
    Cargar categorías en el modal de nueva transacción
---------------------------------------------------- */
async function cargarCategoriasEnModal() {
    const select = document.getElementById("categoria-mov");
    if (!select) return;

    const categorias = await obtenerTodos(STORES.CATEGORIAS);

    select.innerHTML = "";

    categorias.forEach(cat => {
        const op = document.createElement("option");
        op.value = cat.id;
        op.textContent = cat.nombre;
        select.appendChild(op);
    });
}

/* ---------------------------------------------------
    Cargar lista de movimientos
---------------------------------------------------- */
async function cargarMovimientos() {
    const lista = document.getElementById("lista-movimientos");
    const vacio = document.getElementById("mov-vacio");
    if (!lista) return;

    let movimientos = await obtenerTodos(STORES.MOVIMIENTOS);
    const categorias = await obtenerTodos(STORES.CATEGORIAS);

    // FILTROS
    const tipoFiltro = document.getElementById("filtro-tipo").value;
    const catFiltro = document.getElementById("filtro-categoria").value;
    const busqueda = document.getElementById("buscar-mov").value.toLowerCase();

    movimientos = movimientos.filter(m => {
        const coincideTipo = tipoFiltro === "todos" || m.tipo === tipoFiltro;
        const coincideCategoria = catFiltro === "todas" || String(m.categoria) === String(catFiltro);
        const coincideBusqueda = m.descripcion?.toLowerCase().includes(busqueda);
        return coincideTipo && coincideCategoria && coincideBusqueda;
    });

    lista.innerHTML = "";

    if (movimientos.length === 0) {
        vacio.style.display = "block";
        return;
    }
    vacio.style.display = "none";

    movimientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    movimientos.forEach(mov => {
        const cat = categorias.find(c => c.id === mov.categoria);

        const li = document.createElement("li");
        li.className = "item-mov";

        li.innerHTML = `
            <span>${mov.tipo}</span>
            <span>${cat ? cat.nombre : "Sin categoría"}</span>
            <span>$${mov.monto.toFixed(2)}</span>
            <span>${mov.fecha}</span>
            <span>${mov.descripcion || "—"}</span>
            <span>
                <button class="boton-secundario editar" data-id="${mov.id}">Editar</button>
                <button class="boton eliminar" data-id="${mov.id}">Eliminar</button>
            </span>
        `;

        lista.appendChild(li);
    });
}

/* ---------------------------------------------------
    Eventos principales
---------------------------------------------------- */
function configurarEventosMovimientos() {
    // Abrir modal desde la sección de movimientos
    document.getElementById("btn-nuevo-mov").addEventListener("click", () => {
        abrirModalMovimiento();
    });

    // Botón agregar movimiento desde dashboard (envía a la sección)
    const btnDash = document.getElementById("btn-nueva-transaccion");
    if (btnDash) {
        btnDash.addEventListener("click", () => {
            window.location.hash = "#transacciones";
        });
    }

    // Cerrar modal
    document.getElementById("cerrar-modal").addEventListener("click", cerrarModalMovimiento);

    // Guardar movimiento
    document.getElementById("form-transaccion").addEventListener("submit", async (e) => {
        e.preventDefault();
        await guardarMovimiento();
    });

    // Filtros dinámicos
    document.getElementById("filtro-tipo").addEventListener("change", cargarMovimientos);
    document.getElementById("filtro-categoria").addEventListener("change", cargarMovimientos);
    document.getElementById("buscar-mov").addEventListener("input", cargarMovimientos);

    // Delegación para editar y eliminar
    document.addEventListener("click", async (e) => {
        if (e.target.classList.contains("eliminar")) {
            await eliminarMovimiento(e.target.dataset.id);
        }
        if (e.target.classList.contains("editar")) {
            await cargarMovimientoEnModal(e.target.dataset.id);
        }
    });
}

/* ---------------------------------------------------
    Modal
---------------------------------------------------- */
function abrirModalMovimiento() {
    document.getElementById("form-transaccion").reset();
    document.getElementById("modal-transaccion").classList.remove("modal-oculto");
}

function cerrarModalMovimiento() {
    document.getElementById("modal-transaccion").classList.add("modal-oculto");
}

/* ---------------------------------------------------
    Guardar / Editar Movimiento
---------------------------------------------------- */
async function guardarMovimiento() {
    const tipo = document.getElementById("tipo-mov").value;
    const monto = parseFloat(document.getElementById("monto-mov").value);
    const fecha = document.getElementById("fecha-mov").value;
    const categoria = parseInt(document.getElementById("categoria-mov").value);
    const descripcion = document.getElementById("descripcion-mov").value;

    const idEdit = document.getElementById("form-transaccion").dataset.editId;

    const data = { tipo, monto, fecha, categoria, descripcion };

    if (idEdit) {
        data.id = parseInt(idEdit);
        await actualizarItem(STORES.MOVIMIENTOS, data);
        delete document.getElementById("form-transaccion").dataset.editId;
    } else {
        await agregarItem(STORES.MOVIMIENTOS, data);
    }

    cerrarModalMovimiento();
    await cargarMovimientos();

    // 🔥 ACTUALIZAR DASHBOARD Y PRESUPUESTOS EN TIEMPO REAL
    document.dispatchEvent(new Event("movimientos-actualizados"));
}

/* ---------------------------------------------------
    Cargar movimiento en modal para editar
---------------------------------------------------- */
async function cargarMovimientoEnModal(id) {
    const mov = await obtenerItem(STORES.MOVIMIENTOS, parseInt(id));

    document.getElementById("tipo-mov").value = mov.tipo;
    document.getElementById("monto-mov").value = mov.monto;
    document.getElementById("fecha-mov").value = mov.fecha;
    document.getElementById("categoria-mov").value = mov.categoria;
    document.getElementById("descripcion-mov").value = mov.descripcion || "";

    document.getElementById("form-transaccion").dataset.editId = mov.id;

    abrirModalMovimiento();
}

/* ---------------------------------------------------
    Eliminar movimiento
---------------------------------------------------- */
async function eliminarMovimiento(id) {
    await eliminarItem(STORES.MOVIMIENTOS, parseInt(id));
    await cargarMovimientos();

    // 🔥 Actualizar dashboard + presupuestos
    document.dispatchEvent(new Event("movimientos-actualizados"));
}
