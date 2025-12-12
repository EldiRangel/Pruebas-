// js/db.js
const DB_NAME = 'finanzas_db_v1';
const DB_VERSION = 1;
let db = null;

const STORES = {
    CATEGORIAS: 'categorias',
    MOVIMIENTOS: 'movimientos',
    PRESUPUESTOS: 'presupuestos'
};

function abrirDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = (e) => {
            const idb = e.target.result;

            if (!idb.objectStoreNames.contains(STORES.CATEGORIAS)) {
                const s = idb.createObjectStore(STORES.CATEGORIAS, { keyPath: 'id', autoIncrement: true });
                s.createIndex('nombre', 'nombre', { unique: true });
            }

            if (!idb.objectStoreNames.contains(STORES.MOVIMIENTOS)) {
                const s = idb.createObjectStore(STORES.MOVIMIENTOS, { keyPath: 'id', autoIncrement: true });
                s.createIndex('fecha', 'fecha', { unique: false });
            }

            if (!idb.objectStoreNames.contains(STORES.PRESUPUESTOS)) {
                const s = idb.createObjectStore(STORES.PRESUPUESTOS, { keyPath: 'id', autoIncrement: true });
                // índices si deseas
                s.createIndex('categoria', 'categoria', { unique: false });
                s.createIndex('mes_ano', ['mes','ano'], { unique: false });
            }
        };

        req.onsuccess = (e) => {
            db = e.target.result;
            console.log('DB abierta', DB_NAME);
            document.dispatchEvent(new Event('db-ready'));
            resolve(db);
        };

        req.onerror = (e) => {
            console.error('Error abriendo DB', e);
            reject(e);
        };
    });
}

// helpers CRUD
function crearTransaccion(storeName, mode = 'readonly') {
    const tx = db.transaction([storeName], mode);
    return tx.objectStore(storeName);
}

function agregarItem(store, data) {
    return new Promise((resolve, reject) => {
        const objStore = crearTransaccion(store, 'readwrite');
        const req = objStore.add(data);
        req.onsuccess = () => resolve(req.result);
        req.onerror = (e) => reject(e.target.error);
    });
}

function actualizarItem(store, data) {
    return new Promise((resolve, reject) => {
        const objStore = crearTransaccion(store, 'readwrite');
        const req = objStore.put(data);
        req.onsuccess = () => resolve(true);
        req.onerror = (e) => reject(e.target.error);
    });
}

function eliminarItem(store, id) {
    return new Promise((resolve, reject) => {
        const objStore = crearTransaccion(store, 'readwrite');
        const req = objStore.delete(id);
        req.onsuccess = () => resolve(true);
        req.onerror = (e) => reject(e.target.error);
    });
}

function obtenerTodos(store) {
    return new Promise((resolve, reject) => {
        const objStore = crearTransaccion(store, 'readonly');
        const req = objStore.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = (e) => reject(e.target.error);
    });
}

function obtenerPorId(store, id) {
    return new Promise((resolve, reject) => {
        const objStore = crearTransaccion(store, 'readonly');
        const req = objStore.get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror = (e) => reject(e.target.error);
    });
}

// Inicializar DB ahora
abrirDB().catch(err => console.error('No se pudo abrir DB', err));
