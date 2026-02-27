import { motion } from "framer-motion";
import {
  GitCommit, GitPullRequest, Star, Code2, Flame, TrendingUp,
  Calendar, Users, Award
} from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import GitHubHeatmap from "@/components/Landing/GitHubHeatmap";
import Navbar from "@/components/Layout/Navbar";

const stats = [
  { label: "Contributions", value: "1,247", icon: GitCommit, change: "+12%" },
  { label: "Pull Requests", value: "89", icon: GitPullRequest, change: "+8%" },
  { label: "Stars Received", value: "342", icon: Star, change: "+24%" },
  { label: "Languages", value: "7", icon: Code2, change: "" },
  { label: "Longest Streak", value: "47 days", icon: Flame, change: "+5d" },
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
  { name: "Rust", value: 12, color: "hsl(0, 0%, 45%)" },
  { name: "Other", value: 9, color: "hsl(0, 0%, 30%)" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const },
  }),
};

const Dashboard = () => {
  const score = 78;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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
                  <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                  <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--primary))" strokeWidth="6"
                    strokeDasharray={`${score * 2.136} 999`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xl font-bold">{score}</span>
              </div>
              <span className="text-xs text-muted-foreground font-medium">Contribution Score</span>
            </div>
          </div>

          {/* AI Summary */}
          <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border/30">
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              custom={i}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="stat-card"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
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

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Activity Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 clay-card p-6"
          >
            <h3 className="font-semibold mb-4">Contribution Timeline</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="commitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(24, 100%, 50%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(24, 100%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(0,0%,55%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(0,0%,55%)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(0,0%,7%)",
                    border: "1px solid hsl(0,0%,16%)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Area type="monotone" dataKey="commits" stroke="hsl(24, 100%, 50%)" fill="url(#commitGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Skill Radar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="clay-card p-6"
          >
            <h3 className="font-semibold mb-4">Skill Radar</h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(0,0%,20%)" />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: "hsl(0,0%,55%)" }} />
                <Radar dataKey="value" stroke="hsl(24, 100%, 50%)" fill="hsl(24, 100%, 50%)" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Heatmap */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2 clay-card p-6"
          >
            <h3 className="font-semibold mb-4">GitHub Activity Heatmap</h3>
            <div className="overflow-x-auto">
              <GitHubHeatmap interactive />
            </div>
          </motion.div>

          {/* Language Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="clay-card p-6"
          >
            <h3 className="font-semibold mb-4">Languages</h3>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={langData} cx="50%" cy="50%" innerRadius={40} outerRadius={60}
                  dataKey="value" paddingAngle={3} strokeWidth={0}>
                  {langData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
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
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { label: "Consistency Index", value: 82, icon: Flame },
            { label: "Collaboration", value: 74, icon: Users },
            { label: "Open Source Impact", value: 68, icon: Star },
            { label: "Code Depth", value: 71, icon: Code2 },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeUp}
              className="clay-card p-5 flex items-center gap-4"
            >
              <div className="relative w-12 h-12 flex-shrink-0">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="20" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
                  <circle cx="24" cy="24" r="20" fill="none" stroke="hsl(var(--primary))" strokeWidth="4"
                    strokeDasharray={`${s.value * 1.257} 999`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{s.value}</span>
              </div>
              <div>
                <div className="text-sm font-medium">{s.label}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <s.icon className="w-3 h-3" />
                  Score
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
