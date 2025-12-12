// js/navegacion.js
document.addEventListener('DOMContentLoaded', function() {
    mostrarSeccion('panel');
    document.querySelectorAll('.boton-nav').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const id = this.getAttribute('href').substring(1);
            mostrarSeccion(id);
        });
    });
    // botón del panel "Agregar movimiento" que solo cambia a la pestaña movimientos (no abrir modal)
    const btnPanelMov = document.getElementById("btn-nueva-transaccion");
    if (btnPanelMov) btnPanelMov.addEventListener("click", () => mostrarSeccion("transacciones"));

    // botón rapido para abrir modal de nuevo movimiento dentro de la pestaña transacciones
    const btnNewMov = document.getElementById("btn-nuevo-mov");
    if (btnNewMov) btnNewMov.addEventListener("click", () => {
        mostrarSeccion("transacciones");
        // abrir modal desde movimientos.js después de que la sección se muestre:
        setTimeout(() => {
            const form = document.getElementById("form-transaccion");
            if (form) {
                form.reset();
                form.dataset.editando = "";
            }
            const modal = document.getElementById("modal-transaccion");
            if (modal) modal.classList.remove("modal-oculto");
        }, 50);
    });

});

function mostrarSeccion(id) {
    document.querySelectorAll('.seccion-pagina').forEach(sec => { sec.style.display = 'none'; });
    const seccion = document.getElementById(id);
    if (seccion) seccion.style.display = 'block';
    document.querySelectorAll('.boton-nav').forEach(btn => btn.classList.remove('activo'));
    const botonActivo = document.querySelector(`a[href="#${id}"]`);
    if (botonActivo) botonActivo.classList.add('activo');
            }
