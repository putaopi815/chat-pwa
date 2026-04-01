"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { ContactsRealtimeRefresher } from "./ContactsRealtimeRefresher";
import { ContactRow } from "./ContactRow";
import type { Contact } from "@/types";

export function ContactsContent({
  initialContacts,
  onProfilesUpdated,
}: {
  initialContacts: Contact[];
  onProfilesUpdated?: () => void;
}) {
  const contactIds = initialContacts.map((c) => c.id);

  return (
    <div className="mx-auto max-w-lg bg-background">
      <PageHeader
        title="通讯录"
        rightSlot={
          <Link
            href="/contacts/add"
            className="flex size-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="添加好友"
          >
            <Plus className="size-6" aria-hidden />
          </Link>
        }
      />
      <ContactsRealtimeRefresher contactUserIds={contactIds} onProfilesUpdated={onProfilesUpdated}>
        <div className="p-4">
          <Card className="shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {initialContacts.map((contact) => (
                  <ContactRow key={contact.id} contact={contact} />
                ))}
                {initialContacts.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    暂无联系人，点击右上角 + 搜索账号 ID 添加
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </ContactsRealtimeRefresher>
    </div>
  );
}
