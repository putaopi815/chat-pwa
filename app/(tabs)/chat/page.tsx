import Link from "next/link";

export default function ChatPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        聊天
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        会话列表将在此展示，接入 Supabase 后可拉取实时会话。
      </p>
      <ul className="mt-6 space-y-2">
        <li>
          <Link
            href="/chat/demo"
            className="block rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <span className="font-medium">示例会话</span>
            <span className="ml-2 text-sm text-zinc-500">点击进入聊天详情</span>
          </Link>
        </li>
      </ul>
    </div>
  );
}
