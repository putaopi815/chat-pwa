"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { useProfileDisplayName } from "@/lib/hooks/useProfileDisplayName";
import type { Contact } from "@/types";

const DEFAULT_AVATAR_COLOR = "#C8D4FF";

export function ContactRow({ contact }: { contact: Contact }) {
  const nickname = useProfileDisplayName(contact.id, contact.nickname);

  return (
    <Link
      href={`/contacts/${contact.id}`}
      className="flex min-h-[64px] items-center gap-3 px-4 py-4 transition-colors hover:bg-accent/50 active:bg-accent"
    >
      <Avatar
        color={contact.avatarColor || DEFAULT_AVATAR_COLOR}
        avatarUrl={contact.avatarUrl}
        size="md"
        rounded="xl"
      />
      <span className="text-base font-medium text-foreground">
        {nickname}
      </span>
    </Link>
  );
}
