<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<template>
  <q-list separator class="q-gutter-y-md">
    <q-card bordered flat v-for="(chat, i) in recentChats" :key="chat.id">
      <q-item class="q-py-md" clickable v-ripple @click.stop="$router.push(`/chat/${chat.id}`)">
        <q-item-section avatar>
          <q-avatar>
            <img :src="icons[chat.source as keyof typeof icons]" alt="" srcset="" />
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label lines="2" class="text-subtitle1">
            {{ chat.title }}
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-card-actions vertical>
            <q-btn flat size="sm" icon="open_in_new" target="_blank" :href="chat.url" />
            <q-btn
              flat
              size="sm"
              :icon="symRoundedDriveFolderUpload"
              @click.stop="addToCollection = true"
            >
              <q-tooltip> add to collection </q-tooltip></q-btn
            >
            <q-btn
              flat
              size="sm"
              icon="delete"
              target="_blank"
              @click.stop="deleteChatFun(chat.id, i)"
            />
          </q-card-actions>
        </q-item-section>
      </q-item>
    </q-card>
  </q-list>
  <q-dialog v-model="addToCollection" @before-show="getCollectionsList">
    <q-card style="max-width: 580x; width: 100%">
      <q-card-section>
        <q-select
          v-model="searchCollection"
          :options="collections"
          type="text"
          label="search collection"
          option-label="name"
          option-value="id"
          use-input
          @filter="filterFn"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import {
  type Collection,
  deleteChat,
  getCollectionList,
  getRecentChats,
  type RecentChat,
} from '../../src-bex/utils/database'
import chatGptICon from '../assets/ais/chatgpt.svg'
import qwenICon from '../assets/ais/qwen.png'
import deepseekICon from '../assets/ais/deepseek.svg'
import geminiICon from '../assets/ais/gemini.png'
import { onBeforeMount, ref } from 'vue'
import { QSelect, useQuasar } from 'quasar'
import { symRoundedDriveFolderUpload } from '@quasar/extras/material-symbols-rounded'
const $q = useQuasar()
const recentChats = ref<RecentChat[]>()
const addToCollection = ref(false)
const searchCollection = ref('')
async function loadRecent() {
  recentChats.value = await getRecentChats((recentChats.value || []).length)
}
const icons = {
  chatgpt: chatGptICon,
  gemini: geminiICon,
  deepseek: deepseekICon,
  qwen: qwenICon,
}

function deleteChatFun(id: string, index: number) {
  ;(recentChats.value || []).splice(index)
  void deleteChat(id)
  $q.notify({ message: 'chat deleted' })
}

const collections = ref<Collection[]>([])

const filteredCollection = ref<Collection[]>([])
async function getCollectionsList() {
  collections.value = await getCollectionList()
  filteredCollection.value = collections.value
}

onBeforeMount(() => {
  void loadRecent()
})

function filterFn(
  inputValue: string,
  doneFn: (callbackFn: () => void, afterFn?: (ref: QSelect) => void) => void,
) {
  if (inputValue) {
    doneFn(() => {})
  }
}
</script>

<style></style>
