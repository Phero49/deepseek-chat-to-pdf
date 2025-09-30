/**
 * Importing the file below initializes the content script.
 *
 * Warning:
 *   Do not remove the import statement below. It is required for the extension to work.
 *   If you don't need createBridge(), leave it as "import '#q-app/bex/content'".
 */
import { createBridge } from '#q-app/bex/content'
import { getChatGptData, processGemini, processQwen } from 'src/utils/getDomData'
// The use of the bridge is optional.
const bridge = createBridge({ debug: false })
/**
 * bridge.portName is 'content@<path>-<number>'
 *   where <path> is the relative path of this content script
 *   filename (without extension) from /src-bex
 *   (eg. 'my-content-script', 'subdir/my-script')
 *   and <number> is a unique instance number (1-10000).
 */

declare module '@quasar/app-vite' {
  interface BexEventMap {
    'some.event': [{ someProp: string }, void]
  }
}

// Hook into the bridge to listen for events sent from the other BEX parts.
bridge.on('some.event', ({ payload }) => {
  if (payload.someProp) {
    // Access a DOM element from here.
    // Document in this instance is the underlying website the contentScript runs on
    const el = document.getElementById('some-id')
    if (el) {
      el.innerText = 'Quasar Rocks!'
    }
  }
})

/**
 * Leave this AFTER you attach your initial listeners
 * so that the bridge can properly handle them.
 *
 * You can also disconnect from the background script
 * later on by calling bridge.disconnectFromBackground().
 *
 * To check connection status, access bridge.isConnected
 */
bridge
  .connectToBackground()
  .then(() => {
    console.log('Connected to background')
  })
  .catch((err) => {
    console.error('Failed to connect to background:', err)
  })

const body = document.querySelector('body')

if (body) {
  const btn = body.querySelector('#exportBtn')
  if (btn == null) {
    // Create the button
    const button = document.createElement('button')
    button.textContent = 'export chat'

    button.id = 'exportBtn'
    button.style.position = 'fixed'
    button.style.right = '20px'
    button.style.bottom = '25%'
    button.style.padding = '10px 16px'
    button.style.fontSize = '16px'
    button.style.cursor = 'pointer'
    button.style.zIndex = '9999'
    button.style.border = 'none'
    button.style.borderRadius = '10px'
    button.style.background = 'rgba(0, 123, 255, 0.643)'
    button.style.color = 'white'
    button.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.2)'
    button.style.transition = 'all 0.3s ease-in-out'

    // Hover effect
    button.onmouseover = () => {
      button.style.background = '#0056b3a4'
      button.style.boxShadow = '0 6px 15px rgba(0, 0, 0, 0.3)'
    }

    button.onmouseleave = () => {
      button.style.background = 'rgba(0, 123, 255, 0.643)'
      button.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.2)'
    }

    // When drag starts, remove right/bottom positioning
    button.addEventListener('mousedown', (evt) => {
      // Prevent text selection during drag
      evt.preventDefault()

      // Convert from right/bottom to left/top positioning for consistent dragging
      const rect = button.getBoundingClientRect()
      button.style.right = ''
      button.style.bottom = ''
      button.style.left = rect.left + 'px'
      button.style.top = rect.top + 'px'

      const shiftX = evt.clientX - rect.left
      const shiftY = evt.clientY - rect.top

      // Set cursor to indicate dragging
      button.style.cursor = 'grabbing'

      function onMouseMove(event: MouseEvent) {
        // Constrain to window boundaries
        let newLeft = event.clientX - shiftX
        let newTop = event.clientY - shiftY

        // Don't allow dragging outside window
        const buttonWidth = button.offsetWidth
        const buttonHeight = button.offsetHeight

        if (newLeft < 0) newLeft = 0
        if (newTop < 0) newTop = 0
        if (newLeft > window.innerWidth - buttonWidth) newLeft = window.innerWidth - buttonWidth
        if (newTop > window.innerHeight - buttonHeight) newTop = window.innerHeight - buttonHeight

        button.style.left = newLeft + 'px'
        button.style.top = newTop + 'px'
      }

      function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
        button.style.cursor = 'pointer' // Reset cursor
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    })

    // Attach event listener for the button click
    const onClick = async () => {
      if (!bridge.isConnected) {
        bridge
          .connectToBackground()
          .then(() => {
            console.log('Connected to background')
            void onClick()
          })
          .catch((err) => {
            console.error('Failed to connect to background:', err)
          })
      }

      // const dbs = {chatgpt:{
      //   db:"conversionDatabase",
      //   table:"conversations"
      // }}

      const title = window.document.title
      const id = window.location.href.split('/').at(-1)
      const url = window.location.href
      const origin = window.location.origin
      let chatSource = 'chatgpt'
      if (origin.includes('deepseek')) {
        chatSource = 'deepseek'
        try {
          const chat = await getChatGptData(id as string, 'history-message', 'deepseek-chat')
          await bridge.send({
            event: 'chat.receiveChat',
            to: 'background',
            payload: { title, chat, id, url, source: chatSource }, // Include chat array inside payload
          })
        } catch (error) {
          console.error('error getting chatgpt dat', error)
        }
      } else if (origin.includes('chatgpt')) {
        try {
          const chat = await getChatGptData(id as string, 'conversations', 'ConversationsDatabase')
          await bridge.send({
            event: 'chat.receiveChat',
            to: 'background',
            payload: { title, chat, id, url, source: chatSource }, // Include chat array inside payload
          })
        } catch (error) {
          console.error('error getting chatgpt dat', error)
        }

        return
      } else if (origin.includes('gemini')) {
        const chat = await processGemini()
        await bridge.send({
          event: 'chat.receiveChat',
          to: 'background',
          payload: {
            title: title + '-' + new Date().toLocaleString(),
            messages: chat,
            id,
            url,
            source: 'gemini',
          }, // Include chat array inside payload
        })
      } else if (origin.includes('qwen')) {
        const chat = await processQwen()
        await bridge.send({
          event: 'chat.receiveChat',
          to: 'background',
          payload: {
            title: title + '-' + new Date().toLocaleString(),
            messages: chat,
            id,
            url,
            source: 'qwen',
          }, // Include chat array inside payload
        })
      }

      // Ensure this is the correct class/ID
    }

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    button.addEventListener('click', onClick)

    // Append the button to the body
    body.appendChild(button)
  }
}
