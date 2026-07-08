import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Trophy, BookOpen, PlusCircle, Activity, ListChecks, Medal, BarChart2, LineChart, Moon, Sun, ArrowUp } from "lucide-react";

const DASHBOARD_SHORTCUTS = [
  { label: "📊 Stats", anchor: "stats" },
  { label: "🎯 Goals", anchor: "goals" },
  { label: "📈 Form", anchor: "form" },
  { label: "🏅 Badges", anchor: "badges" },
  { label: "🕐 Timeline", anchor: "timeline" },
  { label: "🗂 Matches", anchor: "recent" },
];

function DashboardShortcuts() {
  const scrollTo = (anchor: string) => {
    const el = document.getElementById(anchor);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="w-full border-b bg-background/80 backdrop-blur">
      <div className="container max-w-5xl mx-auto px-4">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-2">
          {DASHBOARD_SHORTCUTS.map((s) => (
            <button
              key={s.anchor}
              onClick={() => scrollTo(s.anchor)}
              className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-card hover:bg-accent hover:border-primary/30 hover:text-primary transition-all whitespace-nowrap"
            >
              {s.label}
            </button>
          ))}
          <Link
            href="/analysis"
            className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 transition-all whitespace-nowrap"
          >
            🔍 Analysis →
          </Link>
          <Link
            href="/seasons"
            className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-card hover:bg-accent transition-all whitespace-nowrap"
          >
            📅 Seasons →
          </Link>
        </div>
      </div>
    </div>
  );
}

function DarkModeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("cricvault-dark-mode");
    if (saved !== null) return saved === "true";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("cricvault-dark-mode", String(dark));
  }, [dark]);

  return (
    <button
      onClick={() => setDark((d) => !d)}
      className="ml-2 flex-shrink-0 p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const viewportHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;
      const distanceFromBottom = fullHeight - (scrollTop + viewportHeight);
      setVisible(distanceFromBottom < 150 && fullHeight > viewportHeight * 1.5);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center h-11 w-11 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all animate-in fade-in slide-in-from-bottom-2"
      title="Back to top"
      aria-label="Back to top"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const isDashboard = location === "/";

  const navItems = [
    { href: "/", label: "Dashboard", icon: Activity, exact: true },
    { href: "/matches", label: "Matches", icon: ListChecks, exact: false },
    { href: "/seasons", label: "Seasons", icon: BarChart2, exact: false },
    { href: "/analysis", label: "Analysis", icon: LineChart, exact: false },
    { href: "/achievements", label: "Badges", icon: Medal, exact: false },
    { href: "/coaching", label: "Coaching", icon: BookOpen, exact: false },
    { href: "/matches/new", label: "Log Match", icon: PlusCircle, exact: true },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur">
        <div className="container flex h-16 items-center px-4 max-w-5xl mx-auto">
          <Link href="/" className="flex items-center gap-2 font-bold text-primary mr-6">
            <Trophy className="h-6 w-6" />
            <span className="hidden sm:inline-block">CricVault</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm font-medium flex-1 overflow-x-auto scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location === item.href
                : location === item.href || location.startsWith(item.href + "/");
              const isLog = item.href === "/matches/new";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                    isLog
                      ? isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary/10 text-primary hover:bg-primary/20"
                      : isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden sm:inline-block">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <DarkModeToggle />
        </div>
      </header>

      {isDashboard && <DashboardShortcuts />}

      <main className="flex-1 container max-w-5xl mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="w-full border-t py-4">
        <div className="container max-w-5xl mx-auto px-4 flex items-center justify-center">
          <Link
            href="/privacy"
            className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            Privacy Policy
          </Link>
        </div>
      </footer>

      {isDashboard && <BackToTopButton />}
    </div>
  );
}
