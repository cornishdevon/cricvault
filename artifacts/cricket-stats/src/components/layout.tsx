import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Trophy, BookOpen, PlusCircle, Activity } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: Activity },
    { href: "/matches/new", label: "New Match", icon: PlusCircle },
    { href: "/coaching", label: "Coaching", icon: BookOpen },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur">
        <div className="container flex h-16 items-center px-4 max-w-5xl mx-auto">
          <Link href="/" className="flex items-center gap-2 font-bold text-primary mr-8">
            <Trophy className="h-6 w-6" />
            <span className="hidden sm:inline-block">CricVault</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 transition-colors hover:text-primary ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
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
