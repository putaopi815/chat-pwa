export default function ContactsPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        通讯录
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        好友与群组列表将在此展示，接入 Supabase 后可同步联系人。
      </p>
    </div>
  );
}
