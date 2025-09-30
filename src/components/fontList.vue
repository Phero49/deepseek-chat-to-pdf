<template>
  <div>
    <q-list>
      <q-item clickable v-ripple v-for="(item, index) in list" :key="index">
        <q-item-section class="text-subtitle1">{{ item.name }}</q-item-section>
        <q-item-section side>
          <q-btn
            color="negative"
            unelevated
            round
            icon="delete"
            @click="onDelete(item.id, index)"
          />
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script lang="ts" setup>
import { getFontListNames, type FontNameEntry, deleteFont } from 'app/src-bex/utils/database'
import { onBeforeMount, ref } from 'vue'
const list = ref<FontNameEntry[]>([])
onBeforeMount(async () => {
  list.value = await getFontListNames()
})

async function onDelete(key: string, i: number) {
  await deleteFont(key)
  list.value.splice(i, 1)
}
</script>

<style></style>
