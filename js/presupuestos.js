document.addEventListener('db-ready', async () => {
    await cargarPresupuestos();
    await cargarCategoriasParaPresupuestos();
    configurarFormularioPresupuesto();
    configurarSelectoresPresupuesto();
    actualizarMesActual();
});

let presupuestosActuales = [];
let categoriasPresupuesto = [];

// Funcion para actualizar el mes actual en los selectores
function actualizarMesActual() {
    const fecha = new Date();
    const mesActual = fecha.getMonth() + 1;
    const yearActual = fecha.getFullYear();
    
    const mesInput = document.getElementById('mes-presupuesto');
    const yearInput = document.getElementById('year-presupuesto');
    const filtroMes = document.getElementById('filtro-mes');
    const filtroYear = document.getElementById('filtro-year');
    
    if (mesInput) mesInput.value = mesActual;
    if (yearInput) yearInput.value = yearActual;
    if (filtroMes) filtroMes.value = mesActual;
    if (filtroYear) filtroYear.value = yearActual;
    
    // Actualizar el label del mes actual
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const mesLabel = document.getElementById('mes-actual-label');
    if (mesLabel) {
        mesLabel.textContent = `${meses[mesActual - 1]} ${yearActual}`;
    }
}

// Cargar categorias para el formulario de presupuestos
async function cargarCategoriasParaPresupuestos() {
    try {
        categoriasPresupuesto = await obtenerTodos(STORES.CATEGORIAS);
        const select = document.getElementById('categoria-presupuesto');
        
        if (!select) return;
        
        select.innerHTML = '<option value="">Seleccionar categoria</option>';
        
        // Solo mostrar categorias de tipo "gasto" para presupuestos
        const categoriasGasto = categoriasPresupuesto.filter(cat => cat.tipo === 'gasto');
        
        categoriasGasto.forEach(cat => {
            const op = document.createElement('option');
            op.value = cat.id;
            op.textContent = `${cat.nombre}`;
            op.style.color = cat.color;
            select.appendChild(op);
        });
        
    } catch (error) {
        console.error('Error cargando categorias para presupuestos:', error);
    }
}

