import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Download, Mail, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { stageTone, type Applicant } from "@/lib/finder-data";
import { getApplicants } from "@/services/applicantsService";
import { CandidateProfileScreen } from "@/components/CandidateProfile";

export const Route = createFileRoute("/applicants")({
  head: () => ({
    meta: [
      { title: "Applicants & Enrollments — Finder" },
      {
        name: "description",
        content:
          "See who applied to each job post or enrolled in a live skill session, and move them through your hiring pipeline.",
      },
      { property: "og:title", content: "Applicants & Enrollments — Finder" },
      {
        property: "og:description",
        content: "Full pipeline management for job applicants and session enrollees.",
      },
    ],
  }),
  component: ApplicantsPage,
});

const stages: Applicant["stage"][] = ["New", "Shortlisted", "Interview", "Hired", "Rejected"];

function ApplicantsPage() {
  const [applicantsList, setApplicantsList] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState<"all" | "Job" | "Session">("all");
  const [stage, setStage] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);

  useEffect(() => {
    let isMounted = true;
    getApplicants().then((data) => {
      if (isMounted) {
        setApplicantsList(data);
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);


  const rows = useMemo(
    () =>
      applicantsList.filter(
        (a) =>
          (kind === "all" || a.kind === kind) &&
          (stage === "all" || a.stage === stage) &&
          (a.name.toLowerCase().includes(query.toLowerCase()) ||
            a.target.toLowerCase().includes(query.toLowerCase())),
      ),
    [applicantsList, kind, stage, query],
  );

  return (
    <div className="w-full">
      <PageHeader
        eyebrow="Pipeline"
        title="Applicants & enrollments"
        description="Everyone who applied to a role or enrolled in a live session, in one manageable list."
        action={
          <Button variant="outline" onClick={() => toast.success("Export started (CSV)")}>
            <Download className="size-4" /> Export
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stages.map((s) => (
          <div key={s} className="panel p-4">
            <p className="text-eyebrow">{s}</p>
            {loading ? (
              <Skeleton className="mt-2 h-8 w-12" />
            ) : (
              <p className="mt-2 font-display text-2xl font-semibold">
                {applicantsList.filter((a) => a.stage === s).length}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="panel mt-6">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <Tabs value={kind} onValueChange={(v) => setKind(v as typeof kind)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="Job">Job applicants</TabsTrigger>
              <TabsTrigger value="Session">Session enrollees</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative min-w-[12rem] flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search candidates or posts"
              className="pl-9"
            />
          </div>
          <Select value={stage} onValueChange={setStage}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {stages.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Applied to</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Match</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading &&
                [0, 1, 2, 3, 4].map((i) => (
                  <TableRow key={`sk-${i}`}>
                    {Array.from({ length: 7 }).map((_, c) => (
                      <TableCell key={c}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              {!loading && rows.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <button
                      type="button"
                      className="flex items-center gap-3 text-left"
                      onClick={() => setSelectedApplicant(a)}
                    >
                      <Avatar className="size-9 border border-border">
                        <AvatarFallback className="bg-secondary text-xs">
                          {a.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium hover:text-primary">{a.name}</p>
                        <p className="text-xs text-muted-foreground">{a.role}</p>
                      </div>
                    </button>
                  </TableCell>
                  <TableCell className="max-w-[14rem] truncate text-sm">{a.target}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{a.kind}</Badge>
                  </TableCell>
                  <TableCell className="font-display text-sm font-semibold text-primary">
                    {a.match}%
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{a.applied}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={stageTone[a.stage]}>
                      {a.stage}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedApplicant(a)}
                      >
                        <ExternalLink className="size-3.5 mr-1" />
                        View profile
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Email ${a.name}`}
                        onClick={() => toast.success(`Email drafted to ${a.email}`)}
                      >
                        <Mail className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No applicants match these filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {selectedApplicant && (
        <CandidateProfileScreen
          applicant={selectedApplicant}
          onClose={() => setSelectedApplicant(null)}
        />
      )}
    </div>
  );
}
