import { FormEvent, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Layout/Navbar";
import {
  ApplyPayload,
  JobItem,
  getApplicationsData,
  getJobsData,
  getRecommendedJobsForUser,
  saveApplication,
} from "@/lib/app-data";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

const emptyForm: ApplyPayload = {
  applicantName: "",
  applicantEmail: "",
  portfolioUrl: "",
  resumeUrl: "",
  note: "",
};

const Jobs = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
  const [form, setForm] = useState<ApplyPayload>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [minimumMatch, setMinimumMatch] = useState(70);
  const [workMode, setWorkMode] = useState<"all" | "remote" | "hybrid" | "onsite">("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs-data", user?.uid],
    queryFn: () => (user?.uid ? getRecommendedJobsForUser(user.uid) : getJobsData()),
    staleTime: 1000 * 60 * 5,
  });

  const { data: existingApplications = [] } = useQuery({
    queryKey: ["applications-data", user?.uid],
    queryFn: () => getApplicationsData(user?.uid ?? ""),
    enabled: !!user?.uid,
    staleTime: 1000 * 60,
  });

  const applicationsByJobId = useMemo(() => {
    const map = new Map<string, string>();
    existingApplications.forEach((app) => map.set(app.jobId, app.status));
    return map;
  }, [existingApplications]);

  const topTags = useMemo(() => {
    const tagCount = new Map<string, number>();
    jobs.forEach((job) => {
      job.tags.forEach((tag) => tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1));
    });

    return [...tagCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const lowerSearch = search.trim().toLowerCase();

    return jobs.filter((job) => {
      if (job.match < minimumMatch) return false;

      if (workMode === "remote" && !job.location.toLowerCase().includes("remote")) return false;
      if (workMode === "hybrid" && !job.location.toLowerCase().includes("hybrid")) return false;
      if (workMode === "onsite" && (job.location.toLowerCase().includes("remote") || job.location.toLowerCase().includes("hybrid"))) return false;

      if (selectedTags.length && !selectedTags.some((tag) => job.tags.includes(tag))) return false;

      if (lowerSearch) {
        const haystack = `${job.role} ${job.company} ${job.location} ${job.tags.join(" ")}`.toLowerCase();
        if (!haystack.includes(lowerSearch)) return false;
      }

      return true;
    });
  }, [jobs, minimumMatch, workMode, selectedTags, search]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((value) => value !== tag) : [...prev, tag]));
  };

  const clearFilters = () => {
    setSearch("");
    setMinimumMatch(70);
    setWorkMode("all");
    setSelectedTags([]);
  };

  const handleSave = async (job: JobItem) => {
    if (!user?.uid) {
      toast({ title: "Sign in required", description: "Please sign in to save roles." });
      return;
    }

    await saveApplication(user.uid, job, "Saved");
    await queryClient.invalidateQueries({ queryKey: ["applications-data", user.uid] });
    toast({ title: "Role saved", description: "You can review it in Applications." });
  };

  const openApplyPopup = (job: JobItem) => {
    if (!user?.uid) {
      toast({ title: "Sign in required", description: "Please sign in to apply to roles." });
      return;
    }

    setSelectedJob(job);
    setForm({
      ...emptyForm,
      applicantEmail: user.email || "",
      applicantName: user.displayName || "",
    });
  };

  const closeApplyPopup = () => {
    if (submitting) return;
    setSelectedJob(null);
    setForm(emptyForm);
  };

  const submitApplication = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?.uid || !selectedJob) return;

    if (!form.applicantName.trim() || !form.applicantEmail.trim()) {
      toast({ title: "Missing details", description: "Name and email are required to apply." });
      return;
    }

    setSubmitting(true);
    try {
      await saveApplication(user.uid, selectedJob, "Applied", {
        ...form,
        applicantName: form.applicantName.trim(),
        applicantEmail: form.applicantEmail.trim(),
        portfolioUrl: form.portfolioUrl?.trim(),
        resumeUrl: form.resumeUrl?.trim(),
        note: form.note?.trim(),
      });

      await queryClient.invalidateQueries({ queryKey: ["applications-data", user.uid] });
      toast({ title: "Application submitted", description: "Your application has been added to tracker." });
      closeApplyPopup();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-bg min-h-screen text-white pb-10">
      <Navbar />

      <main className="px-4 md:px-8 pt-6">
        <div className="mx-auto max-w-[1240px]">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-5xl font-bold">Job Discovery</h1>
              <p className="mt-2 text-white/55">{filteredJobs.length} roles match your current filter set.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#090d17] px-4 py-2 text-sm text-white/70">
              Ranked by contribution fit
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[290px_1fr]">
            <aside className="rounded-2xl border border-white/10 bg-[#090d17] p-5 h-fit lg:sticky lg:top-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Filters</h3>
                <button onClick={clearFilters} className="text-xs text-white/60 hover:text-white">Reset</button>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/45">Search</p>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Role, company, skill"
                    className="mt-2 h-10 w-full rounded-xl border border-white/15 bg-black/20 px-3 text-sm outline-none"
                  />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-white/45">Minimum Match</p>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="range"
                      min={50}
                      max={99}
                      value={minimumMatch}
                      onChange={(event) => setMinimumMatch(Number(event.target.value))}
                      className="w-full"
                    />
                    <span className="text-sm font-semibold">{minimumMatch}%</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-white/45">Work Mode</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {[
                      { id: "all", label: "All" },
                      { id: "remote", label: "Remote" },
                      { id: "hybrid", label: "Hybrid" },
                      { id: "onsite", label: "Onsite" },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setWorkMode(mode.id as typeof workMode)}
                        className={`rounded-xl border px-3 py-1.5 text-xs ${
                          workMode === mode.id ? "border-white/30 bg-white/10" : "border-white/10 bg-black/20"
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-white/45">Skill Tags</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {topTags.map((tag) => {
                      const active = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`rounded-full border px-2.5 py-1 text-xs ${
                            active ? "border-[#ff7a00]/45 bg-[#2a1406] text-[#ff9b3d]" : "border-white/15 bg-black/20 text-white/70"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </aside>

            <section className="space-y-4">
              {filteredJobs.map((job) => {
                const existingStatus = applicationsByJobId.get(job.id);
                return (
                  <article key={job.id} className="rounded-2xl border border-white/10 bg-[#090d17] p-5 md:p-6">
                    <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
                      <div>
                        <h3 className="text-3xl font-bold leading-tight">{job.role}</h3>
                        <p className="mt-1 text-sm text-white/55">{job.company} - {job.location} - {job.posted}</p>

                        <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-4">
                          <p className="text-[11px] uppercase tracking-wider text-white/45">Why you match</p>
                          <p className="mt-2 text-sm leading-6 text-white/75">{job.why}</p>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {job.tags.map((tag) => (
                            <span key={tag} className="app-chip">{tag}</span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="rounded-xl border border-[#ff7a00]/40  py-4 text-center font-semibold text-[#ff9b3d]">
                          {job.match}% Match
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/25 p-4 min-h-[130px]">
                          <p className="text-[11px] uppercase tracking-wider text-white/45">Skill gap</p>
                          <p className="mt-2 text-sm text-white/70">{job.skillGap}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleSave(job)} className="app-btn-secondary flex-1">
                            {existingStatus === "Saved" ? "Saved" : "Save"}
                          </button>
                          <button onClick={() => openApplyPopup(job)} className="app-btn-primary flex-1">
                            {existingStatus === "Applied" ? "Applied" : "Apply"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}

              {!filteredJobs.length && (
                <div className="rounded-2xl border border-white/10 bg-[#090d17] p-6 text-white/60">
                  No jobs match your filters. Try lowering minimum match or clearing skill tags.
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={closeApplyPopup}>
          <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-[#090d17] p-6" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">Apply for {selectedJob.role}</h2>
                <p className="mt-1 text-sm text-white/60">{selectedJob.company} - {selectedJob.location}</p>
              </div>
              <button onClick={closeApplyPopup} className="rounded-xl border border-white/20 px-3 py-1 text-sm text-white/80">Close</button>
            </div>

            <form onSubmit={submitApplication} className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <input value={form.applicantName} onChange={(event) => setForm((prev) => ({ ...prev, applicantName: event.target.value }))} placeholder="Full name" className="h-10 rounded-xl border border-white/15 bg-black/20 px-3 text-sm outline-none" />
                <input value={form.applicantEmail} onChange={(event) => setForm((prev) => ({ ...prev, applicantEmail: event.target.value }))} placeholder="Email" type="email" className="h-10 rounded-xl border border-white/15 bg-black/20 px-3 text-sm outline-none" />
                <input value={form.portfolioUrl} onChange={(event) => setForm((prev) => ({ ...prev, portfolioUrl: event.target.value }))} placeholder="Portfolio URL" className="h-10 rounded-xl border border-white/15 bg-black/20 px-3 text-sm outline-none" />
                <input value={form.resumeUrl} onChange={(event) => setForm((prev) => ({ ...prev, resumeUrl: event.target.value }))} placeholder="Resume URL" className="h-10 rounded-xl border border-white/15 bg-black/20 px-3 text-sm outline-none" />
              </div>

              <textarea value={form.note} onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))} placeholder="Short note to recruiter" className="min-h-24 w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm outline-none" />

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={closeApplyPopup} className="app-btn-secondary" disabled={submitting}>Cancel</button>
                <button type="submit" className="app-btn-primary" disabled={submitting}>{submitting ? "Submitting..." : "Submit Application"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;
