import { motion } from "framer-motion";
import {
  GitCommit, GitPullRequest, Star, Code2, Flame, TrendingUp,
  Calendar, Users, Award
} from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell
} from "recharts";
import GitHubHeatmap from "@/components/Landing/GitHubHeatmap";
import Navbar from "@/components/Layout/Navbar";

const stats = [
  { label: "Contributions", value: "1,247", icon: GitCommit, change: "+12%" },
  { label: "Pull Requests", value: "89", icon: GitPullRequest, change: "+8%" },
  { label: "Stars Received", value: "342", icon: Star, change: "+24%" },
  { label: "Languages", value: "7", icon: Code2, change: "" },
  { label: "Longest Streak", value: "47d", icon: Flame, change: "+5d" },
  { label: "Active Days", value: "234", icon: Calendar, change: "" },
];

const radarData = [
  { skill: "React", value: 92 },
  { skill: "TypeScript", value: 88 },
  { skill: "Node.js", value: 75 },
  { skill: "Python", value: 60 },
  { skill: "DevOps", value: 45 },
  { skill: "Testing", value: 70 },
];

const activityData = [
  { month: "Mar", commits: 45, prs: 8 },
  { month: "Apr", commits: 62, prs: 12 },
  { month: "May", commits: 38, prs: 6 },
  { month: "Jun", commits: 75, prs: 15 },
  { month: "Jul", commits: 90, prs: 18 },
  { month: "Aug", commits: 55, prs: 10 },
  { month: "Sep", commits: 82, prs: 14 },
  { month: "Oct", commits: 110, prs: 22 },
  { month: "Nov", commits: 95, prs: 19 },
  { month: "Dec", commits: 68, prs: 11 },
  { month: "Jan", commits: 105, prs: 20 },
  { month: "Feb", commits: 120, prs: 25 },
];

const langData = [
  { name: "TypeScript", value: 42, color: "hsl(24, 100%, 50%)" },
  { name: "Python", value: 22, color: "hsl(24, 100%, 65%)" },
  { name: "Go", value: 15, color: "hsl(24, 80%, 40%)" },
  { name: "Rust", value: 12, color: "hsl(0, 0%, 40%)" },
  { name: "Other", value: 9, color: "hsl(0, 0%, 25%)" },
];

const chartTooltipStyle = {
  background: "hsl(0 0% 6%)",
  border: "1px solid hsl(0 0% 13%)",
  borderRadius: "10px",
  fontSize: "12px",
  color: "hsl(0 0% 93%)",
  padding: "8px 12px",
};

const axisTickStyle = { fontSize: 11, fill: "hsl(0,0%,45%)" };

const Dashboard = () => {
  const score = 78;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-card-glow p-6 md:p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
              AK
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">Alex Kovalev</h1>
              <p className="text-muted-foreground text-sm mb-3">
                Full-stack developer · Open source contributor · 3rd year CS @ MIT
              </p>
              <div className="flex flex-wrap gap-2">
                {["React", "TypeScript", "Node.js", "Python"].map((t) => (
                  <span key={t} className="match-badge">{t}</span>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--border))" strokeWidth="5" />
                  <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--primary))" strokeWidth="5"
                    strokeDasharray={`${score * 2.136} 999`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xl font-bold">{score}</span>
              </div>
              <span className="text-xs text-muted-foreground font-medium">Score</span>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-secondary border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">AI Developer Summary</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Strong full-stack contributor with exceptional consistency. Top 15% in React ecosystem contributions.
              47-day streak demonstrates sustained commitment. High collaboration score from 89 merged PRs across
              12 repositories. Recommended seniority: <span className="text-primary font-medium">Growing Contributor</span>.
            </p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              className="stat-card"
            >
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <s.icon className="w-3.5 h-3.5" />
                <span className="text-xs">{s.label}</span>
              </div>
              <span className="text-xl font-bold">{s.value}</span>
              {s.change && (
                <span className="text-xs text-primary flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" />{s.change}
                </span>
              )}
            </motion.div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid lg:grid-cols-3 gap-5 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 clay-card p-6"
          >
            <h3 className="font-semibold mb-4 text-sm">Contribution Timeline</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="commitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(24, 100%, 50%)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="hsl(24, 100%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={axisTickStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisTickStyle} axisLine={false} tickLine={false} width={30} />
                <Tooltip contentStyle={chartTooltipStyle} cursor={{ stroke: "hsl(24,100%,50%)", strokeWidth: 1, strokeDasharray: "4 4" }} />
                <Area type="monotone" dataKey="commits" stroke="hsl(24, 100%, 50%)" fill="url(#commitGrad)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="prs" stroke="hsl(24, 100%, 65%)" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-3 h-[2px] bg-primary inline-block rounded" /> Commits</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-[2px] inline-block rounded border-t border-dashed border-primary" /> PRs</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="clay-card p-6"
          >
            <h3 className="font-semibold mb-4 text-sm">Skill Radar</h3>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="hsl(0,0%,18%)" />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fill: "hsl(0,0%,50%)" }} />
                <Radar dataKey="value" stroke="hsl(24, 100%, 50%)" fill="hsl(24, 100%, 50%)" fillOpacity={0.1} strokeWidth={1.5} />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid lg:grid-cols-3 gap-5 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 clay-card p-6"
          >
            <h3 className="font-semibold mb-4 text-sm">GitHub Activity</h3>
            <div className="overflow-x-auto pb-1">
              <GitHubHeatmap interactive />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="clay-card p-6"
          >
            <h3 className="font-semibold mb-4 text-sm">Languages</h3>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={langData} cx="50%" cy="50%" innerRadius={36} outerRadius={56}
                  dataKey="value" paddingAngle={3} strokeWidth={0}>
                  {langData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 justify-center">
              {langData.map((l) => (
                <div key={l.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                  {l.name} {l.value}%
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Consistency", value: 82, icon: Flame },
            { label: "Collaboration", value: 74, icon: Users },
            { label: "OS Impact", value: 68, icon: Star },
            { label: "Code Depth", value: 71, icon: Code2 },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              className="clay-card p-5 flex items-center gap-4"
            >
              <div className="relative w-12 h-12 flex-shrink-0">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="20" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
                  <circle cx="24" cy="24" r="20" fill="none" stroke="hsl(var(--primary))" strokeWidth="3"
                    strokeDasharray={`${s.value * 1.257} 999`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{s.value}</span>
              </div>
              <div>
                <div className="text-sm font-medium">{s.label}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <s.icon className="w-3 h-3" /> Index
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