// Cargar todos los presupuestos
async function cargarPresupuestos(filtroMes = null, filtroYear = null) {
    try {
        presupuestosActuales = await obtenerTodos(STORES.PRESUPUESTOS);
        const transacciones = await obtenerTodos(STORES.MOVIMIENTOS);
        
        const contador = document.getElementById('contador-presupuestos');
        const lista = document.getElementById('lista-presupuestos');
        const vacio = document.getElementById('vacio-presupuestos');
        const totalPresupuestado = document.getElementById('total-presupuestado');
        const totalGastado = document.getElementById('total-gastado');
        const diferenciaTotal = document.getElementById('diferencia-total');
        
        if (!lista) return;
        
        let presupuestosFiltrados = [...presupuestosActuales];
        
        // Aplicar filtros de mes y año
        if (filtroMes && filtroMes !== 'todos') {
            presupuestosFiltrados = presupuestosFiltrados.filter(p => p.mes === parseInt(filtroMes));
        }
        
        if (filtroYear && filtroYear !== 'todos') {
            presupuestosFiltrados = presupuestosFiltrados.filter(p => p.year === parseInt(filtroYear));
        }
        
        // Ordenar por año y mes descendente
        presupuestosFiltrados.sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.mes - a.mes;
        });
        
        lista.innerHTML = '';
        
        if (contador) {
            contador.textContent = `${presupuestosFiltrados.length} presupuestos`;
        }
        
        if (presupuestosFiltrados.length === 0) {
            if (vacio) vacio.style.display = 'block';
            if (totalPresupuestado) totalPresupuestado.textContent = '$0.00';
            if (totalGastado) totalGastado.textContent = '$0.00';
            if (diferenciaTotal) diferenciaTotal.textContent = '$0.00';
            return;
        }
        
        if (vacio) vacio.style.display = 'none';
        
        let sumaPresupuestado = 0;
        let sumaGastado = 0;
        
        // Procesar cada presupuesto
        for (const presupuesto of presupuestosFiltrados) {
            const cat = categoriasPresupuesto.find(c => c.id === presupuesto.categoria);
            if (!cat) continue;
            
            // Calcular gastos reales para este presupuesto
            const gastosMes = transacciones.filter(t => 
                t.categoria === presupuesto.categoria && 
                t.tipo === 'gasto' &&
                new Date(t.fecha).getMonth() + 1 === presupuesto.mes &&
                new Date(t.fecha).getFullYear() === presupuesto.year
            );
            
            const gastoReal = gastosMes.reduce((sum, t) => sum + t.monto, 0);
            const porcentaje = presupuesto.monto > 0 ? (gastoReal / presupuesto.monto) * 100 : 0;
            
            sumaPresupuestado += presupuesto.monto;
            sumaGastado += gastoReal;
            
            // Determinar estado y color
            let estado = '';
            let estadoColor = '#27ae60';
            
            if (porcentaje >= 100) {
                estado = 'Excedido';
                estadoColor = '#e74c3c';
            } else if (porcentaje >= 80) {
                estado = 'Alerta';
                estadoColor = '#f39c12';
            } else {
                estado = 'En limite';
            }
            
            // Crear elemento de lista
            const li = document.createElement('li');
            li.className = 'item-presupuesto';
            li.style.borderLeft = `4px solid ${cat.color}`;
            
            const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            
            li.innerHTML = `
                <div class="presupuesto-info">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="presupuesto-color" style="background-color: ${cat.color}"></div>
                        <div>
                            <div class="presupuesto-categoria">${cat.nombre}</div>
                            <div class="presupuesto-periodo">${meses[presupuesto.mes - 1]} ${presupuesto.year}</div>
                        </div>
                    </div>
                    <div class="presupuesto-estado" style="color: ${estadoColor}">
                        ${estado}
                    </div>
                </div>
                
                <div class="presupuesto-detalle">
                    <div class="presupuesto-montos">
                        <div>
                            <span class="presupuesto-label">Presupuesto:</span>
                            <span class="presupuesto-valor">$${presupuesto.monto.toFixed(2)}</span>
                        </div>
                        <div>
                            <span class="presupuesto-label">Gastado:</span>
                            <span class="presupuesto-valor">$${gastoReal.toFixed(2)}</span>
                        </div>
                        <div>
                            <span class="presupuesto-label">Disponible:</span>
                            <span class="presupuesto-valor" style="color: ${presupuesto.monto - gastoReal >= 0 ? '#27ae60' : '#e74c3c'}">
                                $${(presupuesto.monto - gastoReal).toFixed(2)}
                            </span>
                        </div>
                    </div>
                    
                    <div class="presupuesto-progreso">
                        <div class="progreso-bar">
                            <div class="progreso-fill" style="width: ${Math.min(porcentaje, 100)}%; background-color: ${estadoColor}"></div>
                        </div>
                        <div class="progreso-texto">${porcentaje.toFixed(1)}%</div>
                    </div>
                </div>
                
                <div class="presupuesto-acciones">
                    <button class="boton-chico" onclick="editarPresupuesto(${presupuesto.id})">Editar</button>
                    <button class="boton-chico boton-eliminar" onclick="eliminarPresupuesto(${presupuesto.id})">Eliminar</button>
                </div>
            `;
            
            lista.appendChild(li);
        }
        
        // Actualizar totales
        if (totalPresupuestado) {
            totalPresupuestado.textContent = `$${sumaPresupuestado.toFixed(2)}`;
        }
        
        if (totalGastado) {
            totalGastado.textContent = `$${sumaGastado.toFixed(2)}`;
        }
        
        if (diferenciaTotal) {
            const diferencia = sumaPresupuestado - sumaGastado;
            diferenciaTotal.textContent = `$${diferencia.toFixed(2)}`;
            diferenciaTotal.style.color = diferencia >= 0 ? '#27ae60' : '#e74c3c';
        }
        
    } catch (error) {
        console.error('Error cargando presupuestos:', error);
    }
}

