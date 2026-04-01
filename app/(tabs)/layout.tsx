import { BottomNav } from "@/components/ui/BottomNav";

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh min-h-[100svh] flex-col bg-background">
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
