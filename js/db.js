const DB_NAME = 'FinanzasDB';
const DB_VERSION = 1;

const STORES = {
    CATEGORIAS: 'categorias',
    MOVIMIENTOS: 'movimientos',
    PRESUPUESTOS: 'presupuestos'
};

let db;

function abrirDB() {
    return new Promise((resolve, reject) => {
        const solicitud = indexedDB.open(DB_NAME, DB_VERSION);

        solicitud.onerror = () => reject('No se pudo abrir la DB');

        solicitud.onsuccess = () => {
            db = solicitud.result;
            document.dispatchEvent(new Event('db-ready'));
            resolve(db);
        };

        solicitud.onupgradeneeded = (e) => {
            db = e.target.result;
            if (!db.objectStoreNames.contains(STORES.CATEGORIAS)) {
                db.createObjectStore(STORES.CATEGORIAS, { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains(STORES.MOVIMIENTOS)) {
                db.createObjectStore(STORES.MOVIMIENTOS, { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains(STORES.PRESUPUESTOS)) {
                db.createObjectStore(STORES.PRESUPUESTOS, { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

function agregarItem(store, item) {
    return new Promise((resolve, reject) => {
        const trans = db.transaction([store], 'readwrite');
        trans.objectStore(store).add(item).onsuccess = () => resolve();
        trans.onerror = () => reject('Error al agregar');
    });
}

function actualizarItem(store, item) {
    return new Promise((resolve, reject) => {
        const trans = db.transaction([store], 'readwrite');
        trans.objectStore(store).put(item).onsuccess = () => resolve();
        trans.onerror = () => reject('Error al actualizar');
    });
}

function eliminarItem(store, id) {
    return new Promise((resolve, reject) => {
        const trans = db.transaction([store], 'readwrite');
        trans.objectStore(store).delete(id).onsuccess = () => resolve();
        trans.onerror = () => reject('Error al eliminar');
    });
}

function obtenerTodos(store) {
    return new Promise((resolve, reject) => {
        const trans = db.transaction([store], 'readonly');
        const req = trans.objectStore(store).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject('Error al obtener todos');
    });
}

function obtenerPorId(store, id) {
    return new Promise((resolve, reject) => {
        const trans = db.transaction([store], 'readonly');
        const req = trans.objectStore(store).get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject('Error al obtener por id');
    });
}
