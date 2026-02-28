import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import logo from "../../../public/logo.png";
import { Github, ChevronDown } from "lucide-react";

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
  
  // Dropdown states
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  
  // Refs for handling outside clicks
  const profileRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const links = user ? dashboardLinks : guestLinks;

  const isActiveLink = (to: string) => {
    if (!to.includes("#")) {
      return location.pathname === to;
    }

    const [path, hash] = to.split("#");
    const expectedPath = path || "/";
    return location.pathname === expectedPath && location.hash === `#${hash}`;
  };

  const handleLogin = async () => {
    try {
      const loggedInUser = await login();
      if (!loggedInUser) {
        toast({
          title: "Sign-in is unavailable",
          description: "Please check your app configuration and try again.",
        });
      }
    } catch {
      toast({
        title: "Sign-in failed",
        description: "Please grant GitHub permissions and try again.",
      });
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
        toast({
          title: "Demo unavailable",
          description: "Please try again in a few seconds.",
        });
      }
    } catch {
      toast({
        title: "Demo sign-in failed",
        description: "Please try again.",
      });
    }
  };

  return (
    <header className="pt-6 px-4 md:px-8">
      <div className="mx-auto max-w-[1100px] min-h-14 rounded-full app-panel px-4 py-2 md:px-6 flex items-center justify-between gap-3 relative">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-white shrink-0">
          <img
            src={logo}
            alt="OpenSourceHire"
            className="h-6 w-6 object-contain"
          />
          <span>OpenSourceHire</span>
        </Link>

        {/* Main Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          {links.map((link) => {
            const active = isActiveLink(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                  active ? "bg-white/12 text-white" : "text-white/60 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {/* "More" Dropdown for logged-in users to access guest links */}
          {user && (
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-full text-white/60 hover:text-white transition-colors"
              >
                More <ChevronDown className={`h-3 w-3 transition-transform ${isMoreMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {isMoreMenuOpen && (
                <div className="absolute top-full right-0 mt-3 w-40 bg-zinc-900 border border-white/10 rounded-xl shadow-lg py-1 flex flex-col z-50 overflow-hidden">
                  {guestLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setIsMoreMenuOpen(false)}
                      className="px-4 py-2.5 text-xs text-white/70 hover:bg-white/10 hover:text-white text-left transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Right Side / Auth */}
        <div className="flex items-center gap-2">
          {loading ? (
            <span className="text-xs text-white/60">Loading...</span>
          ) : user ? (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="h-8 w-8 rounded-full bg-white text-black flex items-center justify-center text-xs font-bold overflow-hidden ring-2 ring-transparent hover:ring-white/30 transition-all focus:outline-none cursor-pointer"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName ?? "User"} className="h-full w-full object-cover" />
                ) : (
                  <span>{(user.displayName?.[0] ?? user.email?.[0] ?? "U").toUpperCase()}</span>
                )}
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-3 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-lg py-1 flex flex-col z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-xs font-semibold text-white truncate">
                      {user.displayName || "User"}
                    </p>
                    <p className="text-[10px] text-white/50 truncate mt-0.5">
                      {user.email}
                    </p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="px-4 py-2.5 text-xs text-white/80 hover:bg-white/10 hover:text-white text-left transition-colors"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/dashboard"
                    onClick={() => setIsProfileOpen(false)}
                    className="px-4 py-2.5 text-xs text-white/80 hover:bg-white/10 hover:text-white text-left transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/applications"
                    onClick={() => setIsProfileOpen(false)}
                    className="px-4 py-2.5 text-xs text-white/80 hover:bg-white/10 hover:text-white text-left transition-colors"
                  >
                    Applications
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2.5 text-xs text-red-400 hover:bg-white/10 text-left w-full transition-colors font-medium border-t border-white/10 mt-1"
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
                className="h-9 rounded-full border border-white/20 bg-white/5 px-4 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Try Demo
              </button>
              <button
                onClick={handleLogin}
                className="h-9 rounded-full bg-[#ff7a00] px-4 text-xs font-semibold text-black flex items-center justify-center gap-2 hover:bg-[#ff7a00]/90 transition-colors"
              >
                <span>Sign in with</span> <Github className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
