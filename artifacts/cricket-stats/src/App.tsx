import { Layout } from "./components/layout";
import Dashboard from "./pages/dashboard";
import NewMatch from "./pages/new-match";
import Matches from "./pages/matches";
import MatchDetail from "./pages/match-detail";
import MatchReport from "./pages/match-report";
import SeasonReport from "./pages/season-report";
import Coaching from "./pages/coaching";
import AchievementsPage from "./pages/achievements";
import SeasonsPage from "./pages/seasons";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/matches/new" component={NewMatch} />
      <Route path="/matches/:matchId/report" component={MatchReport} />
      <Route path="/matches/:matchId" component={MatchDetail} />
      <Route path="/matches" component={Matches} />
      <Route path="/achievements" component={AchievementsPage} />
      <Route path="/season-report" component={SeasonReport} />
      <Route path="/coaching" component={Coaching} />
      <Route path="/seasons" component={SeasonsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Layout>
            <Router />
          </Layout>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
