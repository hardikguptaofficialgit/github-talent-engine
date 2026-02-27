import Navbar from "@/components/Layout/Navbar";
import { motion } from "framer-motion";
import { Github, ExternalLink, GitFork, Star, Eye } from "lucide-react";
import GitHubHeatmap from "@/components/Landing/GitHubHeatmap";

const repos = [
  { name: "react-query-devtools", desc: "Custom DevTools extension for React Query with real-time cache inspection.", stars: 128, forks: 23, lang: "TypeScript", updated: "2 days ago" },
  { name: "git-streak-cli", desc: "CLI tool to visualize your GitHub contribution streaks.", stars: 89, forks: 12, lang: "Go", updated: "1 week ago" },
  { name: "markdown-ai", desc: "AI-powered markdown editor with intelligent suggestions.", stars: 64, forks: 8, lang: "TypeScript", updated: "3 weeks ago" },
  { name: "oss-tracker", desc: "Track your open-source contributions and generate reports.", stars: 42, forks: 6, lang: "Python", updated: "1 month ago" },
];

const Profile = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card-glow p-8 mb-8 text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary mx-auto mb-4">
            AK
          </div>
          <h1 className="text-2xl font-bold mb-1">Alex Kovalev</h1>
          <p className="text-muted-foreground text-sm mb-4">@alexkovalev · Full-Stack Developer · MIT '27</p>
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <span><strong className="text-foreground">1,247</strong> contributions</span>
            <span><strong className="text-foreground">89</strong> PRs merged</span>
            <span><strong className="text-foreground">342</strong> stars</span>
          </div>
        </motion.div>

        {/* Heatmap */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="clay-card p-6 mb-8">
          <h3 className="font-semibold mb-4">Activity</h3>
          <div className="overflow-x-auto">
            <GitHubHeatmap interactive />
          </div>
        </motion.div>

        {/* Repos */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 className="font-semibold mb-4 text-lg">Top Repositories</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {repos.map((repo) => (
              <div key={repo.name} className="clay-card p-5 group hover:border-primary/20 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-sm flex items-center gap-1.5">
                    <Github className="w-3.5 h-3.5 text-primary" />
                    {repo.name}
                  </h4>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{repo.desc}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="match-badge">{repo.lang}</span>
                  <span className="flex items-center gap-1"><Star className="w-3 h-3" />{repo.stars}</span>
                  <span className="flex items-center gap-1"><GitFork className="w-3 h-3" />{repo.forks}</span>
                  <span className="ml-auto flex items-center gap-1"><Eye className="w-3 h-3" />{repo.updated}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Profile;