// Configurar formulario de presupuesto
function configurarFormularioPresupuesto() {
    const form = document.getElementById('form-presupuesto');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const categoria = parseInt(document.getElementById('categoria-presupuesto').value);
        const monto = parseFloat(document.getElementById('monto-presupuesto').value);
        const mes = parseInt(document.getElementById('mes-presupuesto').value);
        const year = parseInt(document.getElementById('year-presupuesto').value);
        
        if (!categoria || !monto || !mes || !year) {
            alert('Por favor, complete todos los campos');
            return;
        }
        
        if (monto <= 0) {
            alert('El monto debe ser mayor a cero');
            return;
        }
        
        // Verificar si ya existe un presupuesto para esta categoria, mes y año
        const presupuestoExistente = presupuestosActuales.find(p => 
            p.categoria === categoria && 
            p.mes === mes && 
            p.year === year
        );
        
        const editId = form.dataset.editando;
        
        if (editId) {
            // Modo edicion
            const presupuestoActualizado = {
                id: parseInt(editId),
                categoria,
                monto,
                mes,
                year
            };
            
            try {
                await actualizarItem(STORES.PRESUPUESTOS, presupuestoActualizado);
                alert('Presupuesto actualizado correctamente');
            } catch (error) {
                console.error('Error actualizando presupuesto:', error);
                alert('Error al actualizar el presupuesto');
            }
            
        } else {
            // Modo creacion
            if (presupuestoExistente) {
                const confirmar = confirm(`Ya existe un presupuesto para esta categoria en ${mes}/${year}. ¿Desea actualizarlo?`);
                if (!confirmar) return;
                
                // Actualizar el existente
                const presupuestoActualizado = {
                    id: presupuestoExistente.id,
                    categoria,
                    monto,
                    mes,
                    year
                };
                
                try {
                    await actualizarItem(STORES.PRESUPUESTOS, presupuestoActualizado);
                    alert('Presupuesto actualizado correctamente');
                } catch (error) {
                    console.error('Error actualizando presupuesto:', error);
                    alert('Error al actualizar el presupuesto');
                }
                
            } else {
                // Crear nuevo
                const nuevoPresupuesto = {
                    categoria,
                    monto,
                    mes,
                    year
                };
                
                try {
                    await agregarItem(STORES.PRESUPUESTOS, nuevoPresupuesto);
                    alert('Presupuesto creado correctamente');
                } catch (error) {
                    console.error('Error creando presupuesto:', error);
                    alert('Error al crear el presupuesto');
                }
            }
        }
        
        // Limpiar formulario y recargar
        form.reset();
        delete form.dataset.editando;
        actualizarMesActual();
        
        // Recargar presupuestos
        await cargarPresupuestos();
        
        // Actualizar dashboard si existe
        if (window.dashboardInstance) {
            window.dashboardInstance.actualizarDashboard();
        }
        
        // Disparar evento para actualizar otras partes
        document.dispatchEvent(new CustomEvent('presupuestos-actualizados'));
    });
    
    // Boton para limpiar formulario
    const btnLimpiar = document.getElementById('limpiar-presupuesto');
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', () => {
            form.reset();
            delete form.dataset.editando;
            actualizarMesActual();
            
            // Restaurar titulo del formulario
            const tituloForm = document.querySelector('#form-presupuesto .seccion-titulo');
            if (tituloForm) {
                tituloForm.textContent = 'Nuevo Presupuesto';
            }
        });
    }
}

// Configurar selectores de filtro
function configurarSelectoresPresupuesto() {
    const filtroMes = document.getElementById('filtro-mes');
    const filtroYear = document.getElementById('filtro-year');
    
    if (filtroMes) {
        filtroMes.addEventListener('change', async () => {
            const mes = filtroMes.value === 'todos' ? null : filtroMes.value;
            const year = filtroYear && filtroYear.value !== 'todos' ? filtroYear.value : null;
            await cargarPresupuestos(mes, year);
        });
    }
    
    if (filtroYear) {
        filtroYear.addEventListener('change', async () => {
            const mes = filtroMes && filtroMes.value !== 'todos' ? filtroMes.value : null;
            const year = filtroYear.value === 'todos' ? null : filtroYear.value;
            await cargarPresupuestos(mes, year);
        });
    }
}

// Editar presupuesto
async function editarPresupuesto(id) {
    try {
        const presupuesto = await obtenerPorId(STORES.PRESUPUESTOS, id);
        if (!presupuesto) {
            alert('Presupuesto no encontrado');
            return;
        }
        
        const form = document.getElementById('form-presupuesto');
        form.dataset.editando = id;
        
        document.getElementById('categoria-presupuesto').value = presupuesto.categoria;
        document.getElementById('monto-presupuesto').value = presupuesto.monto;
        document.getElementById('mes-presupuesto').value = presupuesto.mes;
        document.getElementById('year-presupuesto').value = presupuesto.year;
        
        // Cambiar titulo del formulario
        const tituloForm = document.querySelector('#form-presupuesto .seccion-titulo');
        if (tituloForm) {
            tituloForm.textContent = 'Editar Presupuesto';
        }
        
        // Desplazar a la seccion del formulario
        mostrarSeccion('presupuestos');
        
        // Hacer scroll al formulario
        const formularioSection = document.querySelector('.contenedor-formulario');
        if (formularioSection) {
            formularioSection.scrollIntoView({ behavior: 'smooth' });
        }
        
    } catch (error) {
        console.error('Error cargando presupuesto para editar:', error);
        alert('Error al cargar el presupuesto');
    }
}

