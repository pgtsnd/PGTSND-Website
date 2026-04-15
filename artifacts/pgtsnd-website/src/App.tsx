import { Switch, Route, Router as WouterRouter } from "wouter";
import { ThemeProvider } from "@/components/ThemeContext";
import Header from "@/components/Header";
import Home from "@/pages/Home";
import Services from "@/pages/Services";
import About from "@/pages/About";
import CaseStudies from "@/pages/CaseStudies";
import Contact from "@/pages/Contact";
import ClientHub from "@/pages/ClientHub";
import ClientDashboard from "@/pages/ClientDashboard";
import ClientProjects from "@/pages/ClientProjects";
import ClientAssets from "@/pages/ClientAssets";
import ClientVideoReview from "@/pages/ClientVideoReview";
import ClientBilling from "@/pages/ClientBilling";
import ClientAccount from "@/pages/ClientAccount";
import ClientMessages from "@/pages/ClientMessages";
import ClientContracts from "@/pages/ClientContracts";
import ProjectTreatment from "@/pages/ProjectTreatment";
import ProjectStoryboard from "@/pages/ProjectStoryboard";
import ProjectShotList from "@/pages/ProjectShotList";
import ProjectNotes from "@/pages/ProjectNotes";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/client-hub/dashboard" component={ClientDashboard} />
      <Route path="/client-hub/messages" component={ClientMessages} />
      <Route path="/client-hub/projects/:id/treatment" component={ProjectTreatment} />
      <Route path="/client-hub/projects/:id/storyboard" component={ProjectStoryboard} />
      <Route path="/client-hub/projects/:id/shotlist" component={ProjectShotList} />
      <Route path="/client-hub/projects/:id/notes" component={ProjectNotes} />
      <Route path="/client-hub/projects" component={ClientProjects} />
      <Route path="/client-hub/assets" component={ClientAssets} />
      <Route path="/client-hub/review" component={ClientVideoReview} />
      <Route path="/client-hub/contracts" component={ClientContracts} />
      <Route path="/client-hub/billing" component={ClientBilling} />
      <Route path="/client-hub/account" component={ClientAccount} />
      <Route path="/client-hub" component={ClientHub} />
      <Route>
        {() => (
          <>
            <Header />
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/services" component={Services} />
              <Route path="/about" component={About} />
              <Route path="/case-studies" component={CaseStudies} />
              <Route path="/contact" component={Contact} />
              <Route component={NotFound} />
            </Switch>
          </>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <ThemeProvider>
        <Router />
      </ThemeProvider>
    </WouterRouter>
  );
}

export default App;
