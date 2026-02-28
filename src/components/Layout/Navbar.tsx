import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import logo from "../../../public/logo.png";
import { Github, ChevronDown, Menu, X } from "lucide-react";

const guestLinks = [
  { to: "/#how-it-works", label: "How it works" },
  { to: "/#for-companies", label: "For Companies" },
];

const dashboardLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/discovery", label: "Discovery" },
  { to: "/applications", label: "Applications" },
];

const Navbar = () => {
  const location = useLocation();
  const { user, loading, login, loginDemo, signOutUser } = useAuth();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const links = user ? dashboardLinks : guestLinks;

  const isActiveLink = (to: string) => {
    if (!to.includes("#")) return location.pathname === to;
    const [path, hash] = to.split("#");
    const expectedPath = path || "/";
    return location.pathname === expectedPath && location.hash === `#${hash}`;
  };

  const handleLogin = async () => {
    try {
      const loggedInUser = await login();
      if (!loggedInUser) {
        toast({ title: "Sign-in unavailable", description: "Check configuration." });
      }
    } catch {
      toast({ title: "Sign-in failed", description: "Grant GitHub permissions." });
    }
  };

  const handleSignOut = async () => {
    setIsProfileOpen(false);
    await signOutUser();
  };

  const handleDemoLogin = async () => {
    try {
      const demoUser = await loginDemo();
      if (!demoUser) {
        toast({ title: "Demo unavailable", description: "Try again." });
      }
    } catch {
      toast({ title: "Demo failed", description: "Try again." });
    }
  };

  return (
    <header className="px-4 md:px-8 pt-5">
      <div className="mx-auto max-w-[1100px] rounded-xl border border-white/10 bg-[#0f0f13] px-4 py-3 flex items-center justify-between relative">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-white">
          <img src={logo} alt="OpenSourceHire" className="h-6 w-6 object-contain" />
          <span className="hidden sm:block">OpenSourceHire</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-2">
          {links.map((link) => {
            const active = isActiveLink(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 text-xs rounded-xl transition ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {loading ? (
            <span className="text-xs text-white/50">Loading</span>
          ) : user ? (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="h-8 w-8 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center overflow-hidden"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="h-full w-full object-cover" />
                ) : (
                  (user.displayName?.[0] ?? "U").toUpperCase()
                )}
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-3 w-48 bg-[#111114] border border-white/10 rounded-xl shadow-xl py-1 flex flex-col z-50">
                  <Link to="/profile" onClick={() => setIsProfileOpen(false)} className="px-4 py-2 text-xs text-white/80 hover:bg-white/10">
                    Profile
                  </Link>
                  <Link to="/dashboard" onClick={() => setIsProfileOpen(false)} className="px-4 py-2 text-xs text-white/80 hover:bg-white/10">
                    Dashboard
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2 text-xs text-red-400 hover:bg-white/10 text-left border-t border-white/10 mt-1"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={handleDemoLogin}
                className="hidden sm:inline-flex h-9 rounded-xl border border-white/15 bg-white/5 px-4 text-xs font-semibold text-white hover:bg-white/10 transition"
              >
                Try Demo
              </button>
              <button
                onClick={handleLogin}
                className="hidden sm:flex h-9 rounded-xl bg-[#ff7a00] px-4 text-xs font-semibold text-black items-center gap-2 hover:opacity-90 transition"
              >
                <Github className="h-4 w-4" />
                Sign in
              </button>
            </>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden h-9 w-9 rounded-xl border border-white/15 bg-white/5 flex items-center justify-center text-white"
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-3 rounded-xl border border-white/10 bg-[#0f0f13] p-4 space-y-3">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm text-white/80 hover:bg-white/10"
            >
              {link.label}
            </Link>
          ))}

          {!user && (
            <div className="flex flex-col gap-2 pt-3 border-t border-white/10">
              <button
                onClick={handleDemoLogin}
                className="h-9 rounded-xl border border-white/15 bg-white/5 text-xs font-semibold text-white"
              >
                Try Demo
              </button>
              <button
                onClick={handleLogin}
                className="h-9 rounded-xl bg-[#ff7a00] text-xs font-semibold text-black flex items-center justify-center gap-2"
              >
                <Github className="h-4 w-4" />
                Sign in with GitHub
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;