<template>
  <q-layout view="lHh Lpr lFf">
    <div id="header"></div>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header> Exported charts </q-item-label>

        <EssentialLink
          v-for="link in linksList"
          :key="link.title"
          v-bind="link"
          @delete-chat="deleteChat"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import EssentialLink, { type EssentialLinkProps } from 'components/EssentialLink.vue'
import { useQuasar } from 'quasar'
import { type ChatItem } from 'app'
import { useRouter } from 'vue-router'
const linksList: EssentialLinkProps[] = reactive([])
const $q = useQuasar()
const bex = $q.bex
const router = useRouter()

type Chats = ChatItem[]

async function deleteChat(id: string) {
  const index = linksList.findIndex((l) => l.id == id)
  if (index >= 0) {
    linksList.splice(index, 1)
    await bex.send({
      event: 'storage.remove',
      payload: id,
      to: 'background',
    })
  }
}

// bex.on('chat.open', ({ payload }: { payload: string }) => {
//   console.log(payload, 'kkkkkkkk')

//   void router.push(`/${payload}?mode=readonly`)
// })

bex
  .send({
    event: 'storage.get',
    to: 'background',
  })
  .then((response: Chats) => {
    console.log('response', Object.values(response), response)
    for (const data of response) {
      linksList.push({
        title: data.title,
        link: data.url,
        id: data.id,
        timestamp: data.timeStamp as number,
      })
    }
  })
  .catch((reason: string) => {
    console.log(reason)
  })

bex.on('chat.open', ({ payload }: { payload: string }) => {
  console.log(payload, 'kkkkkkkk')

  void router.push(`/${payload}?mode=readonly`)
})
const leftDrawerOpen = ref(false)
</script>
