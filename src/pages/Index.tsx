import { Github, ArrowRight, Zap, BarChart3, Target, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import GitHubHeatmap from "@/components/Landing/GitHubHeatmap";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const features = [
  {
    icon: BarChart3,
    title: "GitHub Intelligence",
    desc: "Deep analysis of commits, PRs, reviews, issues, and contribution patterns across 12 months.",
  },
  {
    icon: Target,
    title: "AI Job Matching",
    desc: "Every opportunity ranked by your actual code contributions, not keyword-stuffed resumes.",
  },
  {
    icon: Zap,
    title: "Contribution Score",
    desc: "0-100 score measuring consistency, collaboration, open-source impact, and code depth.",
  },
  {
    icon: Users,
    title: "Anonymous Mode",
    desc: "Share your metrics without revealing identity. Unmask only when you choose to apply.",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden gradient-bg-hero">
        {/* Floating orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl animate-float" />
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-primary/3 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        </div>

        <div className="container mx-auto px-4 pt-24 pb-16 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/50 bg-muted/50 text-sm text-muted-foreground mb-8"
            >
              <Zap className="w-3.5 h-3.5 text-primary" />
              AI-Powered Developer Intelligence
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6"
            >
              Get Hired by{" "}
              <span className="text-gradient-orange">What You Build</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
            >
              OpenSourceHire evaluates developers through GitHub contributions, 
              not resumes. Your code is your credential.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            >
              <Button size="lg" className="rounded-xl gap-2 text-base px-8 h-12 orange-glow" asChild>
                <Link to="/dashboard">
                  <Github className="w-5 h-5" />
                  Analyze My GitHub
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="rounded-xl gap-2 text-base px-8 h-12" asChild>
                <Link to="/jobs">
                  Browse Opportunities
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </motion.div>

            {/* Heatmap preview */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
              className="glass-card-glow p-6 md:p-8 max-w-3xl mx-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">
                  Contribution Activity — Last 12 Months
                </span>
                <span className="text-xs font-mono text-primary">1,247 contributions</span>
              </div>
              <div className="overflow-x-auto">
                <GitHubHeatmap interactive />
              </div>
              <div className="flex items-center gap-2 mt-4 justify-end">
                <span className="text-xs text-muted-foreground">Less</span>
                {[0, 1, 2, 3, 4].map((l) => (
                  <div key={l} className={`w-[11px] h-[11px] rounded-sm heatmap-${l}`} />
                ))}
                <span className="text-xs text-muted-foreground">More</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="section-heading mb-4">
              Your Code Speaks <span className="text-gradient-orange">Louder</span>
            </h2>
            <p className="section-subheading mx-auto">
              We analyze your entire GitHub footprint to build a verifiable developer profile.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
                className="clay-card p-6 group hover:border-primary/20 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 md:py-32 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="section-heading mb-4">How It Works</h2>
            <p className="section-subheading mx-auto">Three steps to your proof-of-work profile.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Connect GitHub", desc: "One-click OAuth. We fetch your last 12 months of contributions." },
              { step: "02", title: "AI Analyzes", desc: "Contribution score, skill map, specialization, and seniority estimation." },
              { step: "03", title: "Get Matched", desc: "Personalized job feed ranked by your actual code, not keywords." },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                className="text-center"
              >
                <div className="text-5xl font-black text-primary/20 font-mono mb-3">{s.step}</div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32 border-t border-border/50">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card-glow max-w-2xl mx-auto p-12"
          >
            <h2 className="text-3xl font-bold mb-4">
              Ready to let your <span className="text-gradient-orange">code</span> do the talking?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join developers who got hired through their GitHub contributions.
            </p>
            <Button size="lg" className="rounded-xl gap-2 px-8 h-12 orange-glow" asChild>
              <Link to="/dashboard">
                <Github className="w-5 h-5" />
                Start Your Analysis
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© 2026 OpenSourceHire. Built for builders.</span>
          <div className="flex items-center gap-6">
            <Link to="/" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/" className="hover:text-foreground transition-colors">Terms</Link>
            <a href="https://github.com" className="hover:text-foreground transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
