/**
 * Importing the file below initializes the content script.
 *
 * Warning:
 *   Do not remove the import statement below. It is required for the extension to work.
 *   If you don't need createBridge(), leave it as "import '#q-app/bex/content'".
 */
import { createBridge } from '#q-app/bex/content'

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

/*
// More examples:

// Listen to a message from the client
bridge.on('test', message => {
  console.log(message);
  console.log(message.payload);
});

// Send a message and split payload into chunks
// to avoid max size limit of BEX messages.
// Warning! This happens automatically when the payload is an array.
// If you actually want to send an Array, wrap it in an object.
bridge.send({
  event: 'test',
  to: 'app',
  payload: [ 'chunk1', 'chunk2', 'chunk3', ... ]
}).then(responsePayload => { ... }).catch(err => { ... });

// Send a message and wait for a response
bridge.send({
  event: 'test',
  to: 'background',
  payload: { banner: 'Hello from content-script' }
}).then(responsePayload => { ... }).catch(err => { ... });

// Listen to a message from the client and respond synchronously
bridge.on('test', message => {
  console.log(message);
  return { banner: 'Hello from a content-script!' };
});

// Listen to a message from the client and respond asynchronously
bridge.on('test', async message => {
  console.log(message);
  const result = await someAsyncFunction();
  return result;
});
bridge.on('test', message => {
  console.log(message);
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ banner: 'Hello from a content-script!' });
    }, 1000);
  });
});

// Broadcast a message to background, app & the other content scripts
bridge.portList.forEach(portName => {
  bridge.send({ event: 'test', to: portName, payload: 'Hello from content-script!' });
});

// Find any connected content script and send a message to it
const contentPort = bridge.portList.find(portName => portName.startsWith('content@'));
if (contentPort) {
  bridge.send({ event: 'test', to: contentPort, payload: 'Hello from a content-script!' });
}

// Send a message to a certain content script
bridge
  .send({ event: 'test', to: 'content@my-content-script-2345', payload: 'Hello from a content-script!' })
  .then(responsePayload => { ... })
  .catch(err => { ... });

// Listen for connection events
// (the "@quasar:ports" is an internal event name registered automatically by the bridge)
// --> ({ portList: string[], added?: string } | { portList: string[], removed?: string })
bridge.on('@quasar:ports', ({ portList, added, removed }) => {
  console.log('Ports:', portList);
  if (added) {
    console.log('New connection:', added);
  } else if (removed) {
    console.log('Connection removed:', removed);
  }
});

// Current bridge port name (can be 'content@<name>-<xxxxx>')
console.log(bridge.portName);

// Dynamically set debug mode
bridge.setDebug(true); // boolean

// Log a message on the console (if debug is enabled)
bridge.log('Hello world!');
bridge.log('Hello', 'world!');
bridge.log('Hello world!', { some: 'data' });
bridge.log('Hello', 'world', '!', { some: 'object' });
// Log a warning on the console (regardless of the debug setting)
bridge.warn('Hello world!');
bridge.warn('Hello', 'world!');
bridge.warn('Hello world!', { some: 'data' });
bridge.warn('Hello', 'world', '!', { some: 'object' });
*/

const body = document.querySelector('body')
console.log(body)

if (body) {
  const btn = body.querySelector('#exportBtn')
  if (btn == null) {
    // Create the button
    const button = document.createElement('button')
    button.textContent = 'export chat'

    button.id = 'exportBtn'
    button.style.position = 'fixed'
    button.style.right = '20px' // Keeps it slightly away from the edge
    button.style.bottom = '25%' // 30% from the bottom
    button.style.padding = '10px 16px' // Larger padding for a better feel
    button.style.fontSize = '16px'
    button.style.cursor = 'pointer'
    button.style.zIndex = '9999' // Ensures it's on top
    button.style.border = 'none'
    button.style.borderRadius = '10px' // Smooth rounded edges
    button.style.background = '#007BFF' // Primary blue
    button.style.color = 'white'
    button.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.2)' // Soft shadow for depth
    button.style.transition = 'all 0.3s ease-in-out' // Smooth transition effect

    // Hover effect
    button.onmouseover = () => {
      button.style.background = '#0056b3' // Darker blue on hover
      button.style.boxShadow = '0 6px 15px rgba(0, 0, 0, 0.3)' // Enhanced shadow
    }

    button.onmouseleave = () => {
      button.style.background = '#007BFF' // Back to original color
      button.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.2)' // Reset shadow
    }

    // Attach event listener for the button click
    button.addEventListener('click', () => {
      let chatSelector = ''
      let userPromptSelector = ''
      const title = window.document.title
      const id = window.location.href.split('/').at(-1)
      const url = window.location.href
      const origin = window.location.origin
      if (origin.includes('deepseek')) {
        chatSelector = '.ds-markdown--block'
        userPromptSelector = '.fa81'
      } else {
        chatSelector = '.markdown'
        userPromptSelector = '.bg-token-message-surface'
      }

      // Ensure this is the correct class/ID
      const modelResponses = document.querySelectorAll<HTMLDivElement>(chatSelector)
      const userPrompts = document.querySelectorAll<HTMLDivElement>(userPromptSelector)

      // Ensure userPrompts and modelResponses have matching indexes
      const chat = Array.from(modelResponses).map((data, i) => {
        const { display } = window.getComputedStyle(data)
        console.log(display, display == '', i)
        if (display == 'none' || display == '') {
          return
        }
        if (i > userPrompts.length - 1) {
          return {
            prompt: '', // Trim whitespace
            response: modelResponses.item(i)?.innerHTML.trim() || '', // Handle potential null values
          }
        }
        return {
          prompt: userPrompts.item(i).innerText.trim(), // Trim whitespace
          response: data.innerHTML.trim() || '', // Handle potential null values
        }
      })

      bridge
        .send({
          event: 'chat.receiveChat',
          to: 'background',
          payload: { title, chat, id, url }, // Include chat array inside payload
        })
        .then(() => {})
        .catch(() => {})
    })

    // Append the button to the body
    body.appendChild(button)
  }
}
