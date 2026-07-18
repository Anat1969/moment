// תור מקומי לקפטורים שטרם הועלו — עובד גם בלי רשת
const DB = 'moment-db'
const STORE = 'queue'

function open(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1)
    r.onupgradeneeded = () => {
      if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE, { keyPath: 'id' })
    }
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  })
}

async function tx(mode: IDBTransactionMode) {
  const db = await open()
  return db.transaction(STORE, mode).objectStore(STORE)
}

export async function qPut(item: any): Promise<void> {
  const s = await tx('readwrite')
  return new Promise((res, rej) => {
    const r = s.put(item)
    r.onsuccess = () => res()
    r.onerror = () => rej(r.error)
  })
}

export async function qAll<T = any>(): Promise<T[]> {
  const s = await tx('readonly')
  return new Promise((res, rej) => {
    const r = s.getAll()
    r.onsuccess = () => res(r.result as T[])
    r.onerror = () => rej(r.error)
  })
}

export async function qDel(id: string): Promise<void> {
  const s = await tx('readwrite')
  return new Promise((res, rej) => {
    const r = s.delete(id)
    r.onsuccess = () => res()
    r.onerror = () => rej(r.error)
  })
}
