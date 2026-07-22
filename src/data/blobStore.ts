/**
 * IndexedDB-backed blob storage for demo mode, so uploaded documents work
 * fully offline without a backend. When Supabase is connected, files go to
 * Supabase Storage instead and this store is unused.
 */

const DB_NAME = "homevault-files";
const STORE = "blobs";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function run<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const request = operation(transaction.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => db.close();
      }),
  );
}

export function putBlob(id: string, blob: Blob): Promise<IDBValidKey> {
  return run("readwrite", (store) => store.put(blob, id));
}

export function getBlob(id: string): Promise<Blob | undefined> {
  return run<Blob | undefined>("readonly", (store) => store.get(id));
}

export function deleteBlob(id: string): Promise<undefined> {
  return run("readwrite", (store) => store.delete(id));
}
