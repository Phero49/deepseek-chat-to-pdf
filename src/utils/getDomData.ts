import { getContentAsMarkdown } from './utils'

/**
 * Retrieves data associated with a specific chat ID from the IndexedDB.
 *
 * @param chatId - The unique identifier for the chat.
 * @returns A promise that resolves with the chat data or rejects with an error.
 */
export function getChatGptData(chatId: string, table: string, databaseName: string) {
  // Define the database and table names.

  // Open a connection to the IndexedDB database.
  const openRequest = indexedDB.open(databaseName)

  // Return a new promise to handle the asynchronous operation.
  return new Promise((resolve, reject) => {
    // Handle database open errors.
    openRequest.onerror = () => {
      console.error('Failed to open database:', openRequest.error)
      reject(new Error(openRequest.error?.message || 'Failed to open database'))
    }

    // Handle successful database opening.
    openRequest.onsuccess = () => {
      // Get the database instance.
      const db = openRequest.result

      console.log(db.objectStoreNames, 'names')
      // Create a read-only transaction on the specified table.
      const transaction = db.transaction(table, 'readonly')

      // Get the object store.
      const objectStore = transaction.objectStore(table)

      // Retrieve the data for the given chat ID.
      const getRequest = objectStore.get(chatId)

      // Handle successful data retrieval.
      getRequest.onsuccess = () => {
        const data = getRequest.result
        resolve(data)
      }

      // Handle errors during data retrieval.
      getRequest.onerror = () => {
        console.error('Error getting data:', getRequest.error)
        reject(new Error(getRequest.error?.message || 'Error getting data'))
      }

      // Close the database connection when the transaction is complete.
      transaction.oncomplete = () => {
        db.close()
      }
    }

    // Handle database upgrade if the database version is outdated.
    openRequest.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result
      // Create the object store if it doesn't exist.
      if (!db.objectStoreNames.contains(table)) {
        db.createObjectStore(table)
      }
    }
  })
}

export async function processGemini() {
  const messageBody = []

  const aiChat = document.querySelectorAll('user-query,model-response')
  let counter = 1
  for (const el of aiChat) {
    if (el.tagName.toLowerCase().includes('user-query')) {
      messageBody.push({
        text: el.textContent,
        id: `g-chat-${counter}`,
        role: 'USER',
      })
    } else {
      const response = el.cloneNode(true)
      const md = await getContentAsMarkdown(response as HTMLDivElement, 'gemini')
      messageBody.push({
        text: md || '',
        id: el.id,
        role: 'ASSISTANT',
      })
    }
    counter++
  }
  return messageBody
}

export async function processQwen() {
  const elements = document.querySelectorAll('[id^="message-"]')
  const messageBody = []
  for (const el of elements) {
    const isUserMessage = el.classList.contains('user-message')
    if (isUserMessage) {
      messageBody.push({
        text: el.textContent,
        id: el.id,
        role: 'USER',
      })
    } else {
      const el2 = el.cloneNode(true)
      const md = await getContentAsMarkdown(el2 as HTMLDivElement, 'qwen')
      messageBody.push({
        text: md || '',
        id: el.id,
        role: 'ASSISTANT',
      })
    }
  }
  console.log(messageBody)
  return messageBody
}
