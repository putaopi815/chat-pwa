"use client";

const RECALL_WINDOW_MS = 60 * 1000;

export interface MessageActionSheetProps {
  open: boolean;
  onClose: () => void;
  /** 是否己方消息（仅己方且 1 分钟内可撤回） */
  isSelf: boolean;
  /** 消息创建时间，用于判断是否在 1 分钟内可撤回 */
  messageCreatedAt?: string;
  onRecall: () => void;
  onQuote: () => void;
  onDelete: () => void;
}

export function MessageActionSheet({
  open,
  onClose,
  isSelf,
  messageCreatedAt,
  onRecall,
  onQuote,
  onDelete,
}: MessageActionSheetProps) {
  if (!open) return null;

  const canRecall =
    isSelf &&
    messageCreatedAt &&
    Date.now() - new Date(messageCreatedAt).getTime() <= RECALL_WINDOW_MS;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40"
        aria-hidden
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto rounded-t-[var(--radius-lg)] bg-surface pb-[env(safe-area-inset-bottom)] pt-2">
        <div className="flex flex-col gap-0.5 px-4 pb-4">
          {canRecall && (
            <button
              type="button"
              onClick={() => {
                onRecall();
                onClose();
              }}
              className="flex h-12 items-center justify-center rounded-[var(--radius)] bg-surface-elevated text-[15px] font-medium text-foreground active:bg-border"
            >
              撤回
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              onQuote();
              onClose();
            }}
            className="flex h-12 items-center justify-center rounded-[var(--radius)] bg-surface-elevated text-[15px] font-medium text-foreground active:bg-border"
          >
            引用
          </button>
          <button
            type="button"
            onClick={() => {
              onDelete();
              onClose();
            }}
            className="flex h-12 items-center justify-center rounded-[var(--radius)] bg-surface-elevated text-[15px] font-medium text-foreground active:bg-border"
          >
            删除
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-12 items-center justify-center rounded-[var(--radius)] bg-surface-elevated text-[15px] font-medium text-muted-foreground active:bg-border"
          >
            取消
          </button>
        </div>
      </div>
    </>
  );
}
