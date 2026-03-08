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

/** 聊天列表最后一条消息摘要的展示类型 */
export type LastMessagePreviewType =
  | "normal"           // 正常文本
  | "self_recalled"    // 你撤回了一条消息
  | "other_recalled"   // 对方撤回了一条消息
  | "purged";         // 聊天记录已清空

/** 联系人（mock / 接口返回） */
export interface Contact {
  id: string;
  nickname: string;
  accountId: string;
  avatarColor: string;
  /** 头像 URL（用户在「我的」页选择的默认头像），有则全局展示 */
  avatarUrl?: string | null;
}

/** 聊天列表项（mock / 接口返回） */
export interface ConversationListItem {
  id: string;
  nickname: string;
  avatarColor: string;
  lastMessage: {
    type: LastMessagePreviewType;
    text?: string; // type 为 normal 时的正文
  };
  time: string;
  unreadCount: number;
}

/** 消息状态：正常 | 已撤回 | 已清空占位 */
export type MessageStatus = "normal" | "recalled" | "purged_for_all";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: UserId;
  content: string;
  created_at: string;
  /** 前端单聊页使用，不接后端时默认为 normal */
  status?: MessageStatus;
}
