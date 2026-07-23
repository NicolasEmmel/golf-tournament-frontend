import { cn } from "@/lib/utils";

export function FairwayShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("bg-fairway flex flex-1 flex-col", className)}>
      {children}
    </div>
  );
}
