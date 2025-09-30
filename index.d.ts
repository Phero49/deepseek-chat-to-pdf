export interface ChatItem {
  id: string
  url: string
  title: string
  timeStamp?: number
  source: string
  chat: {
    prompt: string
    response: string
  }[]
}
