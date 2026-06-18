import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Trophy, BookOpen, PlusCircle, Activity, ListChecks, Medal } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: Activity, exact: true },
    { href: "/matches", label: "Matches", icon: ListChecks, exact: false },
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
        </div>
      </header>
      <main className="flex-1 container max-w-5xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
