<template>
  <q-item clickable @click.stop>
    <q-item-section>
      <q-item-label>
        <router-link replace :to="`/${id}?mode=readonly`"> {{ title }}</router-link></q-item-label
      >
      <q-item-label caption>{{ new Date(timestamp).toLocaleDateString() }}</q-item-label>
    </q-item-section>
    <q-item-section side top>
      <q-btn icon="more_vert" dense color="red-4" flat size="sm" @click.stop>
        <q-menu>
          <q-card-actions align="center">
            <q-btn icon="edit" flat size="sm" :to="`/${id}?mode=edit?`" />
            <q-btn icon="open_in_new" flat size="sm" :href="link" target="_blank" tag="a" />
            <q-btn
              icon="delete"
              dense
              color="red-4"
              flat
              size="sm"
              @click="$emit('deleteChat', id)"
            />
          </q-card-actions>
        </q-menu>
      </q-btn>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
export interface EssentialLinkProps {
  title: string
  timestamp: number
  id: string
  link?: string
}

defineEmits<{ deleteChat: [string] }>()

withDefaults(defineProps<EssentialLinkProps>(), {
  caption: '',
  link: '#',
  icon: '',
})
</script>
