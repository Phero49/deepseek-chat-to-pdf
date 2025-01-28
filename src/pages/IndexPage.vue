<template>
  <teleport to="#header" v-if="$route.query['mode'] == 'readonly'">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title> AI chat to PDF </q-toolbar-title>
        <q-btn label="edit " flat icon="edit" :to="`/${chatId}?mode=edit`" />
        <q-btn
          label="export "
          flat
          icon="export"
          @click="generatePdf(editorRef?.getContentEl() as HTMLElement, chatData?.title as string)"
        />
      </q-toolbar>
    </q-header>
  </teleport>
  <q-page>
    <q-editor
      content-class="q-mx-lg q-px-md"
      v-model="editor"
      min-height="5rem"
      toolbar-bg="primary"
      toolbar-text-color="white"
      :toolbar="$route.query['mode'] == 'readonly' ? [] : toolbar"
      :readonly="$route.query['mode'] == 'readonly'"
      flat
      ref="editorRef"
    >
      <template #token>
        <q-btn
          label="export"
          unelevated
          color="orange"
          @click="generatePdf(editorRef?.getContentEl() as HTMLElement, chatData?.title as string)"
        />
      </template>
    </q-editor>
  </q-page>
</template>

<script setup lang="ts">
import { type ChatItem } from 'app'
import { QEditor, useQuasar } from 'quasar'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import '../css/deepseek-main.css'
import 'katex/dist/katex.min.css'
import 'katex/dist/katex.mjs'
import 'highlight.js/styles/atom-one-light.css'
import higlightjs from 'highlight.js'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
//import { gfm } from 'turndown-plugin-gfm'
//import showdown from 'showdown'
import { watch } from 'vue'
import { generatePdf } from './generate-pdf'
const route = useRoute()
const chatData = ref<ChatItem>()
const $q = useQuasar()
const bex = $q.bex
const editor = ref('')
const chatId = ref(route.params['chatId'])
const mode = ref(route.query['mode'])
const editorRef = ref<QEditor>()

function getChat() {
  const chatId = route.params['chatId']
  console.log('reload')

  bex
    .send({
      event: 'storage.get',
      to: 'background',
      payload: chatId,
    })
    .then((response: ChatItem) => {
      if (editorRef.value != undefined) {
        if (chatData.value != undefined) {
          chatData.value = undefined
          editor.value = ''
        }
        chatData.value = response

        response.chat.forEach((prompt) => {
          // Create container for user prompt
          const userPromptContainer = document.createElement('div')
          userPromptContainer.innerHTML = prompt.prompt
          userPromptContainer.classList.add('user-prompt') // Apply class
          userPromptContainer.setAttribute(
            'style',
            `  padding: 10px;
  margin: 20px 0;
  border-radius: 8px;
  background-color: #f0f0f0;
  color: #333;
  font-weight: bold;
  font-size: 18px;`,
          )
          // Create container for model response
          const modelPromptContainer = document.createElement('div')
          modelPromptContainer.innerHTML = prompt.response
          modelPromptContainer.classList.add('model-prompt') // Apply class

          editor.value += userPromptContainer.outerHTML
          editor.value += modelPromptContainer.outerHTML
        })
      }
    })
    .catch((err: never) => {
      console.log('error:', err)
    })
}

onMounted(() => {
  getChat()
})
watch(route, (change) => {
  mode.value = route.query['mode']
  if (change.params['chatId'] != chatId.value) {
    chatId.value = change.params['chatId']

    getChat()
  }
})

const toolbar = [
  [
    {
      label: $q.lang.editor.align,
      icon: $q.iconSet.editor.align,
      fixedLabel: true,
      options: ['left', 'center', 'right', 'justify'],
    },
  ],
  ['bold', 'italic', 'strike', 'underline', 'subscript', 'superscript'],
  ['link', 'image'],

  [
    {
      label: $q.lang.editor.fontSize,
      icon: $q.iconSet.editor.fontSize,
      fixedLabel: true,
      fixedIcon: true,
      list: 'no-icons',
      options: ['size-1', 'size-2', 'size-3', 'size-4', 'size-5', 'size-6', 'size-7'],
    },
  ],
  ['quote', 'unordered', 'ordered', 'outdent', 'indent'],

  ['undo', 'redo'],
  ['token'],
]

higlightjs.highlightAll()
</script>
<style>
/* @import url(''); */
@import url('../css/css2.css');
.q-editor__toolbars-container {
  top: 0px;
  z-index: 1;
  position: fixed;
}
.user-prompt {
  padding: 10px;
  margin: 20px 0;
  border-radius: 8px;
  background-color: #f0f0f0;
  color: #333;
  font-weight: bold;
  font-size: 18px;
}

.model-prompt {
  padding: 10px;
  margin: 10px 0;
  border-radius: 8px;
  color: rgb(37, 37, 37);
}

.model-prompt pre {
  padding: 10px;
}
.md-code-block {
  margin: 10px;
  padding: 10px;
  border-radius: 15px;
}
.ds-markdown h3 {
  font-size: calc(var(--ds-md-zoom) * 16px);
  line-height: 1.5;
}
.md-code-block-banner {
  display: none;
}
.md-code-block-footer {
  display: none;
}
h3 {
  display: block;
  font-size: 1.17em;
  margin-block-start: 1em;
  margin-block-end: 1em;
  margin-inline-start: 0px;
  margin-inline-end: 0px;
  font-weight: bold;
  unicode-bidi: isolate;
}
h1 {
  font-size: 2.5em; /* 40px */
  font-weight: bold;
  margin: 20px 0;
}

h2 {
  font-size: 2em; /* 32px */
  font-weight: bold;
  margin: 18px 0;
}

h3 {
  font-size: 1.75em; /* 28px */
  font-weight: bold;
  margin: 16px 0;
}

h4 {
  font-size: 1.5em; /* 24px */
  font-weight: bold;
  margin: 14px 0;
}

h5 {
  font-size: 1.25em; /* 20px */
  font-weight: bold;
  margin: 12px 0;
}

h6 {
  font-size: 1em; /* 16px */
}
.model-prompt p {
  font-size: 16px;
}
</style>
