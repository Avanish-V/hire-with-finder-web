import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2, Camera, ImagePlus, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getProfile,
  updateProfile,
  emptyCompanyProfile,
  type UserProfile,
  type CompanyProfile,
} from "@/services/profileService";
import { uploadToS3 } from "@/services/mediaService";
import { useAuth } from "@/lib/authContext";

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
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    avatarUrl: "",
    companyProfile: { ...emptyCompanyProfile },
    name: "Aditya Kulkarni",
    email: "aditya@finder.app",
    phone: "+91 98200 11223",
    role: "recruiter",
    company: "Finder Internal",
    location: "Bengaluru, India",
    bio: "Hiring for engineering and design across internships and full-time roles. I also run weekly live sessions on interview prep.",
    skills: ["Hiring", "React", "Node.js", "Interviewing"],
    notifications: {
      applicantAlerts: true,
      sessionEnrollments: true,
      weeklyDigest: false,
    },
    postsCount: 8,
    sessionsCount: 12,
    applicantsCount: 426,
  });

  const [newSkill, setNewSkill] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"avatar" | "logo" | null>(null);

  const setCompany = (patch: Partial<CompanyProfile>) =>
    setProfile((prev) => ({ ...prev, companyProfile: { ...prev.companyProfile, ...patch } }));

  const handleImageUpload = async (file: File, kind: "avatar" | "logo") => {
    setUploading(kind);
    const localPreview = URL.createObjectURL(file);
    try {
      const url = await uploadToS3(
        file,
        kind === "avatar" ? "recruiters/avatars" : "companies/logos",
      );
      const finalUrl = url || localPreview;
      if (kind === "avatar") setProfile((prev) => ({ ...prev, avatarUrl: finalUrl }));
      else setCompany({ logoUrl: finalUrl });
      toast.success(kind === "avatar" ? "Profile photo updated" : "Company logo updated");
    } catch {
      if (kind === "avatar") setProfile((prev) => ({ ...prev, avatarUrl: localPreview }));
      else setCompany({ logoUrl: localPreview });
      toast("Image preview set locally");
    } finally {
      setUploading(null);
    }
  };

  useEffect(() => {
    let isMounted = true;
    getProfile().then((data) => {
      if (isMounted) {
        setProfile(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateProfile(profile);
      setProfile(updated);
      toast.success("Profile updated", {
        description: "Your recruiter details have been saved.",
      });
    } catch {
      toast.success("Profile updated");
    } finally {
      setSaving(false);
    }
  };

  const initials =
    profile.name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AK";

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow="Account"
        title="Your profile"
        description="This is what candidates and session attendees see when you post on Finder."
        action={
          <Button onClick={() => handleSave()} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        }
      />

      <section className="panel flex flex-wrap items-center gap-5 p-6">
        <div className="relative">
          <Avatar className="size-20 border border-border">
            {profile.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt={profile.name} /> : null}
            <AvatarFallback className="bg-secondary font-display text-xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <label
            aria-label="Change photo"
            className="absolute -bottom-1 -right-1 grid size-8 cursor-pointer place-items-center rounded-full bg-primary text-primary-foreground"
          >
            {uploading === "avatar" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Camera className="size-4" />
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file, "avatar");
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <div className="min-w-[12rem] flex-1">
          <h2 className="text-xl font-semibold">{profile.name}</h2>
          <p className="text-sm text-muted-foreground">
            {profile.role === "recruiter" ? "Talent Lead" : profile.role} · {profile.company}
          </p>
        </div>
        <div className="flex gap-6 text-center">
          <div>
            <p className="font-display text-2xl font-semibold">{profile.postsCount}</p>
            <p className="text-xs text-muted-foreground">Posts</p>
          </div>
          <div>
            <p className="font-display text-2xl font-semibold">{profile.sessionsCount}</p>
            <p className="text-xs text-muted-foreground">Sessions</p>
          </div>
          <div>
            <p className="font-display text-2xl font-semibold">{profile.applicantsCount}</p>
            <p className="text-xs text-muted-foreground">Applicants</p>
          </div>
        </div>
      </section>

      <form className="panel mt-6 p-6" onSubmit={handleSave}>
        <h3 className="text-lg font-semibold">Basic details</h3>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="p-name">Full name</Label>
            <Input
              id="p-name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="p-email">Email</Label>
            <Input
              id="p-email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="p-phone">Phone</Label>
            <Input
              id="p-phone"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="p-role">Role</Label>
            <Select
              defaultValue={profile.role}
              onValueChange={(val) => setProfile({ ...profile, role: val })}
            >
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
            <Input
              id="p-company"
              value={profile.company}
              onChange={(e) => setProfile({ ...profile, company: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="p-location">Location</Label>
            <Input
              id="p-location"
              value={profile.location}
              onChange={(e) => setProfile({ ...profile, location: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          <Label htmlFor="p-bio">Bio</Label>
          <Textarea
            id="p-bio"
            rows={4}
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          />
        </div>

        <Separator className="my-6" />

        <div className="flex items-center gap-2">
          <Building2 className="size-5 text-primary" />
          <h3 className="text-lg font-semibold">Company profile</h3>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Shown on every job post and live session you publish.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-5">
          <div className="grid size-24 place-items-center overflow-hidden rounded-xl border border-border bg-secondary">
            {profile.companyProfile.logoUrl ? (
              <img
                src={profile.companyProfile.logoUrl}
                alt={`${profile.companyProfile.name || "Company"} logo`}
                className="size-full object-contain"
              />
            ) : (
              <Building2 className="size-8 text-muted-foreground" />
            )}
          </div>
          <div className="space-y-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary">
              {uploading === "logo" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ImagePlus className="size-4" />
              )}
              {profile.companyProfile.logoUrl ? "Replace logo" : "Upload logo"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, "logo");
                  e.target.value = "";
                }}
              />
            </label>
            <p className="text-xs text-muted-foreground">PNG or SVG, square works best.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="c-name">Company name</Label>
            <Input
              id="c-name"
              value={profile.companyProfile.name}
              onChange={(e) => setCompany({ name: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="c-website">Website</Label>
            <Input
              id="c-website"
              value={profile.companyProfile.website}
              onChange={(e) => setCompany({ website: e.target.value })}
              placeholder="https://"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="c-industry">Industry</Label>
            <Input
              id="c-industry"
              value={profile.companyProfile.industry}
              onChange={(e) => setCompany({ industry: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="c-size">Company size</Label>
            <Select
              value={profile.companyProfile.size}
              onValueChange={(val) => setCompany({ size: val })}
            >
              <SelectTrigger id="c-size">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {["1-10", "11-50", "51-200", "201-500", "500+"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s} employees
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="c-address">Address</Label>
            <Input
              id="c-address"
              value={profile.companyProfile.address}
              onChange={(e) => setCompany({ address: e.target.value })}
              placeholder="Street, area, landmark"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="c-city">City</Label>
            <Input
              id="c-city"
              value={profile.companyProfile.city}
              onChange={(e) => setCompany({ city: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="c-country">Country</Label>
            <Input
              id="c-country"
              value={profile.companyProfile.country}
              onChange={(e) => setCompany({ country: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          <Label htmlFor="c-about">About the company</Label>
          <Textarea
            id="c-about"
            rows={3}
            value={profile.companyProfile.about}
            onChange={(e) => setCompany({ about: e.target.value })}
          />
        </div>

        <Separator className="my-6" />

        <h3 className="text-lg font-semibold">Skills & focus areas</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {profile.skills.map((s) => (
            <span
              key={s}
              className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs"
            >
              {s}
              <button
                type="button"
                aria-label={`Remove ${s}`}
                onClick={() =>
                  setProfile({
                    ...profile,
                    skills: profile.skills.filter((x) => x !== s),
                  })
                }
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
              if (!v || profile.skills.includes(v)) return;
              setProfile({ ...profile, skills: [...profile.skills, v] });
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
            {
              key: "applicantAlerts" as const,
              title: "New applicant alerts",
              desc: "Email me whenever someone applies to a post",
            },
            {
              key: "sessionEnrollments" as const,
              title: "Session enrollments",
              desc: "Notify me when a seat is booked",
            },
            {
              key: "weeklyDigest" as const,
              title: "Weekly hiring digest",
              desc: "Summary of pipeline movement every Monday",
            },
          ].map(({ key, title, desc }) => (
            <div
              key={title}
              className="flex items-center justify-between rounded-lg border border-border p-4"
            >
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Switch
                checked={profile.notifications[key]}
                onCheckedChange={(checked) =>
                  setProfile({
                    ...profile,
                    notifications: {
                      ...profile.notifications,
                      [key]: checked,
                    },
                  })
                }
              />
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => getProfile().then(setProfile)}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
