import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <header className="mb-6 flex items-center gap-2">
        <Link
          href="/me"
          className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          aria-label="返回"
        >
          ← 返回
        </Link>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          设置
        </h1>
      </header>
      <p className="mb-6 text-zinc-600 dark:text-zinc-400">
        设置页预留，可在此接入通知、主题、账号与隐私等配置。
      </p>
      <nav className="space-y-2">
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          通知设置（待实现）
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          主题（待实现）
        </div>
      </nav>
    </div>
  );
}
