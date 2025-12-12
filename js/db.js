// js/db.js
const DB_NAME = 'finanzas_v1';
const DB_VERSION = 1;

const STORES = {
    CATEGORIAS: 'categorias',
    MOVIMIENTOS: 'movimientos',
    PRESUPUESTOS: 'presupuestos'
};

let db = null;

function abrirDB() {
    return new Promise((resolve, reject) => {
        if (db) return resolve(db);
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            const idb = e.target.result;
            if (!idb.objectStoreNames.contains(STORES.CATEGORIAS)) {
                const s = idb.createObjectStore(STORES.CATEGORIAS, { keyPath: 'id', autoIncrement: true });
                s.createIndex('nombre', 'nombre', { unique: true });
            }
            if (!idb.objectStoreNames.contains(STORES.MOVIMIENTOS)) {
                idb.createObjectStore(STORES.MOVIMIENTOS, { keyPath: 'id', autoIncrement: true });
            }
            if (!idb.objectStoreNames.contains(STORES.PRESUPUESTOS)) {
                idb.createObjectStore(STORES.PRESUPUESTOS, { keyPath: 'id', autoIncrement: true });
            }
        };
        req.onsuccess = (e) => {
            db = e.target.result;
            window.dispatchEvent(new Event('db-ready'));
            resolve(db);
        };
        req.onerror = (e) => reject(e.target.error);
    });
}

// Helpers
function agregarItem(store, data) {
    return new Promise(async (resolve, reject) => {
        await abrirDB();
        const tx = db.transaction([store], 'readwrite');
        const os = tx.objectStore(store);
        const req = os.add(data);
        req.onsuccess = () => resolve(req.result);
        req.onerror = (e) => reject(e.target.error);
    });
}

function actualizarItem(store, data) {
    return new Promise(async (resolve, reject) => {
        await abrirDB();
        const tx = db.transaction([store], 'readwrite');
        const os = tx.objectStore(store);
        const req = os.put(data);
        req.onsuccess = () => resolve(true);
        req.onerror = (e) => reject(e.target.error);
    });
}

function eliminarItem(store, id) {
    return new Promise(async (resolve, reject) => {
        await abrirDB();
        const tx = db.transaction([store], 'readwrite');
        const os = tx.objectStore(store);
        const req = os.delete(id);
        req.onsuccess = () => resolve(true);
        req.onerror = (e) => reject(e.target.error);
    });
}

function obtenerTodos(store) {
    return new Promise(async (resolve, reject) => {
        await abrirDB();
        const tx = db.transaction([store], 'readonly');
        const os = tx.objectStore(store);
        const req = os.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = (e) => reject(e.target.error);
    });
}

function obtenerPorId(store, id) {
    return new Promise(async (resolve, reject) => {
        await abrirDB();
        const tx = db.transaction([store], 'readonly');
        const os = tx.objectStore(store);
        const req = os.get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror = (e) => reject(e.target.error);
    });
}

// export to global
window.STORES = STORES;
window.abrirDB = abrirDB;
window.agregarItem = agregarItem;
window.actualizarItem = actualizarItem;
window.eliminarItem = eliminarItem;
window.obtenerTodos = obtenerTodos;
window.obtenerPorId = obtenerPorId;
