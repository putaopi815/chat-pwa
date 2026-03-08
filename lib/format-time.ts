const FIVE_MINUTES_MS = 5 * 60 * 1000;

/**
 * 判断两条消息是否间隔超过 5 分钟（用于对话页是否显示时间）
 */
export function shouldShowMessageTime(
  currentCreatedAt: string,
  prevCreatedAt: string | null
): boolean {
  if (!prevCreatedAt) return true;
  const cur = new Date(currentCreatedAt).getTime();
  const prev = new Date(prevCreatedAt).getTime();
  return cur - prev > FIVE_MINUTES_MS;
}

/**
 * 对话页消息时间展示：今天 HH:mm；昨天「昨天 HH:mm」；昨天之前「x月x日 HH:mm」；跨年「x年x月x日 HH:mm」
 */
export function formatChatMessageTime(createdAt: string): string {
  const date = new Date(createdAt);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const timeStr = date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  if (dateOnly.getTime() === today.getTime()) {
    return timeStr;
  }
  if (dateOnly.getTime() === yesterday.getTime()) {
    return `昨天 ${timeStr}`;
  }
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  if (year !== now.getFullYear()) {
    return `${year}年${month}月${day}日 ${timeStr}`;
  }
  return `${month}月${day}日 ${timeStr}`;
}

/**
 * 将消息时间格式化为列表摘要展示
 */
export function formatMessageTime(createdAt: string): string {
  const date = new Date(createdAt);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const timeStr = date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  if (dateOnly.getTime() === today.getTime()) {
    return timeStr;
  }
  if (dateOnly.getTime() === yesterday.getTime()) {
    return "昨天";
  }
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const dayOfWeek = date.getDay();
  const diffDays = Math.floor((today.getTime() - dateOnly.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays < 7 && diffDays > 0) {
    return weekdays[dayOfWeek];
  }
  if (diffDays < 365) {
    return date.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });
  }
  return date.toLocaleDateString("zh-CN", { year: "numeric", month: "numeric", day: "numeric" });
}
