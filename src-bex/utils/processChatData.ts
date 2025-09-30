import { writeDb } from './database'

export interface CustomChatData {
  title: string
  id: string
  url: string
  source: string
  timeStamp: number
}
export interface ChatgptChatData extends CustomChatData {
  chat: GPTChat
}

export interface GPTChat {
  id: string
  accountUserId: string
  authUserId: string
  title: string
  isArchived: boolean
  updateTime: number
  messages: Message[]
}

export interface Message {
  id: string
  text: string
  role?: 'user' | 'assistant'
}

export interface GeneralChat {
  messages: Message[]
  id: string
  title: string
  source: string
  url: string
}

export async function processChatGPT(data: ChatgptChatData): Promise<GeneralChat> {
  const newChat: GeneralChat = {
    id: data.id,
    messages: data.chat.messages,
    source: data.source,
    title: data.chat.title,
    url: data.url,
  }

  return writeDb(newChat)
}

export interface DeepSeekChat extends CustomChatData {
  chat: {
    data: DeepSeekChatMessages
  }
}

export interface DeepSeekChatMessages {
  chat_messages: ChatMessage[]
}
//TODO handle chats with files
export interface ChatMessage {
  message_id: number
  parent_id: number | null
  model: string
  role: string
  thinking_enabled: boolean
  ban_edit: boolean
  ban_regenerate: boolean
  status: string
  accumulated_token_usage: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  files: any[]
  inserted_at: number
  search_enabled: boolean
  feedback: null
  fragments: Fragment[]
}

export interface Fragment {
  id: number
  type: string
  content: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function processDeepseekChat(d: any) {
  const data = d as DeepSeekChat
  console.log(data.chat.data.chat_messages || 'invalid', 'this chat')
  const newChat: GeneralChat = {
    id: data.id,
    messages: data.chat.data.chat_messages.map((v) => {
      return {
        text: v.fragments[0]?.content || '',
        id: v.message_id.toString(),
        role: v.role,
      }
    }) as Message[],
    source: data.source,
    title: data.title,
    url: data.url,
  }

  return writeDb(newChat)
}
