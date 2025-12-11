document.addEventListener('DOMContentLoaded', function() {
    mostrarSeccion('panel');
    
    document.querySelectorAll('.boton-nav').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const id = this.getAttribute('href').substring(1);
            mostrarSeccion(id);
        });
    });
});

function mostrarSeccion(id) {
    document.querySelectorAll('.seccion-pagina').forEach(sec => {
        sec.style.display = 'none';
    });
    
    const seccion = document.getElementById(id);
    if (seccion) {
        seccion.style.display = 'block';
        
        // Si es la seccion de presupuestos, cargarlos despues de un breve delay
        if (id === 'presupuestos') {
            setTimeout(async () => {
                if (typeof cargarPresupuestos === 'function') {
                    await cargarPresupuestos();
                }
                if (typeof cargarCategoriasParaPresupuestos === 'function') {
                    await cargarCategoriasParaPresupuestos();
                }
            }, 100);
        }
        
        // Si es la seccion de transacciones, cargar categorias para filtro
        if (id === 'transacciones') {
            setTimeout(async () => {
                if (typeof cargarCategoriasFiltro === 'function') {
                    await cargarCategoriasFiltro();
                }
                if (typeof cargarMovimientos === 'function') {
                    await cargarMovimientos();
                }
            }, 100);
        }
        
        // Si es la seccion de categorias, cargarlas
        if (id === 'categorias') {
            setTimeout(async () => {
                if (typeof cargarCategorias === 'function') {
                    await cargarCategorias();
                }
            }, 100);
        }
    }
    
    document.querySelectorAll('.boton-nav').forEach(btn => {
        btn.classList.remove('activo');
    });
    
    const botonActivo = document.querySelector(`a[href="#${id}"]`);
    if (botonActivo) {
        botonActivo.classList.add('activo');
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const btnPanelMov = document.getElementById("btn-nueva-transaccion");

    if (btnPanelMov) {
        btnPanelMov.addEventListener("click", () => {
            mostrarSeccion("transacciones");
        });
    }
});
