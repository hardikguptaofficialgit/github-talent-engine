import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Clock, DollarSign, Building2, ArrowUpRight, Sparkles, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Layout/Navbar";

const jobs = [
  {
    id: 1, title: "Frontend Engineering Intern", company: "Vercel", location: "Remote",
    type: "Internship", duration: "3 months", salary: "$4,000/mo", match: 94,
    skills: ["React", "TypeScript", "Next.js"],
    alignment: "Strong React ecosystem match. 89 merged PRs and consistent streak align perfectly.",
    gaps: ["Next.js App Router"], tip: "Contribute to next.js/examples to boost match by ~8%.",
  },
  {
    id: 2, title: "Open Source Developer Intern", company: "Supabase", location: "Remote",
    type: "Internship", duration: "6 months", salary: "$3,500/mo", match: 87,
    skills: ["TypeScript", "PostgreSQL", "Node.js"],
    alignment: "TypeScript proficiency (42%) and open-source activity strongly align.",
    gaps: ["PostgreSQL", "Deno"], tip: "Open a PR to supabase/supabase to demonstrate familiarity.",
  },
  {
    id: 3, title: "Junior Full-Stack Engineer", company: "Linear", location: "San Francisco",
    type: "Full-time", duration: "Permanent", salary: "$95k/yr", match: 82,
    skills: ["React", "TypeScript", "GraphQL", "Node.js"],
    alignment: "Full-stack profile with strong frontend depth. Code quality above threshold.",
    gaps: ["GraphQL", "System design"], tip: "Build a GraphQL API project and push to GitHub.",
  },
  {
    id: 4, title: "Developer Experience Intern", company: "Stripe", location: "Remote (US)",
    type: "Internship", duration: "4 months", salary: "$5,000/mo", match: 76,
    skills: ["TypeScript", "Python", "API Design"],
    alignment: "Multi-language profile and documentation contributions show DevEx aptitude.",
    gaps: ["API design patterns"], tip: "Contribute to stripe-node or write a dev tutorial.",
  },
  {
    id: 5, title: "Platform Engineering Fellow", company: "GitHub", location: "Remote",
    type: "Fellowship", duration: "12 months", salary: "$60k/yr", match: 71,
    skills: ["Go", "Rust", "Kubernetes", "CI/CD"],
    alignment: "Go contributions (15%) and DevOps interest show potential.",
    gaps: ["Rust", "Kubernetes"], tip: "Start contributing to github/gh-cli for direct alignment.",
  },
];

const Jobs = () => {
  const [search, setSearch] = useState("");
  const filtered = jobs.filter(
    (j) =>
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.company.toLowerCase().includes(search.toLowerCase()) ||
      j.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-3xl font-bold mb-2">
            Opportunities <span className="text-gradient-orange">For You</span>
          </h1>
          <p className="text-muted-foreground mb-8">
            Ranked by your GitHub contributions. Higher match = stronger alignment.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="flex gap-3 mb-8"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by role, company, or skill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl h-11 bg-card border-border"
            />
          </div>
          <Button variant="outline" className="rounded-xl gap-2 h-11">
            <Filter className="w-4 h-4" /> Filters
          </Button>
        </motion.div>

        <div className="flex flex-col gap-4">
          {filtered.map((job, i) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.05 }}
              className="clay-card p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg leading-tight">{job.title}</h3>
                      <p className="text-sm text-muted-foreground">{job.company}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.duration}</span>
                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{job.salary}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {job.skills.map((s) => (
                      <span key={s} className="px-2 py-0.5 text-xs rounded-md bg-secondary text-muted-foreground">{s}</span>
                    ))}
                  </div>

                  <div className="p-3.5 rounded-xl bg-secondary border border-border text-sm">
                    <div className="flex items-center gap-1.5 mb-1.5 text-primary text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5" /> AI Match Insight
                    </div>
                    <p className="text-muted-foreground text-xs leading-relaxed mb-1.5">{job.alignment}</p>
                    {job.gaps.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Gaps:</span> {job.gaps.join(", ")}
                      </p>
                    )}
                    <p className="text-xs text-primary mt-1.5">💡 {job.tip}</p>
                  </div>
                </div>

                <div className="flex lg:flex-col items-center lg:items-end gap-4 lg:gap-3 flex-shrink-0">
                  <div className="flex flex-col items-center">
                    <div className="relative w-14 h-14">
                      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                        <circle cx="28" cy="28" r="24" fill="none" stroke="hsl(var(--border))" strokeWidth="3.5" />
                        <circle cx="28" cy="28" r="24" fill="none" stroke="hsl(var(--primary))" strokeWidth="3.5"
                          strokeDasharray={`${job.match * 1.508} 999`} strokeLinecap="round" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{job.match}%</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-0.5">Match</span>
                  </div>
                  <Button className="rounded-xl gap-1.5" size="sm">
                    Apply <ArrowUpRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Jobs;
