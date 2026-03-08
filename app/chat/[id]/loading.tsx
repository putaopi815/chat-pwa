export default function ChatDetailLoading() {
  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="h-14 shrink-0 border-b border-border bg-card px-3 flex items-center gap-2">
        <div className="h-10 w-10 shrink-0 rounded-full bg-muted animate-pulse" />
        <div className="h-5 flex-1 max-w-[120px] rounded bg-muted animate-pulse" />
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center bg-[var(--chat-area-bg)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
      <div className="h-[84px] shrink-0 border-t border-border bg-surface" />
    </div>
  );
}
