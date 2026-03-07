// 全局类型定义，便于后续接 Supabase 与业务模型

export type UserId = string;

export interface User {
  id: UserId;
  email?: string;
  display_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  participant_ids: UserId[];
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: UserId;
  content: string;
  created_at: string;
}
