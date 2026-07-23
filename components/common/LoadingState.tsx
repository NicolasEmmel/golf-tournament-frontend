export function LoadingState({ message = "Laden…" }: { message?: string }) {
  return (
    <div
      className="flex min-h-[12rem] flex-col items-center justify-center gap-3 text-muted"
      role="status"
      aria-busy="true"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p>{message}</p>
    </div>
  );
}
