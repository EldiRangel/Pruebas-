document.addEventListener('db-ready', async () => {
    await cargarPresupuestos();
    configurarFormularioPresupuesto();
});

async function cargarPresupuestos() {
    const presupuestos = await obtenerTodos(STORES.PRESUPUESTOS);
    const categorias = await obtenerTodos(STORES.CATEGORIAS);
    const lista = document.getElementById('lista-presupuestos');
    if (!lista) return;

    lista.innerHTML = '';

    if (presupuestos.length === 0) {
        lista.innerHTML = `<div class="estado-vacio">
            <p>No hay presupuestos registrados</p>
            <a href="#nuevo-presupuesto" class="btn-pequeno">Agregar Presupuesto</a>
        </div>`;
        return;
    }

    presupuestos.sort((a,b) => a.ano - b.ano || a.mes - b.mes);

    presupuestos.forEach(p => {
        const cat = categorias.find(c => c.id === p.categoria);
        const div = document.createElement('div');
        div.className = 'item-presupuesto';
        div.innerHTML = `
            <span class="pres-categoria">${cat ? cat.nombre : 'Sin categoría'}</span>
            <span class="pres-monto">$${p.monto.toFixed(2)}</span>
            <span class="pres-mes">${p.mes}/${p.ano}</span>
            <button class="boton boton-eliminar" onclick="eliminarPresupuesto(${p.id})">Eliminar</button>
        `;
        lista.appendChild(div);
    });
}

async function agregarPresupuesto(pres) {
    await agregarItem(STORES.PRESUPUESTOS, pres);
    document.dispatchEvent(new Event('presupuestos-actualizados'));
}

async function eliminarPresupuesto(id) {
    if (!confirm("¿Deseas eliminar este presupuesto?")) return;
    await eliminarItem(STORES.PRESUPUESTOS, id);
    document.dispatchEvent(new Event('presupuestos-actualizados'));
}

function configurarFormularioPresupuesto() {
    const form = document.getElementById('form-nuevo-presupuesto');
    const modal = document.getElementById('modal-nuevo-presupuesto');
    const btnCancelar = document.getElementById('btn-cancelar-presupuesto');

    if (btnCancelar) btnCancelar.addEventListener('click', () => modal.classList.remove('visible'));

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const categoria = parseInt(form.categoria.value);
            const monto = parseFloat(form.monto.value);
            const mes = parseInt(form.mes.value);
            const ano = parseInt(form.ano.value);

            if (isNaN(categoria) || isNaN(monto) || isNaN(mes) || isNaN(ano)) {
                alert('Por favor completa todos los campos correctamente');
                return;
            }

            await agregarPresupuesto({ categoria, monto, mes, ano });
            modal.classList.remove('visible');
            form.reset();
        });
    }
}
