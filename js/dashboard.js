// dashboard.js
let graficoGastos = null;

document.addEventListener("db-ready", () => {
    actualizarDashboard();
});

// Si categorías cambian → refrescar gráfico
document.addEventListener("categorias-actualizadas", () => {
    actualizarDashboard();
});

// Si movimientos cambian → refrescar dashboard completo
document.addEventListener("movimientos-actualizados", () => {
    actualizarDashboard();
});

// -----------------------------
//     CARGA PRINCIPAL
// -----------------------------
async function actualizarDashboard() {
    try {
        const categorias = await obtenerItems("categorias");
        const transacciones = await obtenerItems("movimientos");

        actualizarTotales(transacciones);
        actualizarListaTransacciones(transacciones, categorias);
        crearGraficoGastos(transacciones, categorias);

    } catch (e) {
        console.error("Error cargando dashboard:", e);
    }
}

// -----------------------------
//     TOTAL INGRESOS / GASTOS
// -----------------------------
function actualizarTotales(transacciones) {
    let totalIngresos = 0;
    let totalGastos = 0;

    transacciones.forEach(t => {
        if (t.tipo === "ingreso") totalIngresos += Number(t.monto);
        if (t.tipo === "gasto") totalGastos += Number(t.monto);
    });

    document.getElementById("total-ingresos").textContent = `$${totalIngresos.toFixed(2)}`;
    document.getElementById("total-gastos").textContent = `$${totalGastos.toFixed(2)}`;

    const balance = totalIngresos - totalGastos;
    document.getElementById("balance-total").textContent = `$${balance.toFixed(2)}`;

    const estado = document.getElementById("estado-balance");
    estado.textContent = balance >= 0 ? "Disponible" : "En déficit";
    estado.style.color = balance >= 0 ? "#27ae60" : "#c0392b";
}

// -----------------------------
//     LISTA DE ÚLTIMOS MOVIMIENTOS
// -----------------------------
function actualizarListaTransacciones(transacciones, categorias) {
    const lista = document.getElementById("lista-transacciones");
    lista.innerHTML = "";

    if (transacciones.length === 0) {
        lista.innerHTML = `
            <li class="estado-vacio">
                <div>No hay movimientos registrados</div>
                <button id="btn-nueva-transaccion" class="boton-chico">Agregar movimiento</button>
            </li>
        `;
        document.getElementById("btn-nueva-transaccion").onclick = () => {
            location.hash = "#transacciones";
        };
        return;
    }

    const ultimos = transacciones
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .slice(0, 5);

    ultimos.forEach(t => {
        const cat = categorias.find(c => c.id === t.categoria);
        const li = document.createElement("li");

        li.className = "item-lista";
        li.innerHTML = `
            <span>${cat ? cat.nombre : "Sin categoría"}</span>
            <span>$${t.monto}</span>
            <span>${t.fecha}</span>
        `;

        lista.appendChild(li);
    });
}

// -----------------------------
//     GRAFICO DE GASTOS
// -----------------------------
function crearGraficoGastos(transacciones, categorias) {
    const ctx = document.getElementById("grafico-gastos").getContext("2d");

    if (graficoGastos) {
        graficoGastos.destroy();
    }

    const categoriasGasto = categorias.filter(c => c.tipo === "gasto");

    const totalPorCategoria = categoriasGasto.map(cat => {
        const total = transacciones
            .filter(t => t.tipo === "gasto" && t.categoria === cat.id)
            .reduce((acc, t) => acc + Number(t.monto), 0);

        return total;
    });

    graficoGastos = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: categoriasGasto.map(c => c.nombre),
            datasets: [{
                data: totalPorCategoria,
                backgroundColor: categoriasGasto.map(c => c.color)
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: "bottom" }
            }
        }
    });
}

console.log("dashboard.js cargado correctamente.");
