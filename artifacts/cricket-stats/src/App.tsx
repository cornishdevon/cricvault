import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import {
  Switch,
  Route,
  Redirect,
  useLocation,
  Router as WouterRouter,
} from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";

import { Layout } from "./components/layout";
import Dashboard from "./pages/dashboard";
import Landing from "./pages/landing";
import NewMatch from "./pages/new-match";
import Matches from "./pages/matches";
import MatchDetail from "./pages/match-detail";
import MatchReport from "./pages/match-report";
import SeasonReport from "./pages/season-report";
import Coaching from "./pages/coaching";
import AchievementsPage from "./pages/achievements";
import SeasonsPage from "./pages/seasons";
import AnalysisPage from "./pages/analysis";
import PrivacyPolicy from "./pages/privacy";
import Support from "./pages/support";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

// REQUIRED — copy verbatim. Resolves the key from window.location.hostname so the
// same build serves multiple Clerk custom domains.
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

// REQUIRED — empty in dev (Clerk hits dev FAPI directly), auto-set in prod.
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(148 52% 28%)",
    colorForeground: "hsl(150 12% 15%)",
    colorMutedForeground: "hsl(150 8% 42%)",
    colorDanger: "hsl(0 72% 45%)",
    colorBackground: "hsl(0 0% 100%)",
    colorInput: "hsl(0 0% 100%)",
    colorInputForeground: "hsl(150 12% 15%)",
    colorNeutral: "hsl(150 10% 30%)",
    fontFamily: "var(--app-font-sans, Inter, sans-serif)",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-lg border border-border",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-foreground font-bold",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-foreground font-medium",
    footerActionLink: "text-primary font-semibold hover:underline",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground",
    identityPreviewEditButton: "text-primary",
    formFieldSuccessText: "text-primary",
    alertText: "text-foreground",
    logoBox: "justify-center",
    logoImage: "h-10 w-10 rounded-xl",
    socialButtonsBlockButton: "border border-border bg-white hover:bg-accent",
    formButtonPrimary: "bg-primary hover:opacity-90 text-white font-semibold",
    formFieldInput: "border border-input bg-white",
    footerAction: "justify-center",
    dividerLine: "bg-border",
    alert: "border border-border rounded-lg",
    otpCodeFieldInput: "border border-input",
    formFieldRow: "gap-2",
    main: "gap-5",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function HomePage() {
  return (
    <>
      <Show when="signed-in">
        <Layout>
          <Dashboard />
        </Layout>
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

function Protected({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Show when="signed-in">
        <Layout>{children}</Layout>
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      {/* REQUIRED — the /*? optional wildcard matches both the bare URL and
          Clerk's OAuth sub-paths. Do not change. */}
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/privacy">
        <Layout><PrivacyPolicy /></Layout>
      </Route>
      <Route path="/support">
        <Layout><Support /></Layout>
      </Route>
      <Route path="/matches/new"><Protected><NewMatch /></Protected></Route>
      <Route path="/matches/:matchId/report"><Protected><MatchReport /></Protected></Route>
      <Route path="/matches/:matchId"><Protected><MatchDetail /></Protected></Route>
      <Route path="/matches"><Protected><Matches /></Protected></Route>
      <Route path="/achievements"><Protected><AchievementsPage /></Protected></Route>
      <Route path="/season-report"><Protected><SeasonReport /></Protected></Route>
      <Route path="/coaching"><Protected><Coaching /></Protected></Route>
      <Route path="/seasons"><Protected><SeasonsPage /></Protected></Route>
      <Route path="/analysis"><Protected><AnalysisPage /></Protected></Route>
      <Route>
        <Layout><NotFound /></Layout>
      </Route>
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to your cricket career",
          },
        },
        signUp: {
          start: {
            title: "Create your CricVault account",
            subtitle: "Start tracking every innings",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
