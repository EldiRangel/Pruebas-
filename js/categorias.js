// js/categorias.js
document.addEventListener('db-ready', async () => {
    await cargarCategorias();
    await configurarFormulario();
    await configurarFiltros();
});

async function cargarCategorias(filtro = 'todas', busqueda = '') {
    const categorias = await obtenerTodos(STORES.CATEGORIAS);
    const grid = document.getElementById('lista-categorias');
    const vacio = document.getElementById('vacio-categorias');
    const contador = document.getElementById('contador-cat');
    if (!grid) return;
    grid.innerHTML = '';
    let catsFiltradas = categorias;
    if (filtro === 'gasto' || filtro === 'ingreso') {
        catsFiltradas = categorias.filter(cat => cat.tipo === filtro);
    }
    if (busqueda) {
        const term = busqueda.toLowerCase();
        catsFiltradas = catsFiltradas.filter(cat => cat.nombre.toLowerCase().includes(term));
    }
    if (contador) contador.textContent = catsFiltradas.length + ' categorias';
    if (catsFiltradas.length === 0) {
        if (vacio) vacio.style.display = 'block';
        return;
    }
    if (vacio) vacio.style.display = 'none';
    const predefinidas = ['Alimentacion', 'Transporte', 'Ocio', 'Servicios', 'Salud', 'Educacion', 'Otros'];
    catsFiltradas.forEach(cat => {
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
        grid.appendChild(li);
    });
}

async function configurarFormulario() {
    const form = document.getElementById('form-categoria');
    if (!form) return;
    const colorInput = document.getElementById('color-cat');
    const muestra = document.getElementById('muestra-color');
    const valor = document.getElementById('valor-color');
    if (colorInput && muestra && valor) {
        colorInput.addEventListener('input', (e) => {
            muestra.style.backgroundColor = e.target.value;
            valor.textContent = e.target.value;
        });
        muestra.style.backgroundColor = colorInput.value;
    }
    const btnLimpiar = document.getElementById('limpiar-cat');
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', () => {
            form.reset();
            if (colorInput) colorInput.value = '#3498db';
            if (muestra) muestra.style.backgroundColor = '#3498db';
            if (valor) valor.textContent = '#3498db';
        });
    }
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await crearCategoria();
    });
}

async function crearCategoria() {
    const nombreInput = document.getElementById('nombre-cat');
    const colorInput = document.getElementById('color-cat');
    const tipoSelect = document.getElementById('tipo-cat');
    const nombre = nombreInput.value.trim();
    const color = colorInput.value;
    const tipo = tipoSelect.value;
    if (!nombre) { alert('El nombre de la categoria es obligatorio'); return; }
    const nuevaCat = { nombre, color, tipo };
    try {
        await agregarItem(STORES.CATEGORIAS, nuevaCat);
        nombreInput.value = '';
        colorInput.value = '#3498db';
        const muestra = document.getElementById('muestra-color');
        const valor = document.getElementById('valor-color');
        if (muestra) muestra.style.backgroundColor = '#3498db';
        if (valor) valor.textContent = '#3498db';
        await cargarCategorias();
        document.dispatchEvent(new Event("categorias-actualizadas"));
        alert('Categoria creada correctamente');
    } catch (error) {
        if (error.name === 'ConstraintError') alert('Ya existe una categoria con ese nombre');
        else { console.error(error); alert('Error al crear la categoria'); }
    }
}

async function eliminarCategoria(id) {
    if (!confirm('¿Eliminar esta categoria? Todas las transacciones asociadas tambien se eliminaran.')) return;
    try {
        const transacciones = await obtenerTodos(STORES.MOVIMIENTOS);
        const transAEliminar = transacciones.filter(trans => trans.categoria === id);
        for (const trans of transAEliminar) {
            await eliminarItem(STORES.MOVIMIENTOS, trans.id);
        }
        await eliminarItem(STORES.CATEGORIAS, id);
        await cargarCategorias();
        document.dispatchEvent(new Event("categorias-actualizadas"));
        document.dispatchEvent(new Event("movimientos-actualizados"));
        alert('Categoria eliminada');
    } catch (error) {
        console.error(error);
        alert('Error al eliminar la categoria');
    }
}

async function configurarFiltros() {
    const filtros = document.querySelectorAll('.filtro');
    const buscador = document.getElementById('buscar-cat');
    filtros.forEach(filtro => {
        filtro.addEventListener('click', async (e) => {
            filtros.forEach(f => f.classList.remove('activo'));
            e.target.classList.add('activo');
            const filtroActivo = e.target.dataset.filtro;
            const busqueda = buscador ? buscador.value : '';
            await cargarCategorias(filtroActivo, busqueda);
        });
    });
    if (buscador) {
        buscador.addEventListener('input', async (e) => {
            const filtroActivo = document.querySelector('.filtro.activo').dataset.filtro;
            await cargarCategorias(filtroActivo, e.target.value);
        });
    }
        }
