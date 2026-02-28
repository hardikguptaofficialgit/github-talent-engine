import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Layout/Navbar";
import { getDashboardData, getJobsData, getRecommendedJobsForUser } from "@/lib/app-data";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import {
  getStoredGithubToken,
  refreshGithubInsights,
  syncGithubInsightsWithToken,
  syncGithubProfileFallback,
  clearStoredGithubToken,
} from "@/lib/firebase";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const Dashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const autoSyncRef = useRef(false);

  const { data, refetch } = useQuery({
    queryKey: ["dashboard-data", user?.uid],
    queryFn: () => getDashboardData(user?.uid ?? ""),
    enabled: !!user?.uid,
    staleTime: 1000 * 60 * 5,
  });
  const { data: jobRecommendations = [] } = useQuery({
    queryKey: ["dashboard-job-trends", user?.uid],
    queryFn: () => (user?.uid ? getRecommendedJobsForUser(user.uid) : getJobsData()),
    staleTime: 1000 * 60 * 5,
  });

  const bars = data?.consistencyBars ?? [];
  const repos = data?.repos ?? [];
  const consistencyChartData = bars.map((value, index) => ({ name: `W${index + 1}`, value }));
  const collaborationChartData = [
    { metric: "PRs", value: data?.collaboration.prsMerged ?? 0 },
    { metric: "Reviews", value: data?.collaboration.codeReviews ?? 0 },
    { metric: "Issues", value: data?.collaboration.issuesClosed ?? 0 },
  ];
  const selectedRepoData = repos.length ? repos.find((repo) => repo.name === selectedRepo) ?? repos[0] : null;
  const languages = data?.languages ?? [];
  const languageSet = new Set(languages.map((lang) => lang.name.toLowerCase()));
  const collaboration = data?.collaboration ?? { prsMerged: 0, codeReviews: 0, issuesClosed: 0 };
  const topRoles = [...jobRecommendations]
    .sort((a, b) => b.match - a.match)
    .slice(0, 3)
    .map((job) => `${job.role} at ${job.company}`);
  const trendTagCounts = jobRecommendations.reduce((acc, job) => {
    job.tags.forEach((tag) => acc.set(tag, (acc.get(tag) ?? 0) + 1));
    return acc;
  }, new Map<string, number>());
  const topTrendTags = [...trendTagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);
  const missingTrendTags = topTrendTags.filter((tag) => !languageSet.has(tag.toLowerCase())).slice(0, 3);
  const aiSuggestions = [
    (data?.consistencyScore ?? 0) < 6
      ? "Commit consistency is below trend-matched baseline. Target 4-5 focused contribution days each week."
      : "Consistency is strong. Keep the same weekly cadence to maintain high recruiter confidence.",
    collaboration.codeReviews < 5
      ? "Increase code review activity. Hiring trends reward visible collaboration and review depth."
      : "Your collaboration footprint is healthy; keep review activity visible across repos.",
    repos.length < 4
      ? "Pin and maintain at least 4 active repositories with recent updates to improve profile depth."
      : "Repository coverage looks good. Add READMEs and issue templates on top repos to boost quality signals.",
    missingTrendTags.length
      ? `Market trend gap: consider adding projects with ${missingTrendTags.join(", ")} to improve role match scores.`
      : "Your stack already aligns well with top market tags from current matching roles.",
  ];
  const aiFocusAreas = [
    `Top role matches: ${topRoles.length ? topRoles.join(" | ") : "No role matches yet. Refresh job feed."}`,
    `Trending skills in your matched jobs: ${topTrendTags.length ? topTrendTags.join(", ") : "No trend tags available yet."}`,
    `GitHub signal: ${repos.length} repositories analyzed, ${collaboration.prsMerged} PRs merged, ${collaboration.codeReviews} reviews tracked.`,
  ];
  const skillMappingData = [
    { skill: "Backend", score: 35 },
    { skill: "Frontend", score: 35 },
    { skill: "DevOps", score: 35 },
    { skill: "Cloud", score: 35 },
    { skill: "AI/ML", score: 35 },
  ];

  (data?.languages ?? []).forEach((lang) => {
    const name = lang.name.toLowerCase();
    if (["typescript", "javascript", "react", "vue", "angular", "css", "html"].includes(name)) {
      skillMappingData[1].score = Math.max(skillMappingData[1].score, Math.min(100, 35 + lang.value));
    }
    if (["node", "node.js", "python", "go", "java", "c#", "rust", "ruby", "php"].includes(name)) {
      skillMappingData[0].score = Math.max(skillMappingData[0].score, Math.min(100, 35 + lang.value));
    }
    if (["docker", "terraform", "kubernetes", "bash", "shell"].includes(name)) {
      skillMappingData[2].score = Math.max(skillMappingData[2].score, Math.min(100, 35 + lang.value));
    }
    if (["aws", "gcp", "azure", "hcl"].includes(name)) {
      skillMappingData[3].score = Math.max(skillMappingData[3].score, Math.min(100, 35 + lang.value));
    }
    if (["jupyter notebook", "r", "matlab", "scala", "julia"].includes(name)) {
      skillMappingData[4].score = Math.max(skillMappingData[4].score, Math.min(100, 35 + lang.value));
    }
  });

  if (!user) {
    return (
      <div className="app-bg min-h-screen text-white pb-10">
        <Navbar />
        <main className="px-4 md:px-8 pt-6">
          <div className="mx-auto max-w-[900px] app-panel rounded-2xl p-8">
            <h1 className="text-4xl font-bold">Dashboard</h1>
            <p className="mt-3 text-white/65">Sign in to view your personalized developer dashboard.</p>
          </div>
        </main>
      </div>
    );
  }

  const hasInsights =
    (data?.repoIntelligence?.length ?? 0) > 0 ||
    repos.length > 0 ||
    (data?.languages?.length ?? 0) > 0 ||
    (data?.contributionStrength ?? 0) > 0;

  useEffect(() => {
    if (!user || autoSyncRef.current || hasInsights) return;
    const token = getStoredGithubToken();
    if (!token) return;

    autoSyncRef.current = true;
    syncGithubInsightsWithToken({ user, accessToken: token })
      .then((sync) => {
        if (user?.uid) {
          queryClient.invalidateQueries({ queryKey: ["dashboard-data", user.uid] });
        }
        toast({
          title: "GitHub insights synced",
          description: `${sync.repoCount} repositories analyzed.`,
        });
      })
      .catch(async (error) => {
        await syncGithubProfileFallback({ user, accessToken: token });
        if (user?.uid) {
          queryClient.invalidateQueries({ queryKey: ["dashboard-data", user.uid] });
        }
        const message = error instanceof Error ? error.message : "";
        if (message.includes("401") || message.includes("403")) {
          clearStoredGithubToken();
        }
        toast({
          title: "GitHub sync failed",
          description: "Loaded basic profile data. Re-authorize GitHub to sync full insights.",
        });
      });
  }, [user, hasInsights, queryClient]);

  const monthLabels = (() => {
    const totalWeeks = Math.max(data?.heatmapWeeks?.length ?? 0, 52);
    const now = new Date();
    const labels: { label: string; week: number }[] = [];

    for (let week = 0; week < totalWeeks; week += 4) {
      const dt = new Date(now);
      dt.setDate(now.getDate() - (totalWeeks - 1 - week) * 7);
      labels.push({ label: dt.toLocaleString("en-US", { month: "short" }), week });
    }

    return labels;
  })();

  const handleResync = async () => {
    try {
      const token = user ? getStoredGithubToken() : null;
      const sync = token && user
        ? await syncGithubInsightsWithToken({ user, accessToken: token })
        : await refreshGithubInsights();
      if (user?.uid) {
        await queryClient.invalidateQueries({ queryKey: ["dashboard-data", user.uid] });
      }
      await refetch();
      toast({
        title: "Insights refreshed",
        description: `${sync.repoCount} repositories synced (${sync.privateRepoCount} private).`,
      });
    } catch {
      toast({ title: "Refresh failed", description: "GitHub authorization failed. Please re-authorize and try again." });
    }
  };

  return (
    <div className="app-bg min-h-screen text-white pb-10">
      <Navbar />

      <main className="px-4 md:px-8 pt-6">
        <div className="mx-auto max-w-[1240px]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
            <div>
              <h1 className="text-5xl font-bold">{data?.heading ?? "Dashboard"}</h1>
              <p className="text-white/55 mt-2">{data?.subheading ?? "Your metrics are loading."}</p>
            </div>
            <div className="flex gap-3">
              <div className="app-panel rounded-full px-5 py-2 text-sm">Live developer metrics</div>
              <button onClick={handleResync} className="app-btn-primary">Refresh insights</button>
            </div>
          </div>

          {!hasInsights && (
            <div className="mb-5 rounded-2xl border border-white/15 bg-[#0c172f] px-4 py-3 text-sm text-white/75">
              We could not find synced GitHub insights yet. Click <b>Refresh insights</b> to re-authorize and sync.
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <section className="app-panel rounded-2xl p-6 lg:col-span-3">
              <div className="mx-auto h-28 w-28 rounded-full border-[10px] border-[#ff7a00] flex items-center justify-center text-center">
                <div>
                  <div className="text-3xl font-bold">{data?.contributionStrength ?? 0}</div>
                  <div className="text-xs text-white/55">/100</div>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-center mt-5">Contribution Strength</h3>
              <p className="text-center text-sm text-white/55 mt-2">Based on your recent activity</p>
            </section>

            <section className="app-panel rounded-2xl p-6 lg:col-span-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">Consistency Score</h3>
                  <p className="text-white/55 text-sm">Daily commits over 90 days</p>
                </div>
                <p className="text-3xl font-bold">{data?.consistencyScore ?? 0}<span className="text-base text-white/55">/10</span></p>
              </div>
              <div className="mt-4 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={consistencyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1c2740" />
                    <XAxis dataKey="name" hide />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.05)" }}
                      contentStyle={{ background: "#0d172b", border: "1px solid #31486f", borderRadius: "10px", color: "#fff" }}
                    />
                    <Bar dataKey="value" fill="#ff7a00" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="app-panel rounded-2xl p-6 lg:col-span-5">
              <h3 className="text-lg font-semibold">Collaboration Impact</h3>
              <div className="mt-4 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={collaborationChartData} margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1c2740" />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="metric" tick={{ fill: "#9fb0cc", fontSize: 12 }} width={72} />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.05)" }}
                      contentStyle={{ background: "#0d172b", border: "1px solid #31486f", borderRadius: "10px", color: "#fff" }}
                    />
                    <Bar dataKey="value" fill="#ff7a00" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="app-panel rounded-2xl p-6 lg:col-span-8 min-h-[260px]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h3 className="text-lg font-semibold">Activity Heatmap</h3>
                <div className="flex items-center gap-1.5 text-xs text-white/60">
                  <span>Less</span>
                  <span className="h-2.5 w-2.5 rounded-[2px] heatmap-0" />
                  <span className="h-2.5 w-2.5 rounded-[2px] heatmap-1" />
                  <span className="h-2.5 w-2.5 rounded-[2px] heatmap-2" />
                  <span className="h-2.5 w-2.5 rounded-[2px] heatmap-3" />
                  <span className="h-2.5 w-2.5 rounded-[2px] heatmap-4" />
                  <span>More</span>
                </div>
              </div>
              <div className="mt-4 overflow-x-auto pb-2">
                <div className="relative w-max min-w-full rounded-xl border border-white/10 bg-[#0a1324] p-3">
                  <div className="mb-2 flex text-[10px] text-white/45">
                    {monthLabels.map((m) => (
                      <span key={`${m.label}-${m.week}`} className="w-[34px]">{m.label}</span>
                    ))}
                  </div>
                  <div className="flex gap-[4px]">
                  {(data?.heatmapWeeks ?? []).map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-[4px]">
                      {week.map((level, di) => (
                        <span key={di} className={`h-[11px] w-[11px] rounded-[2px] heatmap-${level} outline outline-1 outline-white/5`} />
                      ))}
                    </div>
                  ))}
                  {!(data?.heatmapWeeks?.length) &&
                    Array.from({ length: 112 }).map((_, i) => {
                      const level = ["bg-white/10", "bg-white/25", "bg-white/45", "bg-white/80"][i % 4];
                      return (
                        <span
                          key={i}
                          className={`h-[11px] w-[11px] rounded-[2px] outline outline-1 outline-white/5 ${i % 5 === 0 ? "bg-white/5" : level}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            <section className="app-panel rounded-2xl p-6 lg:col-span-4 min-h-[260px]">
              <h3 className="text-lg font-semibold">Language Distribution</h3>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                {(data?.languages ?? []).map((lang) => (
                  <li key={lang.name} className="flex justify-between"><span>{lang.name}</span><span>{lang.value}%</span></li>
                ))}
              </ul>
            </section>

            <section className="app-panel rounded-2xl p-6 lg:col-span-12">
              <h3 className="text-2xl font-semibold text-center">Live Automated Skill Mapping</h3>
              <div className="mt-4 flex justify-center overflow-x-auto">
                <svg viewBox="0 0 420 420" className="w-full max-w-[420px]">
                  {(() => {
                    const cx = 210;
                    const cy = 210;
                    const maxRadius = 140;
                    const rings = [35, 70, 105, 140];
                    const axisCount = skillMappingData.length;
                    const angleFor = (idx: number) => -Math.PI / 2 + (idx * (2 * Math.PI)) / axisCount;
                    const point = (idx: number, radius: number) => {
                      const a = angleFor(idx);
                      return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
                    };
                    const ringPath = (radius: number) =>
                      skillMappingData
                        .map((_, idx) => {
                          const p = point(idx, radius);
                          return `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`;
                        })
                        .join(" ") + " Z";
                    const polygonPath =
                      skillMappingData
                        .map((item, idx) => {
                          const p = point(idx, (item.score / 100) * maxRadius);
                          return `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`;
                        })
                        .join(" ") + " Z";

                    return (
                      <>
                        {rings.map((radius) => (
                          <path key={radius} d={ringPath(radius)} fill="none" stroke="#2b3c5d" strokeWidth="1.5" />
                        ))}
                        {skillMappingData.map((_, idx) => {
                          const p = point(idx, maxRadius);
                          return (
                            <line
                              key={`axis-${idx}`}
                              x1={cx}
                              y1={cy}
                              x2={p.x}
                              y2={p.y}
                              stroke="#2b3c5d"
                              strokeWidth="1.5"
                            />
                          );
                        })}
                        <path d={polygonPath} fill="rgba(255,122,0,0.18)" stroke="#ff7a00" strokeWidth="3" />
                        {skillMappingData.map((item, idx) => {
                          const valuePoint = point(idx, (item.score / 100) * maxRadius);
                          const labelPoint = point(idx, maxRadius + 28);
                          return (
                            <g key={item.skill}>
                              <circle cx={valuePoint.x} cy={valuePoint.y} r="5" fill="#ff7a00" />
                              <text
                                x={labelPoint.x}
                                y={labelPoint.y}
                                fill="#d7dce5"
                                fontSize="12"
                                fontWeight="600"
                                textAnchor="middle"
                                dominantBaseline="middle"
                              >
                                {item.skill}
                              </text>
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
              </div>
            </section>

            <section className="app-panel rounded-2xl p-6 lg:col-span-8">
              <h3 className="text-lg font-semibold">AI Developer Summary</h3>
              <p className="mt-4 text-white/70 text-sm leading-6">{data?.summary}</p>
            </section>

            <section className="app-panel rounded-2xl p-6 lg:col-span-4">
              <h3 className="text-lg font-semibold">Repo Intelligence</h3>
              <div className="mt-4 text-sm space-y-4 text-white/70">
                {(data?.repoIntelligence ?? []).map((repo) => (
                  <p key={repo.name} className="flex justify-between"><span>{repo.name}</span><span className="text-xs">IMPACT {repo.impact}</span></p>
                ))}
              </div>
            </section>

            <section className="app-panel rounded-2xl p-6 lg:col-span-12">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <h3 className="text-lg font-semibold">AI Suggestions and Job Trends</h3>
                <span className="text-xs text-white/55">Personalized from GitHub signals + job market fit</span>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-wider text-white/45">AI Suggestions</p>
                  <ul className="mt-3 space-y-2.5 text-sm text-white/75">
                    {aiSuggestions.map((tip) => (
                      <li key={tip}>- {tip}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-wider text-white/45">Trend Focus</p>
                  <ul className="mt-3 space-y-2.5 text-sm text-white/75">
                    {aiFocusAreas.map((line) => (
                      <li key={line}>- {line}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

          <section className="rounded-xl border border-[#2a2a2a] bg-[#0b0b0f] p-6 lg:col-span-12">
  <div className="flex items-center justify-between">
    <h3 className="text-lg font-semibold text-white">
      Repositories and Files
    </h3>
    <span className="rounded-xl border border-[#ff7a00]/40 bg-[#1a0f07] px-3 py-1 text-[11px] font-semibold text-[#ff9a3c]">
      {repos.length} recent repos
    </span>
  </div>

  <div className="mt-5 grid gap-5 lg:grid-cols-[360px_1fr]">
    {/* Left: Repo List */}
    <div className="rounded-xl border border-[#242424] bg-[#111114] p-3 max-h-[420px] overflow-y-auto">
      <div className="space-y-2">
        {repos.map((repo) => {
          const active = (selectedRepoData?.name ?? "") === repo.name;

          return (
            <button
              key={repo.name}
              onClick={() => setSelectedRepo(repo.name)}
              className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                active
                  ? "border-[#ff7a00] bg-[#1a0f07]"
                  : "border-[#2a2a2a] bg-[#141418] hover:border-[#ff7a00]/60"
              }`}
            >
              <p className="truncate text-sm font-semibold text-white">
                {repo.name}
              </p>
              <p className="mt-1 text-xs text-white/60">
                {repo.language} | {repo.stars} stars
              </p>

              <div className="mt-2 flex items-center gap-2">
                <span
                  className={
                    repo.isPrivate
                      ? "rounded-xl border border-[#ff7a00]/40 bg-[#1a0f07] px-2 py-0.5 text-[10px] text-[#ff9a3c]"
                      : "rounded-xl border border-[#333] bg-[#1a1a1f] px-2 py-0.5 text-[10px] text-white/70"
                  }
                >
                  {repo.isPrivate ? "Private" : "Public"}
                </span>
              </div>
            </button>
          );
        })}

        {repos.length === 0 && (
          <p className="rounded-xl border border-dashed border-[#2a2a2a] bg-[#141418] px-3 py-3 text-sm text-white/60">
            No repositories available yet.
          </p>
        )}
      </div>
    </div>

    {/* Right: File Preview */}
    <div className="rounded-xl border border-[#242424] bg-[#111114] p-4 min-h-[240px]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-white">
            {selectedRepoData?.name ?? "Select a repository"}
          </p>
          <p className="text-xs text-white/50">
            File preview from repository tree
          </p>
        </div>

        {selectedRepoData && (
          <a
            href={selectedRepoData.url}
            target="_blank"
            rel="noreferrer"
            className="h-8 rounded-xl border border-[#ff7a00] bg-[#ff7a00] px-3 text-xs font-semibold text-black flex items-center justify-center"
          >
            Open Repo
          </a>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-[#2a2a2a] bg-[#141418] p-3 max-h-[320px] overflow-y-auto">
        <div className="space-y-1.5 font-mono text-xs text-white/80">
          {(selectedRepoData?.files ?? []).map((file) => (
            <p
              key={file}
              className="truncate rounded-xl bg-[#1a1a1f] px-2 py-1 text-[#ffb067]"
            >
              {file}
            </p>
          ))}

          {selectedRepoData &&
            selectedRepoData.files.length === 0 && (
              <p className="rounded-xl border border-dashed border-[#2a2a2a] bg-[#1a1a1f] px-3 py-2 text-white/60">
                No file preview available yet. Click Refresh insights to fetch files.
              </p>
            )}

          {!selectedRepoData && (
            <p className="rounded-xl border border-dashed border-[#2a2a2a] bg-[#1a1a1f] px-3 py-2 text-white/60">
              No repositories loaded yet. Click Refresh insights.
            </p>
          )}
        </div>
      </div>
    </div>
  </div>
</section>
            <section className="app-panel rounded-2xl p-6 lg:col-span-4">
              <h3 className="text-lg font-semibold">Contribution Streak</h3>
              <p className="mt-3 text-white/55 text-sm">You are on a {data?.contributionStreak ?? 0} day contribution streak.</p>
            </section>

            <section className="app-panel rounded-2xl p-6 lg:col-span-8">
              <h3 className="text-lg font-semibold">Open Source Impact</h3>
              <ul className="mt-4 space-y-2 text-sm text-white/55">
                {(data?.openSourceImpact ?? []).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
