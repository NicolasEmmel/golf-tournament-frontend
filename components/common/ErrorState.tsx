export function ErrorState({
  title = "Etwas ist schiefgelaufen",
  message,
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div
      className="rounded-lg border border-error/30 bg-error/5 px-4 py-6 text-center"
      role="alert"
    >
      <h2 className="text-lg font-semibold text-error">{title}</h2>
      {message && <p className="mt-2 text-sm text-muted">{message}</p>}
    </div>
  );
}
