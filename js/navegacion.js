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
