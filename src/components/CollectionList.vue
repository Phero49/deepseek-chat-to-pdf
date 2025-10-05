<template>
  <template v-if="collections == undefined">
    <q-item v-for="i in 4" :key="i">
      <q-item-section avatar>
        <q-skeleton type="QAvatar" />
      </q-item-section>

      <q-item-section>
        <q-item-label>
          <q-skeleton type="text" />
        </q-item-label>
        <q-item-label caption>
          <q-skeleton type="text" width="65%" />
        </q-item-label>
      </q-item-section>
    </q-item>
  </template>
  <template v-else-if="collections.length == 0">
    <div class="text-center text-subtitle1">You don't have any collections</div>
  </template>
  <template v-else>
    <q-list separator>
      <q-item
        clickable
        :to="`/collection/${value.id}?name=${value.name}`"
        v-ripple
        v-for="(value, i) in collections"
        :key="value.id"
      >
        <q-item-section avatar>
          <q-icon color="grey-8" name="folder" />
        </q-item-section>
        <q-item-section class="text-subtitle1">
          <q-item-label :lines="2">
            {{ value.name }}
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-btn flat color="grey" icon="delete" size="sm" @click="deleteFn(value.id, i)" />
        </q-item-section>
      </q-item>
    </q-list>
  </template>
  <div></div>
</template>

<script lang="ts" setup>
import { type Collection, deleteCollection, getCollectionList } from 'app/src-bex/utils/database'
import { useQuasar } from 'quasar'
import { onMounted, ref } from 'vue'

const collections = ref<Collection[]>()
const load = async () => {
  collections.value = await getCollectionList()
}
onMounted(() => {
  void load()
})
const $q = useQuasar()
async function deleteFn(params: string, i: number) {
  try {
    await deleteCollection(params)
    ;(collections.value || []).splice(i, 1)
    $q.notify({ message: 'collection deleted', type: 'negative' })
  } catch (error) {
    console.log(error)
    $q.notify({ message: 'failed to deleted', type: 'negative' })
  }
}

function addToCollections(col: Collection) {
  ;(collections.value = collections.value ?? []).push(col)
}
defineExpose({ addToCollections })
</script>

<style></style>
