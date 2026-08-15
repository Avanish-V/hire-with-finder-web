import { X, Mail, Phone, MapPin, Github, BadgeCheck, GraduationCap, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { profileFor, stageTone, type Applicant } from "@/lib/finder-data";

export function CandidateProfileScreen({
  applicant,
  onClose,
}: {
  applicant: Applicant;
  onClose: () => void;
}) {
  const p = profileFor(applicant);

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-background">
      <div className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 md:px-8">
          <Button variant="ghost" size="icon" aria-label="Close profile" onClick={onClose}>
            <X className="size-4" />
          </Button>
          <p className="truncate font-medium">{applicant.name}</p>
          <Badge variant="secondary" className={`ml-2 ${stageTone[applicant.stage]}`}>
            {applicant.stage}
          </Badge>
          <div className="ml-auto flex shrink-0 gap-2">
            <Button
              variant="outline"
              onClick={() => toast.success(`Email drafted to ${applicant.email}`)}
            >
              <Mail className="size-4" /> Contact
            </Button>
            <Button onClick={() => toast.success(`${applicant.name} shortlisted`)}>
              Shortlist
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 md:px-8 lg:grid-cols-[1.7fr_1fr]">
        <div className="space-y-6">
          <section className="panel flex flex-wrap items-center gap-5 p-6">
            <Avatar className="size-20 border border-border">
              <AvatarFallback className="bg-secondary font-display text-xl">
                {applicant.initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-[12rem] flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold">{applicant.name}</h1>
                {p.verified && <BadgeCheck className="size-5 text-primary" />}
              </div>
              <p className="text-sm text-muted-foreground">{p.tagline}</p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Mail className="size-3.5" /> {applicant.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="size-3.5" /> {p.phone}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" /> {p.location}
                </span>
                {p.githubUsername && (
                  <span className="flex items-center gap-1.5">
                    <Github className="size-3.5" /> @{p.githubUsername}
                  </span>
                )}
              </div>
            </div>
          </section>

          <section className="panel p-5">
            <h2 className="text-lg font-semibold">Summary</h2>
            <p className="mt-2 text-sm text-muted-foreground">{p.summary}</p>
          </section>

          <section className="panel p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <GraduationCap className="size-4 text-primary" /> Education
            </h2>
            <div className="mt-4 rounded-lg border border-border p-4">
              <p className="text-sm font-medium">{p.education.college}</p>
              <p className="text-xs text-muted-foreground">
                {p.education.course} · {p.education.specialization}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {p.education.courseStart} – {p.education.courseEnd} · CGPA {p.education.cgpa}
              </p>
            </div>
          </section>

          <section className="panel p-5">
            <h2 className="text-lg font-semibold">Skills</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {p.skills.map((s) => (
                <span key={s.name} className="rounded-full bg-secondary px-3 py-1.5 text-xs">
                  {s.name} · <span className="text-muted-foreground">{s.level}</span>
                </span>
              ))}
            </div>
          </section>

          {p.experience.length > 0 && (
            <section className="panel p-5">
              <h2 className="text-lg font-semibold">Experience</h2>
              <ul className="mt-4 space-y-2">
                {p.experience.map((e) => (
                  <li key={`${e.role}-${e.org}`} className="rounded-lg border border-border p-3">
                    <p className="text-sm font-medium">{e.role}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.org} · {e.period}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <div className="panel p-5">
            <p className="text-eyebrow">Match score</p>
            <p className="mt-1 font-display text-3xl font-semibold text-primary">
              {applicant.match}%
            </p>
            <Progress value={applicant.match} className="mt-3 h-1.5" />
            <p className="mt-3 text-xs text-muted-foreground">
              Applied {applicant.applied} to {applicant.target}
            </p>
          </div>

          <div className="panel p-5">
            <p className="text-eyebrow">Aura points</p>
            <p className="mt-1 flex items-center gap-2 font-display text-2xl font-semibold">
              <Sparkles className="size-5 text-primary" /> {p.auraPoints}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Earned across sessions, referrals and community activity.
            </p>
          </div>

          <div className="panel p-5">
            <p className="text-eyebrow">Move stage</p>
            <div className="mt-3 grid gap-2">
              {(["Shortlisted", "Interview", "Hired", "Rejected"] as const).map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  size="sm"
                  onClick={() => toast.success(`${applicant.name} moved to ${s}`)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
