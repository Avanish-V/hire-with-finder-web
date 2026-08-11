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
};

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
