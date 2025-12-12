document.addEventListener("db-ready", async () => {
    await cargarPresupuestos();
    await cargarCategoriasEnPresupuestos();
    configurarFormularioPresupuesto();
});

/* ==========================================================
   CARGAR CATEGORÍAS EN SELECT
   ========================================================== */
async function cargarCategoriasEnPresupuestos() {
    const categorias = await obtenerTodos(STORES.CATEGORIAS);
    const select = document.getElementById("pres-cat");

    if (!select) return;

    select.innerHTML = `<option value="">Seleccione categoría</option>`;

    categorias
        .filter(c => c.tipo === "gasto") // Presupuestos son SOLO para gastos
        .forEach(cat => {
            const op = document.createElement("option");
            op.value = cat.id;
            op.textContent = cat.nombre;
            select.appendChild(op);
        });
}

/* ==========================================================
   GUARDAR PRESUPUESTO
   ========================================================== */
function configurarFormularioPresupuesto() {
    const form = document.getElementById("form-presupuesto");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const categoria = parseInt(document.getElementById("pres-cat").value);
        const monto = parseFloat(document.getElementById("pres-monto").value);

        if (!categoria || monto <= 0) {
            alert("Debe seleccionar una categoría y un monto válido.");
            return;
        }

        const fecha = new Date();
        const mes = fecha.getMonth() + 1;
        const ano = fecha.getFullYear();

        const nuevoPres = { categoria, monto, mes, ano };

        await agregarItem(STORES.PRESUPUESTOS, nuevoPres);

        form.reset();
        await cargarPresupuestos();

        document.dispatchEvent(new Event("presupuestos-actualizados"));
        alert("Presupuesto guardado correctamente");
    });
}

/* ==========================================================
   CARGAR LISTA DE PRESUPUESTOS
   ========================================================== */
async function cargarPresupuestos() {
    const lista = document.getElementById("lista-presupuestos");
    const vacio = document.getElementById("pres-vacio");

    if (!lista) return;

    const presupuestos = await obtenerTodos(STORES.PRESUPUESTOS);
    const categorias = await obtenerTodos(STORES.CATEGORIAS);
    const transacciones = await obtenerTodos(STORES.MOVIMIENTOS);

    lista.innerHTML = "";

    if (presupuestos.length === 0) {
        vacio.style.display = "block";
        return;
    }

    vacio.style.display = "none";

    presupuestos.forEach(pres => {
        const cat = categorias.find(c => c.id === pres.categoria);

        const gastosMes = transacciones
            .filter(t => t.categoria === pres.categoria && t.tipo === "gasto")
            .reduce((sum, t) => sum + t.monto, 0);

        const porcentaje = ((gastosMes / pres.monto) * 100).toFixed(0);

        const li = document.createElement("li");
        li.classList.add("item-lista");
        li.style.gridTemplateColumns = "1fr 1fr 1fr 80px";

        li.innerHTML = `
            <span>${cat ? cat.nombre : "Sin categoría"}</span>
            <span>$${pres.monto.toFixed(2)}</span>
            <span>$${gastosMes.toFixed(2)}</span>
            <button class="boton-eliminar boton-chico" onclick="eliminarPresupuesto(${pres.id})">X</button>
        `;

        lista.appendChild(li);
    });
}

/* ==========================================================
   ELIMINAR PRESUPUESTO
   ========================================================== */
async function eliminarPresupuesto(id) {
    if (!confirm("¿Eliminar presupuesto?")) return;

    await eliminarItem(STORES.PRESUPUESTOS, id);
    await cargarPresupuestos();

    document.dispatchEvent(new Event("presupuestos-actualizados"));
}
