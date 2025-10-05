<template>
  <div>
    <div class="text-h6">{{ name }} collection</div>
    <q-separator spaced />
    <ChatList :collection="true" :chats-list="listItems" />
  </div>
</template>

<script lang="ts" setup>
import { getCollectionItems } from 'app/src-bex/utils/database'
import ChatList from 'src/components/ChatList.vue'
import { onBeforeMount, ref } from 'vue'

const { id, name } = defineProps<{ id: string; name: string }>()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const listItems = ref<any[]>([])
onBeforeMount(async () => {
  const items = await getCollectionItems(id)
  listItems.value = items
})
</script>

<style></style>
