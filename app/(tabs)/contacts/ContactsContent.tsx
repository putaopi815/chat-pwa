"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { ContactsRealtimeRefresher } from "./ContactsRealtimeRefresher";
import { ContactRow } from "./ContactRow";
import type { Contact } from "@/types";

export function ContactsContent({ initialContacts }: { initialContacts: Contact[] }) {
  const contactIds = initialContacts.map((c) => c.id);

  return (
    <div className="mx-auto max-w-lg bg-background">
      <PageHeader title="通讯录" />
      <ContactsRealtimeRefresher contactUserIds={contactIds}>
        <div className="p-4 space-y-4">
          <Link
            href="/contacts/add"
            className="flex h-12 w-full items-center justify-center rounded-[var(--radius)] border border-dashed border-input bg-background text-sm font-medium text-primary shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            添加好友
          </Link>
          <Card className="shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {initialContacts.map((contact) => (
                  <ContactRow key={contact.id} contact={contact} />
                ))}
                {initialContacts.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    暂无联系人，点击上方「添加好友」搜索账号 ID 添加
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
