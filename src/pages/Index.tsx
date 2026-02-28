import { useEffect } from "react";
import { BrainCircuit, CodeXml, Target, Github } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Navbar from "@/components/Layout/Navbar";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

const landing = {
  contributionScore: 94,
  contributionCount: 1823,
  topRepoName: "hardi/talent-engine",
  topRepoStats: "214 commits - 37 PRs merged",
  topRepoTags: ["TypeScript", "Firebase", "React", "Node.js"],
  roleMatch: 91,
  roleTitle: "Full Stack Engineer Intern",
  roleMeta: "Vercel - Summer 2026",
};

const skillMappingDemo = [
  { skill: "Backend", score: 86 },
  { skill: "Frontend", score: 74 },
  { skill: "DevOps", score: 52 },
  { skill: "Cloud", score: 34 },
  { skill: "AI/ML", score: 66 },
];

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace("#", "");
    const element = document.getElementById(id);
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.hash]);

  const goProtected = (path: string) => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in with GitHub to continue." });
      return;
    }
    navigate(path);
  };

  return (
    <div className="app-bg min-h-screen text-white overflow-x-hidden">
      <Navbar />

      <section className="px-4 pt-10 pb-8 md:px-8 md:pt-14">
        <div className="mx-auto max-w-[1020px] text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-[11px] text-white/85">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff8a1f]" />
            Now matching for Summer 2025 internships
          </div>

          <h1 className="mt-8 text-[56px] leading-[0.95] tracking-tight font-extrabold text-[#d7dce5] md:text-[84px]">
            Get Hired by
            <br />
            What You Build
          </h1>

          <p className="mx-auto mt-6 max-w-[620px] text-[22px] leading-relaxed text-white/62">
            Stop tweaking resumes. OpenSourceHire analyzes your GitHub commits, PRs, and repos to match you with top engineering roles automatically.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <button onClick={() => goProtected("/dashboard")} className="h-12 inline-flex items-center rounded-full bg-[#ff8a1f] px-8 text-base font-semibold text-black">
              Analyze My GitHub
            </button>
            <button onClick={() => goProtected("/discovery")} className="h-12 inline-flex items-center rounded-full px-8 text-base font-semibold text-white transition-colors hover:bg-white/10">
              Explore Internships
            </button>
          </div>

          <div className="relative mx-auto mt-14 max-w-[980px] rounded-[28px]  px-6 py-8 md:px-12 md:py-12">
            
            {/* Left Floating Stat */}
            <div className="hidden md:block absolute -left-8 -top-10 w-[250px] rounded-3xl border border-white p-5 text-left rotate-[-4deg] shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
              <p className="text-[10px] tracking-wider text-white/50 font-semibold">CONTRIBUTION SCORE</p>
              <p className="mt-1 text-4xl font-bold leading-none text-[#ff8a1f]">{landing.contributionScore}<span className="text-xl text-white/55"> /100</span></p>
              <p className="mt-2 text-sm text-white/65">Top 5% Elite Tier Globally</p>
            </div>

            {/* Right Top Floating Stat */}
            <div className="hidden md:block absolute -right-8 top-6 w-[300px] rounded-3xl border border-white   p-5 text-left rotate-[6deg] shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
              <p className="text-lg font-semibold text-white">{landing.topRepoName}</p>
              <p className="text-sm text-white/60">{landing.topRepoStats}</p>
              <div className="mt-3 flex gap-2 text-xs flex-wrap">
                {landing.topRepoTags.map((tag) => (
                  <span key={tag} className="rounded-full border border-white/25 bg-white/5 px-3 py-1 text-white/80">{tag}</span>
                ))}
              </div>
            </div>

            {/* Right Bottom Floating Stat */}
            <div className="hidden md:block absolute -right-2 -bottom-10 w-[340px] rounded-3xl border border-white  p-5 text-left shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
              <div className="flex items-center gap-3">
                <span className="h-14 w-14 rounded-full border-[4px] border-[#ff8a1f] bg-[#040b1f] flex items-center justify-center text-sm font-bold text-white shadow-[0_0_15px_rgba(255,138,31,0.3)]">{landing.roleMatch}%</span>
                <div>
                  <p className="text-xl font-semibold leading-tight text-white">{landing.roleTitle}</p>
                  <p className="text-sm text-white/60 mt-0.5">{landing.roleMeta}</p>
                </div>
              </div>
            </div>

            {/* Authentic GitHub Heatmap Section */}
            <div className="mx-auto w-full max-w-[760px] rounded-2xl border border-[#30363d] bg-[#0d1117] p-5 shadow-2xl">
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-left">
                  <div className="h-10 w-10 rounded-full border border-[#30363d] bg-gradient-to-br from-[#232830] to-[#161b22] flex items-center justify-center overflow-hidden">
                    <Github className="h-6 w-6 text-white/80" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#c9d1d9]">@developer</p>
                    <p className="text-xs text-[#8b949e]">{new Intl.NumberFormat("en-US").format(landing.contributionCount)} contributions in the last year</p>
                  </div>
                </div>
                <div className="text-xs text-[#8b949e] border border-[#30363d] rounded-xl px-3 py-1.5 bg-[#161b22]">
                  2024
                </div>
              </div>

              {/* Heatmap Grid */}
              <div className="overflow-x-auto pb-2 custom-scrollbar">
                <div className="flex gap-[3px] min-w-max pt-2">
                  {Array.from({ length: 52 }).map((_, weekIdx) => (
                    <div key={weekIdx} className="flex flex-col gap-[3px]">
                      {Array.from({ length: 7 }).map((_, dayIdx) => {
                        const isActive = Math.random() > 0.35;
                        const intensity = isActive ? Math.floor(Math.random() * 4) + 1 : 0;
                        const colors = [
                          'bg-[#161b22]', // 0
                          'bg-[#0e4429]', // 1
                          'bg-[#006d32]', // 2
                          'bg-[#26a641]', // 3
                          'bg-[#39d353]'  // 4
                        ];
                        return (
                          <div 
                            key={dayIdx} 
                            className={`w-[11px] h-[11px] rounded-[2px] ${colors[intensity]} outline outline-1 outline-white/5`} 
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Heatmap Footer Legend */}
              <div className="mt-3 flex justify-between items-center text-[11px] text-[#8b949e]">
                <a href="#" className="hover:text-[#58a6ff] hover:underline transition-colors">Learn how we count contributions</a>
                <div className="flex items-center gap-1.5">
                  <span>Less</span>
                  <div className="flex gap-[3px] mx-1">
                    <div className="w-[11px] h-[11px] rounded-[2px] bg-[#161b22] outline outline-1 outline-white/5" />
                    <div className="w-[11px] h-[11px] rounded-[2px] bg-[#0e4429] outline outline-1 outline-white/5" />
                    <div className="w-[11px] h-[11px] rounded-[2px] bg-[#006d32] outline outline-1 outline-white/5" />
                    <div className="w-[11px] h-[11px] rounded-[2px] bg-[#26a641] outline outline-1 outline-white/5" />
                    <div className="w-[11px] h-[11px] rounded-[2px] bg-[#39d353] outline outline-1 outline-white/5" />
                  </div>
                  <span>More</span>
                </div>
              </div>
            </div>

            {/* Mobile Fallback Stats */}
            <div className="mt-6 grid gap-3 md:hidden">
              <div className="rounded-xl p-4 text-left">
                <p className="text-[10px] tracking-wider text-white/50">CONTRIBUTION SCORE</p>
                <p className="mt-1 text-2xl font-bold text-[#ff8a1f]">{landing.contributionScore}<span className="text-xs text-white/60"> /100</span></p>
              </div>
              <div className="rounded-xl p-4 text-left">
                <p className="text-sm font-semibold">{landing.topRepoName}</p>
                <p className="text-[11px] text-white/55">{landing.topRepoStats}</p>
                <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
                  {landing.topRepoTags.map((tag) => (
                    <span key={tag} className="rounded-full px-2.5 py-1">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="rounded-xl p-4 text-left">
                <p className="text-sm font-semibold">{landing.roleTitle}</p>
                <p className="text-[11px] text-white/55">{landing.roleMeta}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-black/70 mt-14 px-4 py-24 md:px-8">
        <div className="mx-auto max-w-[1020px]">
          <h2 className="text-center text-[48px] md:text-[54px] leading-tight font-bold">How GitHub Intelligence Works</h2>
          <p className="mx-auto mt-5 max-w-[680px] text-center text-white/60 text-lg">
            We translate your actual engineering work into verified technical skills that hiring managers trust implicitly.
          </p>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Deep Code Analysis",
                desc: "We look beyond superficial star counts. Our AI reads your code to understand architecture, completion, and coding standards.",
                icon: CodeXml,
              },
              {
                title: "Collaboration Metrics",
                desc: "PRs submitted, code reviews completed, and issue resolutions are tracked to prove you excel in a team-based engineering environment.",
                icon: BrainCircuit,
              },
              {
                title: "Precision Job Matching",
                desc: "We map your exact technical skills and contribution history directly to the explicit requirements of open positions at top tech companies.",
                icon: Target,
              },
            ].map((item) => (
              <article key={item.title} className="rounded-2xl p-8">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center">
                  <item.icon className="h-6 w-6 text-[#ff8a1f]" />
                </div>
                <h3 className="mt-6 text-[24px] md:text-[28px] leading-tight font-semibold">{item.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-white/65">{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 md:px-8">
        <div className="mx-auto max-w-[1020px] grid gap-8 md:grid-cols-2 p-7 md:p-12 items-center">
          <div className="rounded-2xl p-6 md:p-8 min-h-[300px]">
            <h4 className="text-center text-[38px] leading-tight font-bold">Live Automated Skill Mapping</h4>
            <div className="mt-4 flex justify-center">
             <svg viewBox="0 0 420 420" className="w-full max-w-[420px]">
  {(() => {
    const cx = 210;
    const cy = 210;

    const maxRadius = 140;        // reduced from 200
    const rings = [35, 70, 105, 140];

    const axisCount = skillMappingDemo.length;
    const angleFor = (idx: number) =>
      -Math.PI / 2 + (idx * (2 * Math.PI)) / axisCount;

    const point = (idx: number, radius: number) => {
      const a = angleFor(idx);
      return {
        x: cx + radius * Math.cos(a),
        y: cy + radius * Math.sin(a),
      };
    };

    const ringPath = (radius: number) =>
      skillMappingDemo
        .map((_, idx) => {
          const p = point(idx, radius);
          return `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`;
        })
        .join(" ") + " Z";

    const polygonPath =
      skillMappingDemo
        .map((item, idx) => {
          const p = point(idx, (item.score / 100) * maxRadius);
          return `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`;
        })
        .join(" ") + " Z";

    return (
      <>
        {/* Rings */}
        {rings.map((radius) => (
          <path
            key={radius}
            d={ringPath(radius)}
            fill="none"
            stroke="#2b3c5d"
            strokeWidth="1.5"
          />
        ))}

        {/* Axes */}
        {skillMappingDemo.map((_, idx) => {
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

        {/* Skill Polygon */}
        <path
          d={polygonPath}
          fill="rgba(255,122,0,0.18)"
          stroke="#ff7a00"
          strokeWidth="3"
        />

        {/* Points + Labels */}
        {skillMappingDemo.map((item, idx) => {
          const valuePoint = point(
            idx,
            (item.score / 100) * maxRadius
          );
          const labelPoint = point(idx, maxRadius + 28);

          return (
            <g key={item.skill}>
              <circle
                cx={valuePoint.x}
                cy={valuePoint.y}
                r="5"
                fill="#ff7a00"
              />
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
          </div>
          <div className="pl-0 md:pl-6">
            <h3 className="text-[40px] md:text-[48px] leading-tight font-bold">Automated Skill Verification</h3>
            <p className="mt-5 text-lg leading-relaxed text-white/65">
              No more self-reporting skills on a resume. Our engine measures your actual proficiency based on the complexity of your merged code, generating an undeniable technical profile.
            </p>
            <div className="mt-8 space-y-6 text-base text-white/70">
              <p><span className="font-semibold text-white block mb-1">Eliminate the Bias</span>Let your code speak for itself. Stand out through verifiable capabilities instead of pedigrees.</p>
              <p><span className="font-semibold text-white block mb-1">Real-time Progression</span>As you push code and learn new stacks, your profile automatically updates to unlock new role matches.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="internships" className="px-4 py-20 md:px-8 bg-black/30">
        <div className="mx-auto max-w-[1020px] grid gap-12 md:grid-cols-2 items-center">
          <div>
            <h3 className="text-[40px] md:text-[48px] leading-tight font-bold">Intelligent Role Discovery</h3>
            <p className="mt-5 text-lg text-white/65 leading-relaxed">
              No more resume black holes. We compare your open-source impact directly with the technical requirements of top engineering teams, delivering roles where you already prove you can do the work.
            </p>
            <button className="mt-8 h-12 rounded-xl px-8 text-sm font-semibold hover:bg-white/10 transition-colors">
              View Sample Matches
            </button>
          </div>

          <div className="rounded-2xl p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-4">
                <span className="h-12 w-12 rounded-xl flex items-center justify-center">
                  <Github className="h-6 w-6 text-white" />
                </span>
                <div>
                  <p className="font-semibold text-lg text-white">Software Engineer Intern</p>
                  <p className="text-sm text-white/55 mt-0.5">GitHub - San Francisco, CA (Remote)</p>
                </div>
              </div>
              <span className="rounded-full bg-[#ff8a1f]/10 px-3 py-1 text-xs font-semibold text-[#ff8a1f]">
                91% Match
              </span>
            </div>

            <div className="mt-6 rounded-xl p-5">
              <p className="text-[10px] tracking-wider text-white/45 font-semibold">WHY YOU MATCH</p>
              <p className="mt-2 text-sm text-white/70 leading-relaxed">
                You have 58 contributions across open-source repositories, reviewed 12 pull requests, and actively maintain two production-ready React libraries with consistent commit history.
              </p>
            </div>
            <button className="mt-5 h-12 w-full rounded-xl bg-[#ff8a1f] text-sm font-bold text-black">
              1-Click Apply with GitHub Profile
            </button>
          </div>
        </div>
      </section>

      <section id="for-companies" className="px-4 py-20 md:px-8">
        <div className="mx-auto max-w-[1020px] p-10 md:p-16 text-center">
          <h3 className="text-[36px] md:text-[42px] leading-tight font-bold">For Companies</h3>
          <p className="mx-auto mt-5 max-w-[600px] text-white/70 text-lg leading-relaxed">
            Source engineering candidates using verified contribution data and collaboration history from GitHub-backed profiles. Stop guessing, start hiring based on real code.
          </p>
          <Link to="/for-companies" className="mt-8 inline-flex h-12 items-center rounded-full bg-[#ff8a1f] px-9 text-base font-bold text-black">
            Hire with OpenSourceHire
          </Link>
        </div>
      </section>

      <section className="px-4 pt-12 pb-20 md:px-8">
        <div className="mx-auto max-w-[1020px] pt-20 text-center">
          <h3 className="text-[52px] md:text-[68px] leading-[1.05] font-extrabold tracking-tight">
            Stop Grinding LeetCode.<br />
            <span className="text-[#ff8a1f]">Start Building.</span>
          </h3>
          <p className="mx-auto mt-6 max-w-[680px] text-lg text-white/65 leading-relaxed">
            Join thousands of students and developers landing premium internships by showcasing their real-world open-source contributions.
          </p>
          <button className="mt-10 h-14 rounded-full bg-white px-10 text-lg font-bold text-black">
            Create Developer Profile
          </button>
        </div>
      </section>

      <footer className="px-4 py-12 md:px-8">
        <div className="mx-auto max-w-[1020px] text-center text-sm text-white/50">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 font-medium mb-8">
            <button onClick={() => goProtected("/dashboard")} className="hover:text-white transition-colors">Platform</button>
            <Link to="/for-companies" className="hover:text-white transition-colors">For Companies</Link>
            <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
          </div>
          <p className="text-xs text-white/40">© 2025 OpenSourceHire. Built for elite developers.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
