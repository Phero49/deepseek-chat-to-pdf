/**
 * Importing the file below initializes the extension background.
 *
 * Warnings:
 * 1. Do NOT remove the import statement below. It is required for the extension to work.
 *    If you don't need createBridge(), leave it as "import '#q-app/bex/background'".
 * 2. Do NOT import this file in multiple background scripts. Only in one!
 * 3. Import it in your background service worker (if available for your target browser).
 */
import { createBridge } from '#q-app/bex/background'
import { getChatFromDb, writeDb } from './utils/database'
import type { ChatgptChatData, GeneralChat } from './utils/processChatData'
import { processChatGPT, processDeepseekChat } from './utils/processChatData'

function openExtension() {
  chrome.tabs.create(
    {
      url: chrome.runtime.getURL('www/index.html'),
    },
    (/* newTab */) => {
      // Tab opened.
    },
  )
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('installed')
})
chrome.action.onClicked.addListener(openExtension)
interface ChatItem {
  id: string
  url: string
  title: string
  source: string
  timeStamp?: number
  chat: {
    prompt: string
    response: string
  }[]
}
declare module '@quasar/app-vite' {
  interface BexEventMap {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    log: [{ message: string; data?: any[] }, void]
    getTime: [never, number]
    'chat.receiveChat': [ChatItem]
    'chat.display': [ChatItem]
    'chat.open': [string]
    'chat.list': []
    'storage.get': [string | undefined, any]
    'storage.getChatFromDB': [GeneralChat]
    'storage.set': [{ key: string; value: any }, void]
    'storage.remove': [string, void]
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }
}

/**
 * Call useBridge() to enable communication with the app & content scripts
 * (and between the app & content scripts), otherwise skip calling
 * useBridge() and use no bridge.
 */
const bridge = createBridge({ debug: false })

bridge.on('log', ({ from, payload }) => {
  console.log(`[BEX] @log from "${from}"`, payload)
})

bridge.on('getTime', () => {
  return Date.now()
})
bridge.on('chat.list', async () => {
  const data = await chrome.storage.local.get(null)
  return data
})

bridge.on('storage.get', ({ payload: key }) => {
  return new Promise((resolve) => {
    if (key === void 0) {
      chrome.storage.local.get(null, (items) => {
        // Group the values up into an array to take advantage of the bridge's chunk splitting.
        resolve(Object.values(items))
      })
    } else {
      chrome.storage.local.get([key], (items) => {
        resolve(items[key])
      })
    }
  })
})

// eslint-disable-next-line @typescript-eslint/no-misused-promises
bridge.on('storage.set', async ({ payload: { key, value } }) => {
  await chrome.storage.local.set({ [key]: value })
  return
})

// eslint-disable-next-line @typescript-eslint/no-misused-promises, @typescript-eslint/no-unused-vars
bridge.on('storage.remove', async ({ payload: key }) => {
  //chrome.storage.local.remove(key);
})

/************ none legacy  */

//get chat from the dom
bridge.on('chat.receiveChat', async ({ payload }) => {
  const p = payload as ChatItem
  p['timeStamp'] = Date.now()
  let newChat: GeneralChat

  switch (p.source) {
    case 'chatgpt':
      newChat = await processChatGPT(payload as ChatgptChatData)
      break
    case 'deepseek':
      // newChat = await
      newChat = await processDeepseekChat(payload as ChatgptChatData)
      break
    case 'qwen':
      newChat = await writeDb(payload as GeneralChat)
      break
    case 'gemini':
      newChat = await writeDb(payload as GeneralChat)
      break
    default:
      break
  }

  await chrome.storage.local.set({ [p.id]: p })

  chrome.tabs.create(
    {
      url: chrome.runtime.getURL(`www/index.html#/`),
    },
    (/* newTab */) => {
      // Tab opened.
      setTimeout(() => {
        void bridge.send({ to: 'app', event: 'chat.open', payload: newChat.id })
      }, 2000)
    },
  )
  return true
})

//get chat from index db by chatid
bridge.on('storage.getChatFromDB', ({ payload: key }) => {
  console.log('key', key)
  return getChatFromDb(key)
})
