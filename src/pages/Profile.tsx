import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Layout/Navbar";
import { ProfileData, getProfileData, updateProfileData } from "@/lib/app-data";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

const emptyProfile: ProfileData = {
  name: "",
  headline: "",
  bio: "",
  links: [],
};

const Profile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProfileData>(emptyProfile);

  const { data } = useQuery({
    queryKey: ["profile-data", user?.uid],
    queryFn: () => getProfileData(user?.uid ?? ""),
    enabled: !!user?.uid,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      name: data?.name || user.displayName || "",
      headline: data?.headline || "",
      bio: data?.bio || "",
      links: data?.links?.length
        ? data.links
        : [
            { label: "GitHub", url: "" },
            { label: "Portfolio", url: "" },
            { label: "LinkedIn", url: "" },
          ],
    });
  }, [data, user]);

  const updateLink = (index: number, key: "label" | "url", value: string) => {
    setForm((prev) => ({
      ...prev,
      links: prev.links.map((link, i) => (i === index ? { ...link, [key]: value } : link)),
    }));
  };

  const addLink = () => {
    setForm((prev) => ({
      ...prev,
      links: [...prev.links, { label: "", url: "" }],
    }));
  };

  const removeLink = (index: number) => {
    setForm((prev) => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (!user?.uid) return;

    if (!form.name.trim()) {
      toast({ title: "Name required", description: "Please add your display name." });
      return;
    }

    setSaving(true);
    try {
      await updateProfileData(user.uid, form);
      await queryClient.invalidateQueries({ queryKey: ["profile-data", user.uid] });
      setIsEditing(false);
      toast({ title: "Profile updated", description: "Your profile changes were saved." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-bg min-h-screen text-white pb-10">
      <Navbar />
      <main className="px-4 md:px-8 pt-6">
        <div className="mx-auto max-w-[900px] app-panel rounded-2xl p-8">
          {!user ? (
            <p className="text-white/70">Sign in to view your profile and links.</p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                  <h1 className="text-4xl font-bold">{isEditing ? "Edit Profile" : form.name || "Profile"}</h1>
                  {!isEditing && <p className="mt-2 text-white/70">{form.headline || ""}</p>}
                </div>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button onClick={() => setIsEditing(false)} className="app-btn-secondary" disabled={saving}>Cancel</button>
                      <button onClick={handleSave} className="app-btn-primary" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
                    </>
                  ) : (
                    <button onClick={() => setIsEditing(true)} className="app-btn-primary">Edit Profile</button>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-white/50 mb-1">Name</p>
                      <input
                        value={form.name}
                        onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                        className="h-10 w-full rounded-xl border border-white/15 bg-black/20 px-3 text-sm outline-none"
                      />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-white/50 mb-1">Headline</p>
                      <input
                        value={form.headline}
                        onChange={(event) => setForm((prev) => ({ ...prev, headline: event.target.value }))}
                        className="h-10 w-full rounded-xl border border-white/15 bg-black/20 px-3 text-sm outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-white/50 mb-1">Bio</p>
                    <textarea
                      value={form.bio}
                      onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
                      className="min-h-24 w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs uppercase tracking-wider text-white/50">Links</p>
                      <button onClick={addLink} className="text-xs text-white/70 hover:text-white">Add link</button>
                    </div>
                    <div className="space-y-2">
                      {form.links.map((link, index) => (
                        <div key={`${index}-${link.label}`} className="grid gap-2 md:grid-cols-[140px_1fr_auto]">
                          <input
                            value={link.label}
                            onChange={(event) => updateLink(index, "label", event.target.value)}
                            placeholder="Label"
                            className="h-10 rounded-xl border border-white/15 bg-black/20 px-3 text-sm outline-none"
                          />
                          <input
                            value={link.url}
                            onChange={(event) => updateLink(index, "url", event.target.value)}
                            placeholder="https://..."
                            className="h-10 rounded-xl border border-white/15 bg-black/20 px-3 text-sm outline-none"
                          />
                          <button onClick={() => removeLink(index)} className="app-btn-secondary h-10">Remove</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mt-4 text-white/60">{form.bio || ""}</p>
                  <div className="mt-6 flex gap-3 flex-wrap">
                    {(form.links ?? [])
                      .filter((link) => link.url)
                      .map((link) => (
                        <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="app-btn-secondary">
                          {link.label}
                        </a>
                      ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;
