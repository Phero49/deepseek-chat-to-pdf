<template>
  <iframe id="myframe" v-show="show" style="width: 100%; height: 450px" :frameborder="0"></iframe>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'

const show = ref(false)
async function loadHtmlIntoIframe() {
  // Fetch the raw HTML file
  const response = await fetch(
    'https://raw.githubusercontent.com/Phero49/deepseek-chat-to-pdf/refs/heads/master/messages.json',
  )
  const html = await response.json()
  show.value = html.show

  // Get the iframe
  if (html.show) {
    const iframe = document.getElementById('myframe') as HTMLIFrameElement

    iframe.srcdoc = html.html
  }
}
onMounted(() => {
  void loadHtmlIntoIframe()
})
</script>

<style></style>
