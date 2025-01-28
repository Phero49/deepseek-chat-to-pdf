export interface ChatItem {
  id: string
  url: string
  title: string
  timeStamp?: number
  chat: {
    prompt: string
    response: string
  }[]
}
