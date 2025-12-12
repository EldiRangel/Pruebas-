// navegacion.js
document.addEventListener('DOMContentLoaded', () => {
    mostrarSeccion('panel');

    document.querySelectorAll('.boton-nav').forEach(btn => {
        btn.addEventListener('click', function(e){
            e.preventDefault();
            const id = this.getAttribute('href').substring(1);
            mostrarSeccion(id);
        });
    });

    // botón en panel que sólo redirige a Movimientos
    const btnPanel = document.getElementById('btn-panel-nuevo');
    if (btnPanel) btnPanel.addEventListener('click', () => mostrarSeccion('transacciones'));
});

function mostrarSeccion(id) {
    document.querySelectorAll('.seccion-pagina').forEach(s => s.style.display = 'none');
    const sec = document.getElementById(id);
    if (sec) sec.style.display = 'block';

    document.querySelectorAll('.boton-nav').forEach(b => b.classList.remove('activo'));
    const boton = document.querySelector(`.navegacion a[href="#${id}"]`);
    if (boton) boton.classList.add('activo');
}
