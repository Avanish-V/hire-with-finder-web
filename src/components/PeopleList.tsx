import { useState } from "react";
import { BadgeCheck, ExternalLink } from "lucide-react";
import { CandidateProfileScreen } from "@/components/CandidateProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { applicants, type Applicant } from "@/lib/finder-data";

export function peopleFor(target: string, kind: Applicant["kind"]) {
  return applicants.filter((a) => a.kind === kind && a.target === target);
}

export function PeopleList({
  people,
  emptyLabel,
}: {
  people: Applicant[];
  emptyLabel: string;
}) {
  const [open, setOpen] = useState<Applicant | null>(null);

  if (people.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-2">
        {people.map((p) => (
          <li
            key={p.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3"
          >
            <Avatar className="size-9 border border-border">
              {p.avatarUrl && <AvatarImage src={p.avatarUrl} alt={p.name} />}
              <AvatarFallback className="bg-secondary text-xs">{p.initials}</AvatarFallback>
            </Avatar>

            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              onClick={() => setOpen(p)}
            >
              <p className="flex items-center gap-1.5 truncate text-sm font-medium hover:text-primary">
                {p.name}
                {p.externalUserId && (
                  <span title="Verified Finder user">
                    <BadgeCheck className="size-3.5 shrink-0 text-primary" />
                  </span>
                )}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {p.role} · {p.email}
              </p>
            </button>

            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(p)}
              >
                <ExternalLink className="size-3.5 mr-1" />
                View profile
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {open && <CandidateProfileScreen applicant={open} onClose={() => setOpen(null)} />}
    </>
  );
}
