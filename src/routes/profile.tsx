import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile — Finder" },
      {
        name: "description",
        content:
          "Update your Finder profile, recruiter details, skills and notification preferences.",
      },
      { property: "og:title", content: "Your Profile — Finder" },
      {
        property: "og:description",
        content: "Manage your recruiter identity and preferences on Finder.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const [skills, setSkills] = useState(["Hiring", "React", "Node.js", "Interviewing"]);
  const [newSkill, setNewSkill] = useState("");

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow="Account"
        title="Your profile"
        description="This is what candidates and session attendees see when you post on Finder."
        action={
          <Button onClick={() => toast.success("Profile updated")}>Save changes</Button>
        }
      />

      <section className="panel flex flex-wrap items-center gap-5 p-6">
        <div className="relative">
          <Avatar className="size-20 border border-border">
            <AvatarFallback className="bg-secondary font-display text-xl">AK</AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => toast("Photo upload coming from your backend")}
            aria-label="Change photo"
            className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full bg-primary text-primary-foreground"
          >
            <Camera className="size-4" />
          </button>
        </div>
        <div className="min-w-[12rem] flex-1">
          <h2 className="text-xl font-semibold">Aditya Kulkarni</h2>
          <p className="text-sm text-muted-foreground">Talent Lead · Finder Internal</p>
        </div>
        <div className="flex gap-6 text-center">
          <div>
            <p className="font-display text-2xl font-semibold">8</p>
            <p className="text-xs text-muted-foreground">Posts</p>
          </div>
          <div>
            <p className="font-display text-2xl font-semibold">12</p>
            <p className="text-xs text-muted-foreground">Sessions</p>
          </div>
          <div>
            <p className="font-display text-2xl font-semibold">426</p>
            <p className="text-xs text-muted-foreground">Applicants</p>
          </div>
        </div>
      </section>

      <form
        className="panel mt-6 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("Profile updated");
        }}
      >
        <h3 className="text-lg font-semibold">Basic details</h3>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="p-name">Full name</Label>
            <Input id="p-name" defaultValue="Aditya Kulkarni" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="p-email">Email</Label>
            <Input id="p-email" type="email" defaultValue="aditya@finder.app" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="p-phone">Phone</Label>
            <Input id="p-phone" defaultValue="+91 98200 11223" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="p-role">Role</Label>
            <Select defaultValue="recruiter">
              <SelectTrigger id="p-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recruiter">Recruiter</SelectItem>
                <SelectItem value="mentor">Mentor / Instructor</SelectItem>
                <SelectItem value="candidate">Candidate</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="p-company">Company</Label>
            <Input id="p-company" defaultValue="Finder Internal" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="p-location">Location</Label>
            <Input id="p-location" defaultValue="Bengaluru, India" />
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          <Label htmlFor="p-bio">Bio</Label>
          <Textarea
            id="p-bio"
            rows={4}
            defaultValue="Hiring for engineering and design across internships and full-time roles. I also run weekly live sessions on interview prep."
          />
        </div>

        <Separator className="my-6" />

        <h3 className="text-lg font-semibold">Skills & focus areas</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {skills.map((s) => (
            <span
              key={s}
              className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs"
            >
              {s}
              <button
                type="button"
                aria-label={`Remove ${s}`}
                onClick={() => setSkills(skills.filter((x) => x !== s))}
              >
                <X className="size-3 text-muted-foreground hover:text-destructive" />
              </button>
            </span>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="Add a skill"
            className="max-w-xs"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const v = newSkill.trim();
              if (!v || skills.includes(v)) return;
              setSkills([...skills, v]);
              setNewSkill("");
            }}
          >
            <Plus className="size-4" /> Add
          </Button>
        </div>

        <Separator className="my-6" />

        <h3 className="text-lg font-semibold">Notifications</h3>
        <div className="mt-4 space-y-3">
          {[
            ["New applicant alerts", "Email me whenever someone applies to a post"],
            ["Session enrollments", "Notify me when a seat is booked"],
            ["Weekly hiring digest", "Summary of pipeline movement every Monday"],
          ].map(([title, desc], i) => (
            <div
              key={title}
              className="flex items-center justify-between rounded-lg border border-border p-4"
            >
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Switch defaultChecked={i !== 2} />
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost">
            Cancel
          </Button>
          <Button type="submit">Save changes</Button>
        </div>
      </form>
    </div>
  );
}
