import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { AgeVerification } from "./components/AgeVerification";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import CreatorPage from "./pages/CreatorPage";
import Feed from "./pages/Feed";
import Discover from "./pages/Discover";
import MyPage from "./pages/MyPage";
import PostDetail from "./pages/PostDetail";
import CreatePost from "./pages/CreatePost";
import EditPost from "./pages/EditPost";
import ManagePosts from "./pages/ManagePosts";
import ManagePlans from "./pages/ManagePlans";
import TipPage from "./pages/TipPage";
import Ranking from "./pages/Ranking";
import Dashboard from "./pages/Dashboard";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import PointPurchase from "./pages/PointPurchase";
import BecomeCreator from "./pages/BecomeCreator";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/feed"} component={Feed} />
      <Route path={"/discover"} component={Discover} />
      <Route path={"/my"} component={MyPage} />
      <Route path={"/creator/:username"} component={CreatorPage} />
      <Route path={"/tip/:username"} component={TipPage} />
      <Route path={"/post/:id"} component={PostDetail} />
      <Route path={"/create-post"} component={CreatePost} />
      <Route path={"/edit-post/:id"} component={EditPost} />
      <Route path={"/manage-posts"} component={ManagePosts} />
      <Route path={"/manage-plans"} component={ManagePlans} />
      <Route path={"/ranking"} component={Ranking} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/points"} component={PointPurchase} />
      <Route path={"/become-creator"} component={BecomeCreator} />
      <Route path={"/terms"} component={Terms} />
      <Route path={"/privacy"} component={Privacy} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <AgeVerification>
            <Router />
          </AgeVerification>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
