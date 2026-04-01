export default function TabsLoading() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg items-center justify-center bg-background">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
        aria-hidden
      />
    </div>
  );
}
