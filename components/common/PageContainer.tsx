import { cn } from "@/lib/utils";

export function PageContainer({
  children,
  className,
  title,
  description,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl flex-1 px-4 py-8", className)}>
      {(title || description) && (
        <header className="mb-8">
          {title && (
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
          )}
          {description && (
            <p className="mt-2 max-w-2xl text-muted">{description}</p>
          )}
        </header>
      )}
      {children}
    </div>
  );
}
