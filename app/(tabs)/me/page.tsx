import Link from "next/link";

export default function MePage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        我的
      </h1>
      <p className="mb-6 text-zinc-600 dark:text-zinc-400">
        个人中心，可在此进入设置与账号管理。
      </p>
      <nav className="space-y-2">
        <Link
          href="/settings"
          className="block rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
        >
          设置
        </Link>
      </nav>
    </div>
  );
}
