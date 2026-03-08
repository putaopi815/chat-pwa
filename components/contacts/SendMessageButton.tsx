"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  contactUserId: string;
  className?: string;
  children?: React.ReactNode;
};

export function SendMessageButton({ contactUserId, className, children }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const url = `${window.location.origin}/api/chat/get-or-create?otherUserId=${encodeURIComponent(contactUserId)}`;
      const res = await fetch(url, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      const id = data?.conversationId;
      if (id && typeof id === "string" && id.length > 30) {
        window.location.assign(`/chat/${id}`);
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={className}
    >
      {loading ? "打开中…" : children ?? "发消息"}
    </Button>
  );
}
