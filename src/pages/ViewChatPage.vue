<template>
  <q-layout view="hHh LpR fFf">
    <q-header elevated class="bg-white text-grey-10" height-hint="98" style="z-index: 500">
      <div class="row justify-between q-my-xs items-center">
        <div class="row items-center">
          <q-btn icon="arrow_back" flat dense @click="$router.back()" />
          <div v-if="res != undefined" class="row justify-between">
            <a :href="res!.url" style="text-decoration: none" class="text-h6 text-grey-10"
              >{{ res?.title }}
            </a>
          </div>
        </div>
        <q-card-actions>
          <q-btn unelevated no-caps color="red-5" label="Export Tips" @click="openPrintTips" />
          <q-btn
            unelevated
            color="primary"
            icon="download"
            label="Download"
            @click="startConverting"
          />
        </q-card-actions>
      </div>

      <q-bar class="bg-primary"> </q-bar>
    </q-header>
    <q-drawer
      side="left"
      v-model="drawerLeft"
      bordered
      :width="330"
      :breakpoint="500"
      content-class="bg-grey-3"
    >
      <q-list class="text-subtitle2 text-grey-10">
        <q-card-actions align="between">
          <q-chip
            clickable
            label="prompts"
            @click="tabs = 'prompts'"
            :color="tabs == 'prompts' ? 'primary' : ''"
            :text-color="tabs == 'prompts' ? 'white' : ''"
          />
          <q-chip
            clickable
            label="outline"
            :text-color="tabs == 'outline' ? 'white' : ''"
            @click="tabs = 'outline'"
            :color="tabs == 'outline' ? 'primary' : ''"
          />
        </q-card-actions>
        <div v-if="tabs == 'prompts'">
          <q-item
            clickable
            @click="goTo(question.id)"
            v-ripple
            v-for="(question, i) in questionsString"
            :key="i"
          >
            <q-tooltip>
              {{ question.text }}
            </q-tooltip>
            <q-item-section>
              <q-item-label lines="2"> {{ question.text }} </q-item-label>
            </q-item-section>
            <q-card-actions vertical>
              <q-btn
                @click="
                  () => {
                    question.hide = !question.hide
                    hidePrompt(question.hide, question.id)
                  }
                "
                dense
                size="sm"
                :icon="question.hide ? 'visibility' : 'visibility_off'"
                flat
              />
              <q-btn icon="download" size="sm" flat dense @click="downloadChat(question.id)" />
            </q-card-actions>

            <q-item-section side> </q-item-section>
          </q-item>
        </div>

        <div v-if="tabs == 'outline'">
          <div v-if="tabs === 'outline'">
            <q-tree
              v-if="outline"
              :nodes="outline"
              node-key="id"
              label-key="title"
              default-expand-all
              v-model:selected="selected"
              selectable
              @update:selected="goTo"
            />
          </div>
        </div>
      </q-list>
    </q-drawer>
    <q-page-container>
      <q-page class="column items-center">
        <q-editor
          content-class="  md-content shadow-1 q-px-md"
          v-model="editor"
          min-height="5rem"
          :content-style="{ maxWidth: `${816}px`, width: '100%', fontSize: 11 + 'pt' }"
          toolbar-text-color="grey-2"
          :toolbar="toolbar"
          :readonly="headerStore().header"
          flat
          ref="editorRef"
        >
        </q-editor>
      </q-page>
    </q-page-container>
  </q-layout>

  <q-dialog v-model="showPrintTips" persistent>
    <q-card style="max-width: 700px; width: 100%">
      <!-- Dialog Header -->
      <q-card-section class="row items-center justify-between">
        <div class="text-h6">Printing Tips</div>
        <q-btn icon="close" flat round dense @click="showPrintTips = false" />
      </q-card-section>

      <!-- Dialog Body -->
      <q-card-section class="q-pt-none">
        <p>
          If your exported PDF shows extra headers/footers or missing background colors, follow the
          steps below for your browser.
        </p>

        <div class="q-mb-md">
          <div class="text-subtitle1 q-mb-xs">Chromium-based browsers (Chrome, Edge, Brave)</div>
          <ol class="q-pl-md">
            <li>when the print dialog opens</li>
            <li>Click <b>More settings</b> in the left panel.</li>
            <li>Uncheck <b>Headers and footers</b> to remove date, URL, and page numbers.</li>
            <li>
              Check <b>Background graphics</b> (sometimes shown as "Background colors and images")
              to include chat colors and highlights.
            </li>
          </ol>
        </div>

        <div class="q-mb-md">
          <div class="text-subtitle1 q-mb-xs">Firefox</div>
          <ol class="q-pl-md">
            <li>when the print dialog opens</li>
            <li>
              Click <b>More settings</b> (or open the "Options" section at the bottom of the
              dialog).
            </li>
            <li>Uncheck <b>Print headers and footers</b> to remove date, URL, and page numbers.</li>
            <li>
              Check <b>Print backgrounds (colors and images)</b> to include chat colors and
              highlights.
            </li>
          </ol>
        </div>
      </q-card-section>

      <!-- Dialog Actions -->
      <q-card-actions align="right">
        <q-btn flat label="Close" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="selectFonts" @before-show="loadFontsList">
    <q-card style="width: 100%; max-width: 500px" class="q-pa-md">
      <!-- Title -->
      <q-card-section class="text-h6 text-center"> Font Selection </q-card-section>

      <q-separator />

      <!-- Message -->
      <q-card-section class="text-body1">
        <p>
          If your text contains <b>Chinese</b> or other <b>non-Latin</b> characters, you must use a
          font that supports them.
        </p>
        <p class="text-caption text-grey-9">
          To keep the extension lightweight, large Chinese font families have been removed. Please
          <b>upload your own</b> font file if required. Only <code>.ttf</code> fonts are supported.
        </p>
      </q-card-section>

      <!-- Font selection dropdown -->
      <q-card-section>
        <q-select
          v-model="selectedFont"
          option-value="id"
          option-label="name"
          :options="fontList"
          label="Select font"
          outlined
        />
      </q-card-section>

      <!-- Actions -->
      <q-card-actions align="right">
        <q-btn label="Generate PDF" :loading="loading" icon="export" @click="startConverting" />
      </q-card-actions>
      <div v-if="loading" class="text-red-5">
        if you document contains math symbols it can a bit slow
      </div>
    </q-card>
  </q-dialog>
  <iframe style="display: none" id="renderDocs"> </iframe>
