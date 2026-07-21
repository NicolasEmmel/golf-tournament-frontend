export function EmptyState({
  title,
  message,
}: {
  title: string;
  message?: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface px-4 py-10 text-center">
      <h2 className="text-lg font-medium text-foreground">{title}</h2>
      {message && <p className="mt-2 text-sm text-muted">{message}</p>}
    </div>
  );
}
