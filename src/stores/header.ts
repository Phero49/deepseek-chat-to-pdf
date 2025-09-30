import { defineStore } from 'pinia'
export const headerStore = defineStore('header', {
  state: () => ({
    header: false,
    selectFont: false,
  }),
  actions: {
    setHeader() {
      this.header = !this.header
    },
  },
})
