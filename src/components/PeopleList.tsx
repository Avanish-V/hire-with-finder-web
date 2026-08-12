import { Mail, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { applicants, stageTone, type Applicant } from "@/lib/finder-data";

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
  if (people.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {people.map((p) => (
        <li
          key={p.id}
          className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3"
        >
          <Avatar className="size-9 border border-border">
            <AvatarFallback className="bg-secondary text-xs">{p.initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{p.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {p.role} · {p.email}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="font-display text-sm font-semibold text-primary">{p.match}%</span>
            <Badge variant="secondary" className={stageTone[p.stage]}>
              {p.stage}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Email ${p.name}`}
              onClick={() => toast.success(`Email drafted to ${p.email}`)}
            >
              <Mail className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Shortlist ${p.name}`}
              onClick={() => toast.success(`${p.name} shortlisted`)}
            >
              <Check className="size-4 text-success" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Remove ${p.name}`}
              onClick={() => toast(`${p.name} moved to rejected`)}
            >
              <X className="size-4 text-destructive" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
