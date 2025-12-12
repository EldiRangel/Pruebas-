document.addEventListener('db-ready', async () => {
    await cargarMovimientos();
    configurarBotonesMovimientos();
});

async function cargarMovimientos() {
    const movimientos = await obtenerTodos(STORES.MOVIMIENTOS);
    const categorias = await obtenerTodos(STORES.CATEGORIAS);
    const lista = document.getElementById('lista-movimientos');
    if (!lista) return;

    lista.innerHTML = '';

    if (movimientos.length === 0) {
        lista.innerHTML = `<div class="estado-vacio">
            <p>No hay movimientos registrados</p>
            <a href="#nuevo-movimiento" class="btn-pequeno">Agregar Movimiento</a>
        </div>`;
        return;
    }

    movimientos.sort((a,b) => b.creado - a.creado);

    movimientos.forEach(m => {
        const cat = categorias.find(c => c.id === m.categoria);
        const color = m.tipo === 'ingreso' ? '#27ae60' : '#e74c3c';
        const simbolo = m.tipo === 'ingreso' ? '+' : '-';
        const fecha = m.fecha ? new Date(m.fecha).toLocaleDateString('es-ES') : '-';

        const div = document.createElement('div');
        div.className = 'item-movimiento';
        div.innerHTML = `
            <span class="mov-descripcion">${m.descripcion || 'Sin descripción'}</span>
            <span class="mov-categoria">${cat ? cat.nombre : 'Sin categoría'}</span>
            <span class="mov-monto" style="color:${color}">${simbolo}$${m.monto.toFixed(2)}</span>
            <span class="mov-fecha">${fecha}</span>
            <button class="boton boton-eliminar" onclick="eliminarMovimiento(${m.id})">Eliminar</button>
        `;
        lista.appendChild(div);
    });
}

async function agregarMovimiento(mov) {
    mov.creado = Date.now();
    await agregarItem(STORES.MOVIMIENTOS, mov);
    document.dispatchEvent(new Event('movimientos-actualizados'));
}

async function eliminarMovimiento(id) {
    if (!confirm("¿Deseas eliminar este movimiento?")) return;
    await eliminarItem(STORES.MOVIMIENTOS, id);
    document.dispatchEvent(new Event('movimientos-actualizados'));
}

function configurarBotonesMovimientos() {
    const botonNuevo = document.getElementById('btn-nuevo-movimiento');
    const modal = document.getElementById('modal-nuevo-movimiento');
    const botonCancelar = document.getElementById('btn-cancelar-movimiento');
    const form = document.getElementById('form-nuevo-movimiento');

    if (botonNuevo) botonNuevo.addEventListener('click', () => modal.classList.add('visible'));
    if (botonCancelar) botonCancelar.addEventListener('click', () => modal.classList.remove('visible'));

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const descripcion = form.descripcion.value.trim();
            const monto = parseFloat(form.monto.value);
            const tipo = form.tipo.value;
            const categoria = parseInt(form.categoria.value);
            const fecha = form.fecha.value;

            if (!descripcion || isNaN(monto) || !tipo || isNaN(categoria) || !fecha) {
                alert('Por favor completa todos los campos correctamente');
                return;
            }

            await agregarMovimiento({ descripcion, monto, tipo, categoria, fecha });
            modal.classList.remove('visible');
            form.reset();
        });
    }
}
