// Image stock: pasted / dropped images are shrunk and kept in IndexedDB on this computer.
// They are not synced (chrome.storage.sync is far too small). A memo refers to one as
// ![](img:<id>), and the preview looks it up here.
const MemoImages = (() => {
  const DB_NAME = 'simple-memo-images';
  const STORE = 'images';
  const MAX_EDGE = 1600;
  const urls = new Map();

  let dbPromise = null;
  const open = () => {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        let req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => { dbPromise = null; reject(req.error); };
      });
    }
    return dbPromise;
  };

  const run = async (mode, fn) => {
    let db = await open();
    return new Promise((resolve, reject) => {
      let tx = db.transaction(STORE, mode);
      let req = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req && req.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  };

  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  // Shrink to MAX_EDGE and re-encode as WebP (JPEG where WebP is unavailable).
  const shrink = async (file) => {
    let bitmap = await createImageBitmap(file);
    let scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    let width = Math.max(1, Math.round(bitmap.width * scale));
    let height = Math.max(1, Math.round(bitmap.height * scale));
    let canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    let ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    let blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85));
    if (!blob) blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    return { blob, width, height };
  };

  // Stores an image file and returns its id.
  const add = async (file) => {
    let { blob, width, height } = await shrink(file);
    let id = newId();
    await run('readwrite', (store) => store.put({
      id, blob, width, height, name: file.name || '', size: blob.size, created: Date.now(),
    }));
    return id;
  };

  const get = (id) => run('readonly', (store) => store.get(id));
  const list = async () => {
    let all = await run('readonly', (store) => store.getAll());
    return all.sort((a, b) => b.created - a.created);
  };

  const remove = async (id) => {
    await run('readwrite', (store) => store.delete(id));
    if (urls.has(id)) {
      URL.revokeObjectURL(urls.get(id));
      urls.delete(id);
    }
  };

  // Object URL for an image, or null when this computer does not have it.
  const url = async (id) => {
    if (urls.has(id)) return urls.get(id);
    let record = await get(id);
    if (!record) return null;
    let objectUrl = URL.createObjectURL(record.blob);
    urls.set(id, objectUrl);
    return objectUrl;
  };

  return { add, get, list, remove, url, markdown: (id) => `![](img:${id})` };
})();
