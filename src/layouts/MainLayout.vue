<template>
  <q-layout view="hHh LpR fFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title> AI chat to PDF </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list separator class="text-subtitle1 q-mt-md">
        <q-item
          clickable
          @click="activeTab = 'recent'"
          :class="{ 'text-primary text-weight-bold ': activeTab == 'recent' }"
        >
          <q-item-section top avatar>
            <q-avatar color="black" text-color="white" icon="history" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Recent</q-item-label>
          </q-item-section>
        </q-item>

        <q-item
          clickable
          @click="activeTab = 'collections'"
          :class="{ 'text-primary text-weight-bold ': activeTab == 'collections' }"
        >
          <q-item-section top avatar>
            <q-avatar color="pink" text-color="white" icon="folder" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-subtitle1">Collections</q-item-label>
          </q-item-section>
        </q-item>

        <q-item
          clickable
          @click="activeTab = 'fonts'"
          dissable
          :class="{ 'text-primary text-weight-bold ': activeTab == 'fonts' }"
        >
          <q-item-section top avatar>
            <q-avatar color="purple" text-color="white" :icon="symRoundedBrandFamily" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-subtitle1">Fonts</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <q-page padding class="bg-grey-2">
        <div style="max-width: 550px">
          <div class="row q-mb-md justify-between q-py-md">
            <div class="text-capitalize text-h5 text-bold">
              {{ activeTab }}
            </div>
            <div>
              <q-btn
                color="primary"
                icon="add"
                v-if="activeTab == 'collections'"
                label="new collection"
                @click="newCollectionDialog = true"
                no-caps
                unelevated
              />

              <q-btn
                color="primary"
                icon="add"
                v-if="activeTab == 'fonts'"
                label="upload font"
                @click="addNewFont"
                no-caps
                unelevated
              />
            </div>
          </div>

          <q-separator spaced class="q-my-md" />
          <template v-if="activeTab == 'recent'"> <ChatList /> </template
          ><template v-if="activeTab == 'collections'"> <CollectionList /> </template
          ><template v-if="activeTab == 'fonts'">
            <FontList />
          </template>
        </div>
      </q-page>
    </q-page-container>
    <q-dialog v-model="newCollectionDialog">
      <q-card style="max-width: 580x; width: 100%">
        <div class="text-center">New collections</div>
        <q-card-section class="row items-center">
          <q-input v-model="collectionName" type="text" label="collection" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn flat label="submit" color="primary" @click="newCollection" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="addFonts" persistent>
      <q-card style="max-width: 580px; width: 100%">
        <q-card-section class="row items-center">
          <q-form style="width: 100%" @submit="newCollection" class="q-gutter-md">
            <q-input v-model="fontName" type="text" stack-label label="Font family name" />
            <div v-for="(_, key) in fonts" :key="key">
              <div class="text-subtitle2 text-capitalize text-grey-8">
                {{ key }} {{ key == 'italicBold' ? '(optional)' : '' }}
              </div>
              <q-input v-model="fonts[key] as FileList" type="file" dense accept=".ttf"> </q-input>
            </div>

            <div>
              <q-btn label="Submit" type="submit" color="primary" />
              <q-btn label="close" v-close-popup color="red" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'

import { symRoundedBrandFamily } from '@quasar/extras/material-symbols-rounded'
import ChatList from '../components/ChatList.vue'
import CollectionList from '../components/CollectionList.vue'
import { addChatFont, type FontFiles } from 'app/src-bex/utils/database'
import { useQuasar } from 'quasar'
import FontList from 'src/components/fontList.vue'
import { useRouter } from 'vue-router'
// import { type ChatItem } from 'app'
// import { useRouter } from 'vue-router'

//const bex = $q.bex
const $q = useQuasar()
const activeTab = ref('recent')
const newCollectionDialog = ref(false)
const bex = $q.bex
const collectionName = ref('')
const fontName = ref('')
const addFonts = ref(false)
const fonts = reactive<FontFiles>({
  normal: null,
  bold: null,
  italic: null,

  italicBold: null,
})
async function newCollection() {
  if (fontName.value == '') {
    $q.notify({ message: ' font name is missing', color: 'negative' })

    return
  }
  if (!fonts['bold']) {
    $q.notify({ message: 'Bold font is missing', color: 'negative' })
    return false
  }

  // Check for normal font
  if (!fonts['normal']) {
    $q.notify({ message: 'Normal font is missing', color: 'negative' })
    return false
  }

  // Check for italic font
  if (!fonts['italics']) {
    $q.notify({ message: 'Italic font is missing', color: 'negative' })
    return false
  }

  try {
    await addChatFont(fontName.value, { ...fonts } as FontFiles)

    $q.notify({ message: 'font added ', type: 'positive' })
    addFonts.value = false
  } catch (error) {
    $q.notify({ message: 'failed to add font', type: 'negative' })

    console.log(error)
  }
}
//type FontsStyles = 'bold' | 'normal' | 'italic' | 'italicBold'

// function onPickerChanged(event: Event, type: FontsStyles) {
//   const e = event as InputEvent
//   const files = (e.target as HTMLInputElement).files
//   if (!files || files.length === 0) return

//   const file = files[0]
//   if (file == undefined) {
//     $q.notify({ message: 'failed to select file', type: 'negative' })
//     return
//   }
//   const reader = new FileReader()

//   reader.onload = () => {
//     const arr = new Uint8Array(reader.result as ArrayBuffer)

//     // Check first 4 bytes for TTF signature 0x00 0x01 0x00 0x00
//     const isTTF = arr[0] === 0x00 && arr[1] === 0x01 && arr[2] === 0x00 && arr[3] === 0x00

//     if (!isTTF) {
//       $q.notify('Please select a valid TTF font file.')
//       return
//     }
//     fonts[type] = file
//     console.log('Valid TTF file selected:', file.name)
//   }

//   reader.readAsArrayBuffer(file)
// }

function addNewFont() {
  addFonts.value = true
}

// bex.on('chat.open', ({ payload }: { payload: string }) => {
//   console.log(payload, 'kkkkkkkk')

//   void router.push(`/${payload}?mode=readonly`)
// })

// if (){
//   bex
//   .send({
//     event: 'storage.get',
//     to: 'background',
//   })
//   .then((response: Chats) => {
//     console.log('response', Object.values(response), response)
//     for (const data of response) {
//       linksList.push({
//         title: data.title,
//         link: data.url,
//         id: data.id,
//         timestamp: data.timeStamp as number,
//       })
//     }
//   })
//   .catch((reason: string) => {
//     console.log(reason)
//   })

const router = useRouter()
bex.on('chat.open', ({ payload }: { payload: string }) => {
  void router.push(`/chat/${payload}`)
})
// }

const leftDrawerOpen = ref(false)
</script>
