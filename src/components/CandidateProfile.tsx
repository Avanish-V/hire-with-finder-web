import { useEffect, useState } from "react";
import { X, Mail, Phone, MapPin, Github, BadgeCheck, GraduationCap, Sparkles, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { profileFor, stageTone, type Applicant, type CandidateProfile } from "@/lib/finder-data";
import { getCandidateProfile, updateApplicantStage } from "@/services/applicantsService";

export function CandidateProfileScreen({
  applicant,
  onClose,
  onStageChange,
}: {
  applicant: Applicant;
  onClose: () => void;
  onStageChange?: (applicant: Applicant, stage: Applicant["stage"]) => void;
}) {
  const [profile, setProfile] = useState<CandidateProfile>(profileFor(applicant));
  const [loading, setLoading] = useState(true);
  const [currentStage, setCurrentStage] = useState(applicant.stage);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getCandidateProfile(applicant).then((p) => {
      if (active) {
        setProfile(p);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [applicant.id]);

  const handleStageChange = async (stage: Applicant["stage"]) => {
    await updateApplicantStage(applicant.id, stage);
    setCurrentStage(stage);
    onStageChange?.(applicant, stage);
    toast.success(`${applicant.name} moved to ${stage}`);
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-background">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 md:px-8">
          <Button variant="ghost" size="icon" aria-label="Close profile" onClick={onClose}>
            <X className="size-4" />
          </Button>
          <p className="truncate font-medium">{applicant.name}</p>
          <Badge variant="secondary" className={`ml-2 ${stageTone[currentStage]}`}>
            {currentStage}
          </Badge>
          {loading && <Loader2 className="ml-1 size-4 animate-spin text-muted-foreground" />}
          <div className="ml-auto flex shrink-0 gap-2">
            {applicant.externalUserId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  window.open(
                    `https://iv52bugou5xppexnhffgj53hwq0rorrh.lambda-url.ap-south-1.on.aws/users/view/${applicant.externalUserId}`,
                    "_blank"
                  )
                }
                title="View raw Finder profile"
              >
                <ExternalLink className="size-3.5 mr-1" /> Finder profile
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => toast.success(`Email drafted to ${applicant.email}`)}
            >
              <Mail className="size-4" /> Contact
            </Button>
            <Button onClick={() => handleStageChange("Shortlisted")}>
              Shortlist
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 md:px-8 lg:grid-cols-[1.7fr_1fr]">
        <div className="space-y-6">
          {/* Hero card */}
          <section className="panel flex flex-wrap items-center gap-5 p-6">
            <Avatar className="size-20 border border-border">
              {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={applicant.name} />}
              <AvatarFallback className="bg-secondary font-display text-xl">
                {applicant.initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-[12rem] flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold">{applicant.name}</h1>
                {profile.verified && <BadgeCheck className="size-5 text-primary" />}
              </div>
              <p className="text-sm text-muted-foreground">{profile.tagline}</p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Mail className="size-3.5" /> {applicant.email}
                </span>
                {profile.phone && profile.phone !== "+91 90000 00000" && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="size-3.5" /> {profile.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" /> {profile.location}
                </span>
                {profile.githubUsername && (
                  <span className="flex items-center gap-1.5">
                    <Github className="size-3.5" /> @{profile.githubUsername}
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Summary */}
          <section className="panel p-5">
            <h2 className="text-lg font-semibold">Summary</h2>
            <p className="mt-2 text-sm text-muted-foreground">{profile.summary}</p>
          </section>

          {/* Education */}
          <section className="panel p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <GraduationCap className="size-4 text-primary" /> Education
            </h2>
            <div className="mt-4 rounded-lg border border-border p-4">
              <p className="text-sm font-medium">{profile.education.college}</p>
              <p className="text-xs text-muted-foreground">
                {profile.education.course} · {profile.education.specialization}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {profile.education.courseStart} – {profile.education.courseEnd} · CGPA {profile.education.cgpa}
              </p>
            </div>
          </section>

          {/* Skills */}
          <section className="panel p-5">
            <h2 className="text-lg font-semibold">Skills</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.skills.map((s) => (
                <span key={s.name} className="rounded-full bg-secondary px-3 py-1.5 text-xs">
                  {s.name} · <span className="text-muted-foreground">{s.level}</span>
                </span>
              ))}
            </div>
          </section>

          {/* Experience */}
          {profile.experience.length > 0 && (
            <section className="panel p-5">
              <h2 className="text-lg font-semibold">Experience</h2>
              <ul className="mt-4 space-y-2">
                {profile.experience.map((e) => (
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

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Finder Profile Badge */}
          {applicant.externalUserId && (
            <div className="panel p-5">
              <p className="text-eyebrow">Finder account</p>
              <div className="mt-3 flex items-start gap-3">
                <BadgeCheck className="size-5 shrink-0 text-primary mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">Verified Finder user</p>
                  <p className="mt-0.5 text-xs text-muted-foreground break-all">
                    UID: {applicant.externalUserId.slice(0, 16)}…
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      window.open(
                        `https://iv52bugou5xppexnhffgj53hwq0rorrh.lambda-url.ap-south-1.on.aws/users/view/${applicant.externalUserId}`,
                        "_blank"
                      )
                    }
                    className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="size-3" /> Open Finder profile
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Aura Points */}
          <div className="panel p-5">
            <p className="text-eyebrow">Aura points</p>
            <p className="mt-1 flex items-center gap-2 font-display text-2xl font-semibold">
              <Sparkles className="size-5 text-primary" /> {profile.auraPoints.toLocaleString()}
            </p>
            {profile.auraLevel && (
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-primary">
                {profile.auraLevel}
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Earned across sessions, referrals and community activity.
            </p>
          </div>

          {/* Move stage */}
          <div className="panel p-5">
            <p className="text-eyebrow">Move stage</p>
            <div className="mt-3 grid gap-2">
              {(["Shortlisted", "Interview", "Hired", "Rejected"] as const).map((s) => (
                <Button
                  key={s}
                  variant={currentStage === s ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStageChange(s)}
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
