import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-center text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          登录
        </h1>
        <p className="text-center text-zinc-600 dark:text-zinc-400">
          登录页预留，接入 Supabase Auth 后可实现邮箱/手机/第三方登录。
        </p>
        <div className="space-y-3">
          <button
            type="button"
            className="w-full rounded-lg bg-blue-600 py-3 text-white transition-colors hover:bg-blue-700"
          >
            登录（待接入）
          </button>
          <Link
            href="/chat"
            className="block text-center text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-400"
          >
            暂不登录，先看看
          </Link>
        </div>
      </div>
    </div>
  );
}