</template>

<script setup lang="ts">
import { QEditor, useQuasar } from 'quasar'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import 'katex/dist/katex.min.css'
import 'katex/dist/katex.mjs'
import 'highlight.js/styles/atom-one-light.css'
import higlightjs from 'highlight.js'
import { headerStore } from 'src/stores/header'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
//import { gfm } from 'turndown-plugin-gfm'
//import showdown from 'showdown'
import { watch } from 'vue'
import { generatePdf } from './generate-pdf'
import type { GeneralChat } from 'app/src-bex/utils/processChatData'
import { getOutline, type OutlineNode, processMd } from 'src/utils/utils'
import { type FontNameEntry, getFontListNames } from 'app/src-bex/utils/database'
const route = useRoute()
const $q = useQuasar()
const bex = $q.bex
const editor = ref('')
const chatId = ref(route.params['chatId'])
const mode = ref(route.query['mode'])
const editorRef = ref<QEditor>()
const selectFonts = ref(headerStore().selectFont)
const selectedFont = ref<FontNameEntry>()
const drawerLeft = ref(true)
const selected = ref(null)
const questionsString = ref<
  {
    text: string
    hide: boolean
    id: string
  }[]
>([])
const outline = ref<OutlineNode[]>()
const tabs = ref('prompts')
const fontList = ref<FontNameEntry[]>([])
const loadFontsList = async () => {
  fontList.value = await getFontListNames()
}
const loading = ref(false)
function startConverting() {
  loading.value = true
  void generatePdf(
    selectedFont.value?.id as string,
    (questionElement.value?.nextElementSibling as HTMLElement) ||
      (editorRef.value?.getContentEl() as HTMLElement),
    res.value?.title as string,
    res.value?.source,
    outline.value,
  )
  loading.value = false
  questionElement.value = null
}

// control dialog visibility
const showPrintTips = ref(false)

// expose function to open dialog
function openPrintTips() {
  showPrintTips.value = true
}

const questionElement = ref<HTMLElement | null>(null)
function downloadChat(id: string) {
  if (editorRef.value == null) {
    return
  }
  const el = editorRef.value.getContentEl().querySelector(`#${id}`) as HTMLElement
  questionElement.value = el
  startConverting()
}
// Convert outline → q-tree format

const goTo = (id: string) => {
  if (editorRef.value == null) {
    return
  }
  //  console.log(id)
  const el = editorRef.value.getContentEl().querySelector(`#${id}`)
  //  console.log(el)
  el?.scrollIntoView({
    block: 'start',
    behavior: 'smooth',
  })
}

function hidePrompt(hide: boolean, id: string) {
  if (editorRef.value == null) {
    return
  }
  const el = editorRef.value.getContentEl().querySelector<HTMLDivElement>(`#${id}`)
  if (el) {
    el.style.display = hide ? 'none' : 'block'
    const el2 = el.nextElementSibling as HTMLDivElement
    if (el2) {
      el2.style.display = hide ? 'none' : 'block'
    }
  }
}
const res = ref<GeneralChat>()
function getChat() {
  const chatId = route.params['chatId']

  bex
    .send({
      event: 'storage.getChatFromDB',
      to: 'background',
      payload: chatId,
    })
    .then((response: GeneralChat) => {
      res.value = response
      questionsString.value = response.messages
        .map((v, i) => {
          if (response.source != 'chatgpt') {
            if ((v.role ?? '').toLowerCase() == 'user') {
              return { text: v.text, hide: false, id: 'h-' + v.id }
            }
            return null
          }
          if ((i + 1) % 2 == 0) {
            return { text: v.text, hide: false, id: 'h-' + v.id }
          }
          return null
        })
        .filter((v) => v != null)

      response.messages.forEach((m, i) => {
        if (editorRef.value == undefined) {
          return
        }

        let prompt = true
        if (response.source != 'chatgpt') {
          prompt = (m.role ?? '').toLowerCase() == 'user'
        } else {
          if (i == 0) {
            return
          }
          prompt = (i + 1) % 2 === 0
        }

        const el = editorRef.value.getContentEl() as HTMLDivElement
        processMd({
          index: i + 1,
          isPrompt: prompt,
          el: el,
          text: m.text,
          id: 'h-' + m.id,
          source: response.source,
        })
      })
      if (editorRef.value == undefined) {
        return
      }

      outline.value = getOutline(editorRef.value.getContentEl() as HTMLDivElement)
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
  ['print'],
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
const hide = ref(true)
onMounted(() => {
  hide.value = true
})
</script>
<style>
/* @import url(''); */
.q-editor__toolbars-container {
  top: 60px;
  z-index: 990;
  position: fixed;
  width: 100vw;
  background-color: var(--q-primary);
}
</style>
