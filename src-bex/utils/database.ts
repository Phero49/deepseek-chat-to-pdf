/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { GeneralChat } from './processChatData'

const database = 'ExportedChats'
const table = 'chats'
export function openDB(
  dbName: string,
  version: number,
  options: {
    upgrade: (
      db: IDBDatabase,
      oldVersion: number,
      newVersion: number,
      transaction: IDBTransaction,
    ) => void
  },
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(dbName, version)

    openRequest.onerror = () => {
      reject(new Error(`Failed to open database: ${openRequest.error?.message}`))
    }

    openRequest.onsuccess = () => {
      resolve(openRequest.result)
    }

    openRequest.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      options.upgrade(
        (event.target as IDBOpenDBRequest).result,
        event.oldVersion,
        event.newVersion || 1,
        (event.target as IDBOpenDBRequest).transaction!,
      )
    }
  })
}

export async function writeDb(newChat: GeneralChat) {
  try {
    const db = await openDBWrapper()
    const tx = db.transaction(table, 'readwrite')
    const store = tx.objectStore(table)
    store.put(newChat)

    // Use Promise to wrap the transaction completion
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => {
        console.log(`Transaction completed successfully for chat ${newChat.id}`)
        resolve()
      }

      tx.onerror = () => {
        console.error('Transaction error:', tx.error)
        reject(tx.error instanceof Error ? tx.error : new Error(tx.error || 'Transaction failed'))
      }

      tx.onabort = () => {
        console.warn('Transaction aborted.')
        reject(new Error('Transaction aborted'))
      }
    })

    console.log(`Chat ${newChat.id} saved to IndexedDB`)
    db.close()
    return newChat
  } catch (error) {
    console.error('Failed to save chat to IndexedDB:', error)
    throw error
  }
}

// Get chat from IndexedDB by ID
export async function getChatFromDb(chatId: string): Promise<GeneralChat | undefined> {
  try {
    // Open database
    const db: IDBDatabase = await openDBWrapper()

    // Start a read-only transaction
    const tx = db.transaction('chats', 'readonly')
    const store = tx.objectStore('chats')

    // Wrap the request in a Promise
    const chat = await new Promise<GeneralChat | undefined>((resolve, reject) => {
      const request = store.get(chatId)

      request.onsuccess = () => {
        resolve(request.result as GeneralChat | undefined)
      }

      request.onerror = () => {
        reject(new Error(request.error?.message || ''))
      }
    })

    db.close()
    return chat
  } catch (error) {
    console.error(`Error getting chat ${chatId} from database:`, error)
    return undefined
  }
}

export type RecentChat = { title: string; id: string; url: string; source: string }
// Async function to fetch recent chats in pages of 20
export async function getRecentChats(startAt = 0) {
  // Open database (make sure `openDB` is from 'idb')
  const db: IDBDatabase = await openDBWrapper()

  // Start a readonly transaction on the 'chats' store
  const tx = db.transaction('chats', 'readonly')
  const store = tx.objectStore('chats')

  const chats: RecentChat[] = []
  let skipped = 0

  return new Promise<RecentChat[]>((resolve, reject) => {
    const request = store.openCursor(undefined, 'prev') // 'prev' gives most recent first

    request.onsuccess = (event: any) => {
      const cursor: IDBCursorWithValue | null = event.target.result

      if (!cursor) {
        // No more entries → resolve what we collected
        resolve(chats)
        return
      }

      // Skip until reaching startAt
      if (skipped < startAt) {
        skipped++
        cursor.continue()
        return
      }

      // Push chat record
      const { title, id, url, source } = cursor.value as GeneralChat
      chats.push({
        title: title,
        id: id,
        url: url,
        source,
      })

      // Stop once we have 20
      if (chats.length >= 20) {
        resolve(chats)
        return
      }

      // Continue to next record
      cursor.continue()
    }

    request.onerror = () => reject(request.error)
  })
}