// Eliminar presupuesto
async function eliminarPresupuesto(id) {
    const confirmar = confirm('¿Esta seguro de eliminar este presupuesto?');
    if (!confirmar) return;
    
    try {
        await eliminarItem(STORES.PRESUPUESTOS, id);
        alert('Presupuesto eliminado correctamente');
        await cargarPresupuestos();
        
        // Actualizar dashboard si existe
        if (window.dashboardInstance) {
            window.dashboardInstance.actualizarDashboard();
        }
        
        // Disparar evento para actualizar otras partes
        document.dispatchEvent(new CustomEvent('presupuestos-actualizados'));
        
    } catch (error) {
        console.error('Error eliminando presupuesto:', error);
        alert('Error al eliminar el presupuesto');
    }
}

// Funcion para obtener resumen de presupuestos del mes actual
async function obtenerResumenPresupuestosMes(mes, year) {
    try {
        const presupuestos = await obtenerTodos(STORES.PRESUPUESTOS);
        const transacciones = await obtenerTodos(STORES.MOVIMIENTOS);
        const categorias = await obtenerTodos(STORES.CATEGORIAS);
        
        const presupuestosMes = presupuestos.filter(p => p.mes === mes && p.year === year);
        
        let resumen = {
            totalPresupuestado: 0,
            totalGastado: 0,
            diferencia: 0,
            categorias: []
        };
        
        for (const presupuesto of presupuestosMes) {
            const cat = categorias.find(c => c.id === presupuesto.categoria);
            if (!cat) continue;
            
            // Calcular gastos reales
            const gastos = transacciones.filter(t => 
                t.categoria === presupuesto.categoria && 
                t.tipo === 'gasto' &&
                new Date(t.fecha).getMonth() + 1 === mes &&
                new Date(t.fecha).getFullYear() === year
            );
            
            const gastoReal = gastos.reduce((sum, t) => sum + t.monto, 0);
            const porcentaje = presupuesto.monto > 0 ? (gastoReal / presupuesto.monto) * 100 : 0;
            
            resumen.totalPresupuestado += presupuesto.monto;
            resumen.totalGastado += gastoReal;
            
            resumen.categorias.push({
                categoria: cat.nombre,
                color: cat.color,
                presupuesto: presupuesto.monto,
                gastado: gastoReal,
                disponible: presupuesto.monto - gastoReal,
                porcentaje: porcentaje,
                estado: porcentaje >= 100 ? 'excedido' : porcentaje >= 80 ? 'alerta' : 'normal'
            });
        }
        
        resumen.diferencia = resumen.totalPresupuestado - resumen.totalGastado;
        
        return resumen;
        
    } catch (error) {
        console.error('Error obteniendo resumen de presupuestos:', error);
        return null;
    }
}

// Funcion para verificar si se excedio algun presupuesto
async function verificarAlertasPresupuesto() {
    try {
        const fecha = new Date();
        const mesActual = fecha.getMonth() + 1;
        const yearActual = fecha.getFullYear();
        
        const resumen = await obtenerResumenPresupuestosMes(mesActual, yearActual);
        if (!resumen) return;
        
        const categoriasExcedidas = resumen.categorias.filter(c => c.estado === 'excedido');
        const categoriasAlerta = resumen.categorias.filter(c => c.estado === 'alerta');
        
        // Mostrar alertas si existen
        if (categoriasExcedidas.length > 0) {
            console.warn('ALERTA: Presupuestos excedidos:', categoriasExcedidas.map(c => c.categoria));
            
            // Mostrar alerta al usuario
            const mensaje = `Presupuestos excedidos:\n${categoriasExcedidas.map(c => `• ${c.categoria} (${c.porcentaje.toFixed(0)}%)`).join('\n')}`;
            
            // Mostrar esto como una notificacion en la interfaz
            const alertaDiv = document.getElementB
