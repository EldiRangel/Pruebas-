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
