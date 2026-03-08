# Supabase 基础接入说明

## 新增/涉及的文件

| 文件 | 说明 |
|------|------|
| `.env.local` | 本地环境变量（已配置 Project URL 与 Publishable Key，勿提交 Git） |
| `.env.example` | 环境变量示例，供他人复制后改名填写 |
| `lib/supabase/client.ts` | 浏览器端 Supabase 客户端（Client Component、事件、useEffect 使用） |
| `lib/supabase/server.ts` | 服务端 Supabase 客户端（Server Component、Server Action、Route Handler 使用） |
| `lib/supabase/index.ts` | 统一入口，推荐从 `@/lib/supabase/client` 或 `@/lib/supabase/server` 按场景引用 |
| `scripts/check-supabase-env.mjs` | 检查 `.env.local` 中是否已配置 Supabase 相关变量 |
| `docs/SUPABASE_SETUP.md` | 本说明文件 |

## 环境变量检查

在项目根目录执行：

```bash
npm run check:env
```

若输出 `✅ Supabase 环境变量已配置` 表示当前环境变量可被读取（Next 在启动/构建时会自动加载 `.env.local`）。

## 在 Supabase 控制台需要做的配置

1. **确认项目**  
   登录 [Supabase Dashboard](https://supabase.com/dashboard)，选择项目（URL 与 `.env.local` 中的 `NEXT_PUBLIC_SUPABASE_URL` 一致）。

2. **创建数据库表与 RLS**  
   若尚未执行过建表脚本，在 **SQL Editor** 中执行项目中的 `supabase/schema.sql`（以及如有迁移文件，按顺序执行），创建 `profiles`、`conversations`、`conversation_members`、`messages` 等表及 RLS 策略。

3. **认证方式**  
   在 **Authentication → Providers** 中启用 **Email**，如需邮箱+密码登录/注册，保持 Email 开启即可。

4. **Realtime（可选）**  
   若使用聊天消息、会话列表的实时更新，在 **Database → Replication** 中为表 `messages`、`conversations` 开启 Realtime 复制（加入对应 Publication）。

5. **安全**  
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` 为公钥，可暴露在前端，权限由 RLS 控制。切勿将 **service_role** 密钥放入前端或提交到仓库。
