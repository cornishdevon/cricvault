import { ReactNode, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Trophy, BookOpen, PlusCircle, Activity, ListChecks, Medal, BarChart2, LineChart, Moon, Sun, ArrowUp, Sparkles, Palette } from "lucide-react";

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

// ── Colour utilities ──────────────────────────────────────────────────────────

function hexToHue(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  let h = 0;
  switch (max) {
    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
    case g: h = (b - r) / d + 2; break;
    case b: h = (r - g) / d + 4; break;
  }
  return Math.round((h / 6) * 360);
}

function applyAccent(hex: string) {
  const h = hexToHue(hex);
  const isDark = document.documentElement.classList.contains("dark");
  const root = document.documentElement;

  if (isDark) {
    root.style.setProperty("--background",                  `${h} 20% 9%`);
    root.style.setProperty("--border",                      `${h} 18% 20%`);
    root.style.setProperty("--card",                        `${h} 20% 11%`);
    root.style.setProperty("--card-border",                 `${h} 18% 20%`);
    root.style.setProperty("--popover",                     `${h} 20% 11%`);
    root.style.setProperty("--popover-border",              `${h} 18% 20%`);
    root.style.setProperty("--primary",                     `${h} 45% 48%`);
    root.style.setProperty("--primary-foreground",          `${h} 25% 8%`);
    root.style.setProperty("--muted",                       `${h} 18% 18%`);
    root.style.setProperty("--input",                       `${h} 18% 20%`);
    root.style.setProperty("--ring",                        `${h} 45% 48%`);
    root.style.setProperty("--chart-1",                     `${h} 45% 48%`);
    root.style.setProperty("--sidebar",                     `${h} 25% 8%`);
    root.style.setProperty("--sidebar-border",              `${h} 20% 16%`);
    root.style.setProperty("--sidebar-primary",             `${h} 45% 48%`);
    root.style.setProperty("--sidebar-primary-foreground",  `${h} 25% 8%`);
    root.style.setProperty("--sidebar-accent",              `${h} 18% 18%`);
    root.style.setProperty("--sidebar-ring",                `${h} 45% 48%`);
  } else {
    root.style.setProperty("--primary",                     `${h} 52% 28%`);
    root.style.setProperty("--ring",                        `${h} 52% 28%`);
    root.style.setProperty("--chart-1",                     `${h} 52% 28%`);
    root.style.setProperty("--sidebar",                     `${h} 30% 20%`);
    root.style.setProperty("--sidebar-border",              `${h} 25% 28%`);
    root.style.setProperty("--sidebar-primary",             `${h} 55% 55%`);
    root.style.setProperty("--sidebar-primary-foreground",  `${h} 30% 10%`);
    root.style.setProperty("--sidebar-accent",              `${h} 25% 28%`);
    root.style.setProperty("--sidebar-ring",                `${h} 55% 55%`);
  }
}

const ACCENT_KEY = "cricvault-accent";
const DEFAULT_ACCENT = "#1b5e2b";

// ── Colour Picker ─────────────────────────────────────────────────────────────

function ColourPicker() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hex, setHex] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_ACCENT;
    return localStorage.getItem(ACCENT_KEY) || DEFAULT_ACCENT;
  });

  useEffect(() => {
    applyAccent(hex);
  }, [hex]);

  const handleChange = (newHex: string) => {
    setHex(newHex);
    localStorage.setItem(ACCENT_KEY, newHex);
    applyAccent(newHex);
  };

  return (
    <div className="relative ml-1 flex-shrink-0">
      <button
        onClick={() => inputRef.current?.click()}
        className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center gap-1.5"
        title="Choose accent colour"
        aria-label="Choose accent colour"
      >
        <Palette className="h-4 w-4" />
        <span
          className="w-3.5 h-3.5 rounded-full border border-white/30 shadow-sm flex-shrink-0"
          style={{ backgroundColor: hex }}
        />
      </button>
      <input
        ref={inputRef}
        type="color"
        value={hex}
        onChange={(e) => handleChange(e.target.value)}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}

// ── Dark Mode Toggle ──────────────────────────────────────────────────────────

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
    const savedAccent = localStorage.getItem(ACCENT_KEY);
    if (savedAccent) applyAccent(savedAccent);
  }, [dark]);

  return (
    <button
      onClick={() => setDark((d) => !d)}
      className="ml-1 flex-shrink-0 p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
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
      setVisible(scrollTop > 300);
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
    { href: "/upgrade", label: "Pro", icon: Sparkles, exact: false },
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
              const isPro = item.href === "/upgrade";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                    isPro
                      ? isActive
                        ? "bg-amber-500 text-white"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                      : isLog
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
          <ColourPicker />
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
          <span className="mx-2 text-muted-foreground/40">·</span>
          <Link
            href="/upgrade"
            className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 underline-offset-4 hover:underline"
          >
            Upgrade to Pro
          </Link>
        </div>
      </footer>

      {isDashboard && <BackToTopButton />}
    </div>
  );
}
