# Supabase 模块

- **client.ts**：浏览器端 `createClient()`，用于 Client Component、事件、`useEffect`
- **server.ts**：服务端 `createClient()`（含 Cookie），用于 Server Component、Server Action、Route Handler

## 环境变量

在 `.env.local` 中配置：

- `NEXT_PUBLIC_SUPABASE_URL`：项目 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`：匿名公钥（anon key）

## 后续目录/模块预留

| 模块 | 用途 |
|------|------|
| auth | 登录、登出、会话、中间件刷新 token |
| profiles | 用户资料表（头像、昵称、account_id） |
| conversations | 会话列表、创建会话、未读数 |
| messages | 消息 CRUD、Realtime 订阅、撤回/清空状态 |

可在本目录下新增 `auth.ts`、`profiles.ts`、`conversations.ts`、`messages.ts` 等，内部调用 `createClient()`（client 或 server 按场景选择）。
