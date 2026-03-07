import Link from "next/link";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ChatDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-zinc-200 bg-white/95 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/95">
        <Link
          href="/chat"
          className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          aria-label="返回"
        >
          ← 返回
        </Link>
        <h1 className="flex-1 text-center font-medium">会话：{id}</h1>
        <span className="w-10" />
      </header>
      <main className="flex-1 px-4 py-6">
        <p className="text-zinc-600 dark:text-zinc-400">
          聊天详情页预留，接入 Supabase Realtime 后可在此展示消息列表与发送消息。
        </p>
      </main>
    </div>
  );
}