// Async function to delete a chat by its ID
export async function deleteChat(chatID: string) {
  // Open the database
  const db: IDBDatabase = await openDBWrapper()
  // Start a read/write transaction on the 'chats' store
  const tx = db.transaction('chats', 'readwrite')
  const store = tx.objectStore('chats')

  // Perform the deletion
  const request = store.delete(chatID)

  return new Promise<void>((resolve, reject) => {
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

async function addDefaultFont() {
  try {
    // Use public folder paths - NO IMPORT STATEMENTS
    const fontConfigs = [
      {
        name: 'Arial',
        variants: {
          normal: 'fonts/arial-normal.TTF',
          bold: 'fonts/ARIALBD.TTF',
          italics: 'fonts/ARIALI.TTF',
        },
      },
      {
        name: 'Times New Roman',
        variants: {
          normal: 'fonts/times-new-roman.ttf',
          bold: 'fonts/times-new-roman-bold.ttf',
          italics: 'fonts/times-new-roman-italic.ttf',
        },
      },
    ]

    for (const fontConfig of fontConfigs) {
      console.log(`Loading font: ${fontConfig.name}`)

      const fontData = {
        normal: await convertUrlToFile(fontConfig.variants.normal, `${fontConfig.name}-normal.ttf`),
        bold: await convertUrlToFile(fontConfig.variants.bold, `${fontConfig.name}-bold.ttf`),
        italics: await convertUrlToFile(
          fontConfig.variants.italics,
          `${fontConfig.name}-italic.ttf`,
        ),
      }

      await addChatFont(fontConfig.name, fontData)
      console.log(`Successfully added ${fontConfig.name}`)
    }

    console.log('All default fonts added successfully')
  } catch (error) {
    console.error('Error adding default fonts:', error)
  }
}

async function convertUrlToFile(url: string, filename: string): Promise<File> {
  try {
    console.log(`Fetching font from: ${url}`)
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const blob = await response.blob()
    console.log(`Successfully loaded ${filename}, size: ${blob.size} bytes`)

    return new File([blob], filename, { type: blob.type || 'font/ttf' })
  } catch (error) {
    console.error(`Error converting ${filename}:`, error)
    throw error
  }
}
// --- Centralized openDB wrapper ---
export async function openDBWrapper() {
  return openDB(database, 2, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('chats')) {
        db.createObjectStore('chats', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('collections')) {
        db.createObjectStore('collections', { keyPath: 'id' })
        console.log('created')
      }

      if (!db.objectStoreNames.contains('fonts')) {
        db.createObjectStore('fonts', { keyPath: 'id' })
        void (async () => await addDefaultFont())()
      }
    },
  })
}

// --- COLLECTION HELPERS ---

// --- Create a collection ---

export interface Collection {
  name: string
  id: string
}

export async function createCollection(collection: Collection) {
  const db = await openDBWrapper()
  const tx = db.transaction('collections', 'readwrite')
  const store = tx.objectStore('collections')

  const request = store.put({ ...collection, chatIds: [] }) // Add or update
  return new Promise<void>((resolve, reject) => {
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// --- Add a chat to a collection ---
export async function addChatToCollection(chatId: string, collectionId: string) {
  const db = await openDBWrapper()
  const tx = db.transaction('collections', 'readwrite')
  const store = tx.objectStore('collections')

  const getRequest = store.get(collectionId)
  getRequest.onsuccess = () => {
    const collection = getRequest.result

    // Add chatId if not already present
    if (!collection.chatIds.includes(chatId)) {
      collection.chatIds.push(chatId)
    }

    const putRequest = store.put(collection)
    putRequest.onsuccess = () => {
      console.log(`Chat ${chatId} added to collection ${collectionId}`)
    }
    putRequest.onerror = () => {
      console.error('Error updating collection:', putRequest.error)
    }
  }

  getRequest.onerror = () => {
    console.error('Error fetching collection:', getRequest.error)
  }
}

// --- Remove a chat from a collection (does not delete chat) ---
export async function removeChatFromCollection(collectionId: string, chatId: string) {
  const db = await openDBWrapper()
  const tx = db.transaction('collections', 'readwrite')
  const store = tx.objectStore('collections')

  const getRequest = store.get(collectionId)
  getRequest.onsuccess = () => {
    const collection = getRequest.result
    if (!collection) {
      console.warn(`Collection ${collectionId} not found`)
      return
    }

    // Remove chatId if it exists
    const index = collection.chatIds.indexOf(chatId)
    if (index > -1) {
      collection.chatIds.splice(index, 1)
    } else {
      console.warn(`Chat ${chatId} not in collection ${collectionId}`)
    }

    const putRequest = store.put(collection)
    putRequest.onsuccess = () => {
      console.log(`Chat ${chatId} removed from collection ${collectionId}`)
    }
    putRequest.onerror = () => {
      console.error('Error updating collection:', putRequest.error)
    }
  }

  getRequest.onerror = () => {
    console.error('Error fetching collection:', getRequest.error)
  }
}

// --- Delete a collection and all chats linked to it ---
// --- Delete a collection (does NOT delete chats linked to it) ---
export async function deleteCollection(collectionId: string) {
  const db = await openDBWrapper()
  const tx = db.transaction('collections', 'readwrite')
  const store = tx.objectStore('collections')

  const deleteRequest = store.delete(collectionId)
  deleteRequest.onsuccess = () => {
    console.log(`Collection ${collectionId} deleted`)
  }
  deleteRequest.onerror = () => {
    console.error('Error deleting collection:', deleteRequest.error)
  }
}

// --- Get all chats in a collection ---
export async function getCollectionItems(collectionId: string): Promise<any[]> {
  const db = await openDBWrapper()
  const tx = db.transaction(['collections', 'chats'], 'readonly')
  const collectionsStore = tx.objectStore('collections')
  const chatsStore = tx.objectStore('chats')

  return new Promise((resolve, reject) => {
    const getCollectionRequest = collectionsStore.get(collectionId)
    getCollectionRequest.onsuccess = () => {
      const collection = getCollectionRequest.result
      if (!collection || !Array.isArray(collection.chatIds)) {
        resolve([]) // no chats in collection
        return
      }

      const items: any[] = []
      let remaining = collection.chatIds.length
      if (remaining === 0) {
        resolve(items)
        return
      }

      collection.chatIds.forEach((chatId: string) => {
        const getChatRequest = chatsStore.get(chatId)
        getChatRequest.onsuccess = () => {
          if (getChatRequest.result) {
            const { title, source, id, url } = getChatRequest.result
            items.push({ title, source, id, url })
          }
          remaining--
          if (remaining === 0) resolve(items)
        }
        getChatRequest.onerror = () => {
          remaining--
          if (remaining === 0) resolve(items)
        }
      })
    }

    getCollectionRequest.onerror = () => reject(getCollectionRequest.error)
  })
}

// --- Get all collections ---
export async function getCollectionList(): Promise<Collection[]> {
  const db = await openDBWrapper()
  const tx = db.transaction('collections', 'readonly')
  const store = tx.objectStore('collections')

  const collections: any[] = []
  return new Promise((resolve, reject) => {
    const cursorRequest = store.openCursor()
    cursorRequest.onsuccess = (event: any) => {
      const cursor: IDBCursorWithValue | null = event.target.result
      if (!cursor) {
        resolve(collections)
        return
      }

      collections.push(cursor.value)
      cursor.continue()
    }
    cursorRequest.onerror = () => reject(cursorRequest.error)
  })
}

/*-------- add font ---------------*/

// --- Add a chat to a collection ---
export interface FontFiles {
  normal: File | FileList | null
  bold?: File | FileList | null
  italics?: File | FileList | null
  [key: string]: File | FileList | null // allow future styles like 'boldItalic'
}

export interface FontEntry {
  id: string // unique ID, e.g., hashs of files combined or name
  name: string // font family name
  files: FontFiles // all uploaded style variations
}

/**
 * Add or update a font with multiple style files
 */
export async function addChatFont(name: string, files: FontFiles) {
  // Generate a simple ID based on font name (or later combine file hashes)
  const id = name.toLowerCase().replace(/\s+/g, '-') // simple slug

  const db = await openDBWrapper()

  const tx = db.transaction('fonts', 'readwrite')
  const store = tx.objectStore('fonts')

  const fontEntry: FontEntry = { id, name, files }

  return new Promise<void>((resolve, reject) => {
    const request = store.put(fontEntry)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export interface FontNameEntry {
  id: string
  name: string
}

// Get font names with their IDs without loading files
export async function getFontListNames(): Promise<FontNameEntry[]> {
  const db = await openDBWrapper()
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction('fonts', 'readonly')
      const store = tx.objectStore('fonts')

      const names: FontNameEntry[] = []
      const cursorRequest = store.openCursor()

      cursorRequest.onsuccess = (e: any) => {
        const cursor: IDBCursorWithValue | null = e.target.result
        if (cursor) {
          const { id, name } = cursor.value
          names.push({ id, name })
          cursor.continue() // move to next record
        } else {
          // no more records
          resolve(names)
        }
      }

      cursorRequest.onerror = () => {
        reject(cursorRequest.error)
      }
    } catch (err) {
      reject(err)
    }
  })
}

export async function getFont(key: string): Promise<FontEntry | null> {
  const db = await openDBWrapper()

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction('fonts', 'readonly')
      const store = tx.objectStore('fonts')

      const request = store.get(key) // directly get by primary key

      request.onsuccess = (e: any) => {
        const result: FontEntry | undefined = e.target.result
        resolve(result ?? null)
      }

      request.onerror = () => reject(request.error)
    } catch (err) {
      reject(err)
    }
  })
}

// Delete a font by its name (primary key)
export async function deleteFont(id: string): Promise<void> {
  const db = await openDBWrapper()
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction('fonts', 'readwrite') // need readwrite for delete
      const store = tx.objectStore('fonts')

      const request = store.delete(id) // delete by primary key (name)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    } catch (err) {
      reject(err)
    }
  })
}
