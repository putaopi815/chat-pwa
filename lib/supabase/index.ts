/**
 * Supabase 统一入口
 * - 浏览器/客户端: import { createClient } from '@/lib/supabase/client'
 * - 服务端: import { createClient } from '@/lib/supabase/server'
 *
 * 后续模块预留:
 * - auth: 登录、登出、会话
 * - profiles: 用户资料（头像、昵称等）
 * - conversations: 会话列表、创建会话
 * - messages: 消息 CRUD、Realtime 订阅
 */

export { createClient } from "./client";
