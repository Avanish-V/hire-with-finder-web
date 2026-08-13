export type JobType = "Internship" | "Full-time" | "Part-time" | "Contract";

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: JobType;
  stipend: string;
  posted: string;
  applicants: number;
  skills: string[];
  status: "Open" | "Closed" | "Draft";
};

export const jobs: Job[] = [
  {
    id: "j1",
    title: "Frontend Engineering Intern",
    company: "Northwind Labs",
    location: "Remote · India",
    type: "Internship",
    stipend: "₹25,000 / mo",
    posted: "2 days ago",
    applicants: 48,
    skills: ["React", "TypeScript", "Tailwind"],
    status: "Open",
  },
  {
    id: "j2",
    title: "Node.js Backend Developer",
    company: "Finder Internal",
    location: "Bengaluru · Hybrid",
    type: "Full-time",
    stipend: "₹14–20 LPA",
    posted: "5 days ago",
    applicants: 132,
    skills: ["Node.js", "Postgres", "AWS"],
    status: "Open",
  },
  {
    id: "j3",
    title: "Product Design Intern",
    company: "Halo Studio",
    location: "Remote",
    type: "Internship",
    stipend: "₹18,000 / mo",
    posted: "1 week ago",
    applicants: 27,
    skills: ["Figma", "Prototyping"],
    status: "Open",
  },
  {
    id: "j4",
    title: "Data Analyst (Contract)",
    company: "Quanta Metrics",
    location: "Pune · On-site",
    type: "Contract",
    stipend: "₹65,000 / mo",
    posted: "3 weeks ago",
    applicants: 19,
    skills: ["SQL", "Python", "Looker"],
    status: "Closed",
  },
  {
    id: "j5",
    title: "DevRel Associate",
    company: "Stackline",
    location: "Remote · Global",
    type: "Part-time",
    stipend: "$1,200 / mo",
    posted: "Draft",
    applicants: 0,
    skills: ["Writing", "Community"],
    status: "Draft",
  },
];

export type LiveSession = {
  id: string;
  title: string;
  host: string;
  date: string;
  time: string;
  duration: string;
  seats: number;
  enrolled: number;
  price: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  status: "Live now" | "Scheduled" | "Completed";
  meetLink: string;
  tags: string[];
  thumbnail?: string;
  summary?: string;
  modules?: SessionModule[];
};

export type SessionModule = {
  title: string;
  duration: string;
  detail?: string;
};

export const defaultModules: SessionModule[] = [
  { title: "Kickoff & goals", duration: "10 min", detail: "What we cover and how to follow along." },
  { title: "Core concepts walkthrough", duration: "35 min", detail: "Live teaching with shared screen." },
  { title: "Hands-on build", duration: "30 min", detail: "Work through a real problem together." },
  { title: "Q&A and next steps", duration: "15 min", detail: "Open questions, resources, homework." },
];

export const sessions: LiveSession[] = [
  {
    id: "s1",
    title: "System Design for Interviews",
    host: "Aarav Mehta",
    date: "Aug 14, 2026",
    time: "7:00 PM IST",
    duration: "90 min",
    seats: 100,
    enrolled: 84,
    price: "₹499",
    level: "Intermediate",
    status: "Live now",
    meetLink: "meet.google.com/fdr-sysd-101",
    tags: ["System Design", "Interview"],
  },
  {
    id: "s2",
    title: "React Performance Deep Dive",
    host: "Sara Iqbal",
    date: "Aug 18, 2026",
    time: "8:30 PM IST",
    duration: "2 hrs",
    seats: 60,
    enrolled: 41,
    price: "₹799",
    level: "Advanced",
    status: "Scheduled",
    meetLink: "meet.google.com/fdr-react-perf",
    tags: ["React", "Performance"],
  },
  {
    id: "s3",
    title: "Resume & Portfolio Clinic",
    host: "Finder Careers",
    date: "Aug 21, 2026",
    time: "6:00 PM IST",
    duration: "60 min",
    seats: 200,
    enrolled: 156,
    price: "Free",
    level: "Beginner",
    status: "Scheduled",
    meetLink: "meet.google.com/fdr-resume",
    tags: ["Career", "Portfolio"],
  },
  {
    id: "s4",
    title: "Intro to Node.js APIs",
    host: "Dev Kapoor",
    date: "Aug 02, 2026",
    time: "7:00 PM IST",
    duration: "75 min",
    seats: 80,
    enrolled: 80,
    price: "₹299",
    level: "Beginner",
    status: "Completed",
    meetLink: "meet.google.com/fdr-node-api",
    tags: ["Node.js", "API"],
  },
];

export type Applicant = {
  id: string;
  name: string;
  initials: string;
  role: string;
  target: string;
  kind: "Job" | "Session";
  applied: string;
  match: number;
  stage: "New" | "Shortlisted" | "Interview" | "Hired" | "Rejected";
  email: string;
};

