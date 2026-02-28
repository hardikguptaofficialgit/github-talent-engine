import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Navbar from "@/components/Layout/Navbar";
import { ApplicationItem, getApplicationsData, updateApplicationStatus } from "@/lib/app-data";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

const laneOrder: ApplicationItem["status"][] = ["Saved", "Applied", "Interview", "Offer"];

// Simple inline SVGs for a polished UI without adding external dependencies
const Icons = {
  Location: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  ChevronLeft: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6"/>
    </svg>
  ),
};

const Applications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: applications = [] } = useQuery({
    queryKey: ["applications-data", user?.uid],
    queryFn: () => getApplicationsData(user?.uid ?? ""),
    enabled: !!user?.uid,
    staleTime: 1000 * 60,
  });

  const grouped = useMemo(() => {
    return laneOrder.map((status) => ({
      status,
      items: applications.filter((app) => app.status === status),
    }));
  }, [applications]);

  const moveStatus = async (applicationId: string, currentStatus: ApplicationItem["status"], direction: "next" | "prev") => {
    if (!user?.uid) return;

    const currentIndex = laneOrder.indexOf(currentStatus);
    const targetIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex < 0 || targetIndex >= laneOrder.length) return;

    await updateApplicationStatus(user.uid, applicationId, laneOrder[targetIndex]);
    await queryClient.invalidateQueries({ queryKey: ["applications-data", user.uid] });
    toast({ title: "Application updated", description: `Moved to ${laneOrder[targetIndex]}.` });
  };

  const summary = {
    total: applications.length,
    active: applications.filter((app) => app.status !== "Offer").length,
    offers: applications.filter((app) => app.status === "Offer").length,
    interviews: applications.filter((app) => app.status === "Interview").length,
  };

  return (
    <div className="app-bg min-h-screen text-white pb-10">
      <Navbar />

      <main className="px-4 md:px-8 pt-6">
        <div className="mx-auto max-w-[1240px]">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Application Tracker</h1>
              <p className="text-white/55 mt-2 text-sm md:text-base">
                Track saved and applied roles, then move opportunities through each stage.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Link to="/discovery" className="app-btn-primary shadow-lg shadow-white/5">
                Find More Jobs
              </Link>
            </div>
          </div>

          {!user ? (
            <div className="app-panel flex items-center justify-center rounded-2xl p-12 text-white/70 border border-white/5">
              <p className="text-lg">Sign in to manage and track your applications.</p>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <section className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-8">
                {[
                  { label: "Total Applications", value: summary.total },
                  { label: "Active Pipeline", value: summary.active },
                  { label: "Interviews", value: summary.interviews },
                  { label: "Offers", value: summary.offers },
                ].map((stat) => (
                  <div key={stat.label} className="app-panel flex flex-col justify-center rounded-2xl p-5 border border-white/5 transition-colors hover:bg-white/[0.03]">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-white/50">{stat.label}</p>
                    <p className="mt-1.5 text-3xl font-bold tracking-tight">{stat.value}</p>
                  </div>
                ))}
              </section>

              {/* Kanban Board */}
              <section className="grid lg:grid-cols-4 gap-6">
                {grouped.map((lane) => (
                  <div key={lane.status} className="app-panel flex flex-col rounded-3xl p-5 min-h-[600px] border border-white/5 bg-black/20">
                    {/* Lane Header */}
                    <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold tracking-wide">{lane.status}</h2>
                        <span className="h-6 min-w-6 rounded-full bg-white/10 px-2 flex items-center justify-center text-[11px] font-medium text-white/80">
                          {lane.items.length}
                        </span>
                      </div>
                    </div>

                    {/* Lane Items */}
                    <div className="flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar">
                      {lane.items.map((item) => {
                        const statusIndex = laneOrder.indexOf(item.status);

                        return (
                          <article 
                            key={item.id} 
                            className="group relative flex flex-col rounded-2xl border border-white/10 bg-[#090d17] p-5 shadow-sm transition-all hover:border-white/20 hover:shadow-md"
                          >
                            {/* Card Header: Company & Match */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <h3 className="text-base font-bold text-white/95 leading-tight">{item.company}</h3>
                                <div className="flex items-center gap-1 text-[11px] text-white/50 mt-1.5">
                                  <Icons.Location />
                                  <span>{item.location}</span>
                                </div>
                              </div>
                              <span className="shrink-0 rounded-xl border border-[#ff7a00]/30 bg-[#2a1406] px-2 py-1 text-[10px] font-bold text-[#ff9b3d] shadow-sm">
                                {item.match}% Match
                              </span>
                            </div>

                            {/* Role Title */}
                            <p className="text-lg font-semibold mt-4 text-white leading-snug">
                              {item.role}
                            </p>

                            {/* Applicant Info Block (If exists) */}
                            {(item.applicantName || item.applicantEmail) && (
                              <div className="mt-4 flex items-center gap-3 rounded-xl bg-white/[0.04] p-3 border border-white/5">
                                <div className="h-9 w-9 shrink-0 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/80">
                                  {item.applicantName ? item.applicantName.charAt(0).toUpperCase() : "U"}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  {item.applicantName && <span className="text-sm font-medium text-white/90 truncate">{item.applicantName}</span>}
                                  {item.applicantEmail && <span className="text-[11px] text-white/50 truncate">{item.applicantEmail}</span>}
                                </div>
                              </div>
                            )}

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 mt-4">
                              {item.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="app-chip text-[10px] px-2 py-1 rounded-xl bg-white/5 border border-white/10 text-white/70">
                                  {tag}
                                </span>
                              ))}
                              {item.tags.length > 3 && (
                                <span className="text-[10px] px-2 py-1 text-white/40 flex items-center">
                                  +{item.tags.length - 3}
                                </span>
                              )}
                            </div>

                            {/* Footer & Actions */}
                            <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                              <span className="text-[11px] font-medium text-white/40">{item.foot}</span>
                              
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => moveStatus(item.id, item.status, "prev")}
                                  disabled={statusIndex === 0}
                                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-white/5 disabled:cursor-not-allowed"
                                  title="Move Back"
                                >
                                  <Icons.ChevronLeft />
                                </button>
                                <button
                                  onClick={() => moveStatus(item.id, item.status, "next")}
                                  disabled={statusIndex === laneOrder.length - 1}
                                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-30 disabled:hover:bg-white/10 disabled:cursor-not-allowed"
                                  title="Move Forward"
                                >
                                  <Icons.ChevronRight />
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      })}

                      {lane.items.length === 0 && (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-transparent p-8 text-center">
                          <p className="text-sm text-white/40 font-medium">No roles here yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Applications;