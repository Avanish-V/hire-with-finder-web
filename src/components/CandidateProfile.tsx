import { useEffect, useState } from "react";
import {
  X,
  Mail,
  Phone,
  MapPin,
  Github,
  BadgeCheck,
  GraduationCap,
  Sparkles,
  Loader2,
  ExternalLink,
  Code2,
  Award,
  Copy,
  Check,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { profileFor, type Applicant, type CandidateProfile } from "@/lib/finder-data";
import { getCandidateProfile } from "@/services/applicantsService";

const _CANDIDATE_API_BASE = (import.meta.env.VITE_CANDIDATE_API_URL as string || "http://localhost:8080").replace(/\/$/, "");
const PROFILE_BASE_URL = `${_CANDIDATE_API_BASE}/api/v1/users/view`;

const auraLevelColors: Record<string, string> = {
  NEWCOMER: "bg-muted text-muted-foreground border-border",
  SPARK: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  RISING: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  GLOWING: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  RADIANT: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  BLAZING: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  LEGENDARY: "bg-rose-500/10 text-rose-500 border-rose-500/20",
};

export function CandidateProfileScreen({
  applicant,
  onClose,
}: {
  applicant: Applicant;
  onClose: () => void;
}) {
  const [profile, setProfile] = useState<CandidateProfile>(() => profileFor(applicant));
  const [loading, setLoading] = useState(true);
  const [copiedUid, setCopiedUid] = useState(false);

  const resolvedUid = profile.uid || applicant.externalUserId || applicant.id;
  const isRealUid = resolvedUid && !resolvedUid.startsWith("std-") && !resolvedUid.startsWith("a-");
  const targetUrl = isRealUid ? `${PROFILE_BASE_URL}/${resolvedUid}` : null;

  useEffect(() => {
    let active = true;
    setLoading(true);

    getCandidateProfile(applicant).then((p) => {
      if (active) {
        setProfile(p);
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [applicant.id, applicant.externalUserId]);

  const handleCopyUid = () => {
    if (!resolvedUid) return;
    navigator.clipboard.writeText(resolvedUid);
    setCopiedUid(true);
    toast.success("User UID copied to clipboard");
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const handleOpenApiUrl = () => {
    if (!targetUrl) return;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  const displayName = profile.name || applicant.name || "Candidate";
  const displayEmail = profile.email || applicant.email || "applicant@example.com";
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || applicant.initials || "CA";

  const auraLevelKey = (profile.auraLevel || "NEWCOMER").toUpperCase();
  const auraBadgeClass = auraLevelColors[auraLevelKey] || "bg-primary/10 text-primary border-primary/20";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = origOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-background animate-in fade-in duration-200">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:px-8">
          <Button variant="ghost" size="icon" aria-label="Close profile" onClick={onClose}>
            <X className="size-4" />
          </Button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-semibold text-foreground">{displayName}</p>
              {profile.verified && (
                <span title="Verified Finder Profile">
                  <BadgeCheck className="size-4 shrink-0 text-primary" />
                </span>
              )}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {profile.tagline || applicant.role || "Applicant"}
            </p>
          </div>

          {loading && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin text-primary" />
              <span>Fetching live profile…</span>
            </div>
          )}


        </div>
      </div>

      {/* Main Content Layout */}
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:px-8 lg:grid-cols-[1.75fr_1fr]">
        <div className="space-y-6">
          {/* Hero Profile Card */}
          <section className="panel p-6">
            <div className="flex flex-wrap items-start gap-5">
              <Avatar className="size-20 border-2 border-border shadow-sm">
                {profile.avatarUrl ? (
                  <AvatarImage src={profile.avatarUrl} alt={displayName} className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary font-display text-xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-[12rem] flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">{displayName}</h1>
                  {profile.verified && (
                    <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/10 text-primary text-xs">
                      <BadgeCheck className="size-3.5" /> Verified
                    </Badge>
                  )}
                  {profile.gender && profile.gender !== "Unspecified" && (
                    <Badge variant="secondary" className="text-xs">
                      <User className="size-3 mr-1" /> {profile.gender}
                    </Badge>
                  )}
                </div>

                <p className="mt-1 text-sm font-medium text-muted-foreground">{profile.tagline}</p>

                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                  <a
                    href={`mailto:${displayEmail}`}
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                  >
                    <Mail className="size-3.5 text-primary" /> {displayEmail}
                  </a>

                  {profile.phone && profile.phone !== "+91 90000 00000" && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="size-3.5 text-primary" /> {profile.phone}
                    </span>
                  )}

                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-primary" /> {profile.location || "India"}
                  </span>

                  {profile.githubUsername && (
                    <a
                      href={`https://github.com/${profile.githubUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-primary hover:underline"
                    >
                      <Github className="size-3.5" /> @{profile.githubUsername}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Summary / About Me */}
          <section className="panel p-5">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Award className="size-4 text-primary" /> About
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
              {profile.summary || "No summary provided by user."}
            </p>
          </section>

          {/* Skills Section */}
          <section className="panel p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Code2 className="size-4 text-primary" /> Skills & Expertise
              </h2>
              <span className="text-xs text-muted-foreground">{profile.skills.length} skills listed</span>
            </div>

            {profile.skills.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.skills.map((s) => (
                  <div
                    key={s.name}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40"
                  >
                    <span>{s.name}</span>
                    {s.category && (
                      <span className="rounded bg-background/80 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {s.category}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No skills added yet.</p>
            )}
          </section>

          {/* Education Section */}
          {profile.education && (
            <section className="panel p-5">
              <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <GraduationCap className="size-4 text-primary" /> Education
              </h2>
              <div className="mt-4 rounded-lg border border-border bg-secondary/30 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{profile.education.college}</p>
                    <p className="text-xs text-muted-foreground">
                      {profile.education.course} {profile.education.specialization ? `· ${profile.education.specialization}` : ""}
                    </p>
                  </div>
                  {profile.education.cgpa && profile.education.cgpa !== "—" && (
                    <Badge variant="outline" className="border-primary/30 text-primary font-mono text-xs">
                      CGPA {profile.education.cgpa}
                    </Badge>
                  )}
                </div>

                {(profile.education.courseStart || profile.education.courseEnd) && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Duration: {profile.education.courseStart} – {profile.education.courseEnd}
                  </p>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar Info */}
        <aside className="space-y-4">
          {/* Aura Points Card */}
          <div className="panel p-5">
            <p className="text-eyebrow">Finder Aura</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="size-6" />
              </div>
              <div>
                <p className="font-display text-2xl font-bold tracking-tight text-foreground">
                  {profile.auraPoints.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Reputation Points</p>
              </div>
            </div>

            {profile.auraLevel && (
              <div className="mt-4">
                <Badge variant="outline" className={`border font-semibold uppercase tracking-wider px-2.5 py-1 ${auraBadgeClass}`}>
                  {profile.auraLevel} Tier
                </Badge>
              </div>
            )}

            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Earned by actively participating in live skill sessions, projects, referrals, and community events.
            </p>
          </div>



          {/* GitHub Connection */}
          {profile.githubUsername && (
            <div className="panel p-5">
              <p className="text-eyebrow">Developer Profile</p>
              <div className="mt-3 flex items-center gap-3">
                <Github className="size-5 text-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">@{profile.githubUsername}</p>
                  <a
                    href={`https://github.com/${profile.githubUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Open GitHub profile <ExternalLink className="size-2.5" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
