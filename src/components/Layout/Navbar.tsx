import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Github, Menu, X, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(true);
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/jobs", label: "Jobs" },
    { to: "/profile", label: "Profile" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled ? "nav-glass" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between h-14 px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Github className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-base font-bold tracking-tight">
            OpenSource<span className="text-gradient-orange">Hire</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-0.5">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-1.5 text-sm transition-colors rounded-lg ${
                location.pathname === link.to
                  ? "text-foreground bg-secondary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDark(!dark)}
            className="rounded-lg w-8 h-8"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Button className="hidden md:inline-flex rounded-lg gap-2 h-8 text-xs px-3" size="sm">
            <Github className="w-3.5 h-3.5" />
            Sign in with GitHub
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-lg w-8 h-8"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden nav-glass border-t border-border">
          <div className="container mx-auto px-4 py-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 text-sm transition-colors rounded-lg ${
                  location.pathname === link.to
                    ? "text-foreground bg-secondary"
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Button className="rounded-lg gap-2 mt-2 h-9 text-xs" size="sm">
              <Github className="w-3.5 h-3.5" />
              Sign in with GitHub
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
