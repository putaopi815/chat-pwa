# 聊天 PWA

Next.js App Router + TypeScript + Tailwind CSS 的聊天 PWA 项目，结构便于后续接入 Supabase。

## 技术栈

- **Next.js 16**（App Router）
- **TypeScript**
- **Tailwind CSS**
- PWA：`manifest.json`、Service Worker 占位

## 目录结构

```
chat-pwa/
├── app/
│   ├── (tabs)/              # 底部 Tab 页面（共用底部导航）
│   │   ├── layout.tsx       # Tab 布局 + BottomNav
│   │   ├── chat/page.tsx    # 聊天列表
│   │   ├── contacts/page.tsx# 通讯录
│   │   └── me/page.tsx      # 我的
│   ├── chat/[id]/page.tsx   # 聊天详情（单聊）
│   ├── login/page.tsx       # 登录（预留）
│   ├── settings/page.tsx    # 设置（预留）
│   ├── layout.tsx
│   ├── page.tsx             # 根路径重定向到 /chat
│   └── globals.css
├── components/
│   └── ui/
│       └── BottomNav.tsx    # 底部导航
├── lib/
│   └── supabase.ts         # Supabase 客户端占位
├── types/
│   └── index.ts            # 全局类型（User、Conversation、Message）
└── public/
    ├── manifest.json       # PWA manifest
    └── sw.js               # Service Worker 占位
```

## 本地运行

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)，默认会跳转到 `/chat`。

## 接入 Supabase

1. 复制 `.env.example` 为 `.env.local`，填写 `NEXT_PUBLIC_SUPABASE_URL` 与 `NEXT_PUBLIC_SUPABASE_ANON_KEY`。
2. 安装：`npm install @supabase/supabase-js`。
3. 在 `lib/supabase.ts` 中实现浏览器端/服务端 Client，并在各页或 Server Actions 中调用。
4. 使用 `types/index.ts` 中的类型与 Supabase 表结构对齐（或扩展）。

## PWA

- `public/manifest.json` 已配置名称、主题色、启动地址等；可补充 `icons` 数组。
- `public/sw.js` 为 Service Worker 占位，可按需实现缓存与离线逻辑；需在客户端注册（如根 layout 或单独组件）。