export const applicants: Applicant[] = [
  {
    id: "a1",
    name: "Priya Nair",
    initials: "PN",
    role: "Final year, NIT Trichy",
    target: "Frontend Engineering Intern",
    kind: "Job",
    applied: "2h ago",
    match: 92,
    stage: "Shortlisted",
    email: "priya.nair@mail.com",
  },
  {
    id: "a2",
    name: "Rohit Sharma",
    initials: "RS",
    role: "3 yrs · Backend",
    target: "Node.js Backend Developer",
    kind: "Job",
    applied: "6h ago",
    match: 88,
    stage: "Interview",
    email: "rohit.s@mail.com",
  },
  {
    id: "a3",
    name: "Ananya Gupta",
    initials: "AG",
    role: "Designer",
    target: "Product Design Intern",
    kind: "Job",
    applied: "1d ago",
    match: 76,
    stage: "New",
    email: "ananya@mail.com",
  },
  {
    id: "a4",
    name: "Kabir Sethi",
    initials: "KS",
    role: "Student",
    target: "System Design for Interviews",
    kind: "Session",
    applied: "1d ago",
    match: 64,
    stage: "New",
    email: "kabir@mail.com",
  },
  {
    id: "a5",
    name: "Meera Joshi",
    initials: "MJ",
    role: "2 yrs · Analytics",
    target: "Resume & Portfolio Clinic",
    kind: "Session",
    applied: "2d ago",
    match: 71,
    stage: "Shortlisted",
    email: "meera.j@mail.com",
  },
  {
    id: "a6",
    name: "Ishaan Verma",
    initials: "IV",
    role: "Fresher",
    target: "Frontend Engineering Intern",
    kind: "Job",
    applied: "3d ago",
    match: 55,
    stage: "Rejected",
    email: "ishaan.v@mail.com",
  },
  {
    id: "a7",
    name: "Neha Raut",
    initials: "NR",
    role: "5 yrs · Full-stack",
    target: "Node.js Backend Developer",
    kind: "Job",
    applied: "4d ago",
    match: 95,
    stage: "Hired",
    email: "neha.raut@mail.com",
  },
];

export const stageTone: Record<Applicant["stage"], string> = {
  New: "bg-muted text-muted-foreground",
  Shortlisted: "bg-warning/15 text-warning",
  Interview: "bg-chart-4/15 text-chart-4",
  Hired: "bg-success/15 text-success",
  Rejected: "bg-destructive/15 text-destructive",
};

export type CandidateEducation = {
  college: string;
  course: string;
  specialization: string;
  courseStart: string;
  courseEnd: string;
  cgpa: string;
};

export type CandidateSkill = { name: string; level: "Beginner" | "Intermediate" | "Advanced" };

export type CandidateProfile = {
  tagline: string;
  summary: string;
  phone: string;
  gender: "Male" | "Female" | "Other" | "Unspecified";
  location: string;
  verified: boolean;
  githubUsername?: string;
  auraPoints: number;
  education: CandidateEducation;
  skills: CandidateSkill[];
  experience: { role: string; org: string; period: string }[];
};

const profiles: Record<string, CandidateProfile> = {
  a1: {
    tagline: "Frontend engineer in the making",
    summary:
      "Final-year CS student building production React apps. Interned on a design-system team and shipped 20+ accessible components.",
    phone: "+91 90000 11223",
    gender: "Female",
    location: "Trichy, India",
    verified: true,
    githubUsername: "priyanair",
    auraPoints: 1840,
    education: {
      college: "NIT Trichy",
      course: "B.Tech",
      specialization: "Computer Science",
      courseStart: "2022",
      courseEnd: "2026",
      cgpa: "9.1",
    },
    skills: [
      { name: "React", level: "Advanced" },
      { name: "TypeScript", level: "Intermediate" },
      { name: "Tailwind", level: "Advanced" },
    ],
    experience: [{ role: "Frontend Intern", org: "Bluepine", period: "May–Jul 2025" }],
  },
  a2: {
    tagline: "Backend engineer · distributed systems",
    summary:
      "Three years building Node.js services on AWS. Owned a payments API handling 4M requests/day.",
    phone: "+91 98111 44556",
    gender: "Male",
    location: "Bengaluru, India",
    verified: true,
    githubUsername: "rohit-sh",
    auraPoints: 2560,
    education: {
      college: "VIT Vellore",
      course: "B.E.",
      specialization: "Information Technology",
      courseStart: "2018",
      courseEnd: "2022",
      cgpa: "8.4",
    },
    skills: [
      { name: "Node.js", level: "Advanced" },
      { name: "Postgres", level: "Advanced" },
      { name: "AWS", level: "Intermediate" },
    ],
    experience: [
      { role: "SDE II", org: "Payflow", period: "2023–present" },
      { role: "SDE I", org: "Zeta Labs", period: "2022–2023" },
    ],
  },
};

export function profileFor(a: Applicant): CandidateProfile {
  return (
    profiles[a.id] ?? {
      tagline: a.role,
      summary: `${a.name} applied to ${a.target}. Profile synced from their Finder account.`,
      phone: "+91 90000 00000",
      gender: "Unspecified",
      location: "India",
      verified: a.match >= 80,
      githubUsername: a.name.toLowerCase().replace(/\s+/g, ""),
      auraPoints: a.match * 12,
      education: {
        college: "Not provided",
        course: "Not provided",
        specialization: "—",
        courseStart: "—",
        courseEnd: "—",
        cgpa: "—",
      },
      skills: [
        { name: "Communication", level: "Intermediate" },
        { name: "Problem solving", level: "Intermediate" },
      ],
      experience: [],
    }
  );
}
