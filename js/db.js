let db;

const DB_NAME = 'FinanzasDB';
const DB_VERSION = 1;

const STORES = {
    CATEGORIAS: 'categorias',
    MOVIMIENTOS: 'movimientos',
    PRESUPUESTOS: 'presupuestos'
};

document.addEventListener('DOMContentLoaded', function() {
    const solicitud = indexedDB.open(DB_NAME, DB_VERSION);

    solicitud.onerror = function(evento) {
        console.error('Error al abrir la DB:', evento.target.error);
    };

    solicitud.onsuccess = function(evento) {
        db = evento.target.result;
        console.log('DB lista');
        document.dispatchEvent(new Event('db-ready'));
    };

    solicitud.onupgradeneeded = function(evento) {
        db = evento.target.result;

        if (!db.objectStoreNames.contains(STORES.CATEGORIAS)) {
            const catStore = db.createObjectStore(STORES.CATEGORIAS, { 
                keyPath: 'id', 
                autoIncrement: true
            });
            // Crear indice para buscar por nombre (evitar duplicados)
            catStore.createIndex('nombre', 'nombre', { unique: true });
        }

        if (!db.objectStoreNames.contains(STORES.MOVIMIENTOS)) {
            db.createObjectStore(STORES.MOVIMIENTOS, { 
                keyPath: 'id', 
                autoIncrement: true
            });
        }

        if (!db.objectStoreNames.contains(STORES.PRESUPUESTOS)) {
            const presStore = db.createObjectStore(STORES.PRESUPUESTOS, { 
                keyPath: 'id', 
                autoIncrement: true
            });
            // Crear indice para buscar por categoria, mes y año
            presStore.createIndex('categoria_mes_year', ['categoria', 'mes', 'year'], { unique: true });
        }
    };
});

// Agregar un nuevo registro
function agregarItem(store, data) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([store], 'readwrite');
        const objStore = tx.objectStore(store);
        const request = objStore.add(data);

        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

// Obtener todos los registros
function obtenerTodos(store) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([store], 'readonly');
        const objStore = tx.objectStore(store);
        const request = objStore.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

// Obtener un registro por ID
function obtenerPorId(store, id) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([store], 'readonly');
        const objStore = tx.objectStore(store);
        const request = objStore.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

// Actualizar un registro
function actualizarItem(store, data) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([store], 'readwrite');
        const objStore = tx.objectStore(store);
        const request = objStore.put(data);

        request.onsuccess = () => resolve(true);
        request.onerror = (e) => reject(e.target.error);
    });
}

// Eliminar un registro
function eliminarItem(store, id) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([store], 'readwrite');
        const objStore = tx.objectStore(store);
        const request = objStore.delete(id);

        request.onsuccess = () => resolve(true);
        request.onerror = (e) => reject(e.target.error);
    });
          }
