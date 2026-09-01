import type { ReactNode } from "react";
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FullScreenComposer({
  title,
  description,
  submitLabel,
  onClose,
  onSubmit,
  onDelete,
  deleteLabel = "Delete",
  children,
}: {
  title: string;
  description: string;
  submitLabel: string;
  onClose: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
  deleteLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <div className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:px-8">
            <Button variant="ghost" size="icon" type="button" aria-label="Close" onClick={onClose}>
              <X className="size-4" />
            </Button>
            <div className="min-w-0">
              <p className="truncate font-medium">{title}</p>
              <p className="hidden truncate text-xs text-muted-foreground sm:block">
                {description}
              </p>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              {onDelete && (
                <Button
                  variant="destructive"
                  type="button"
                  size="sm"
                  onClick={onDelete}
                  className="gap-1.5"
                >
                  <Trash2 className="size-3.5" />
                  <span>{deleteLabel}</span>
                </Button>
              )}
              <Button variant="ghost" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">{submitLabel}</Button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">{children}</div>
      </form>
    </div>
  );
}

export function FormSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="panel mb-6 p-5 md:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      <div className="mt-5 grid gap-4">{children}</div>
    </section>
  );
}
