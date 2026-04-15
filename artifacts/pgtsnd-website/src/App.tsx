import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
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
import TeamLogin from "@/pages/TeamLogin";
import TeamDashboard from "@/pages/TeamDashboard";
import TeamProjects from "@/pages/TeamProjects";
import TeamProjectDetail from "@/pages/TeamProjectDetail";
import TeamClients from "@/pages/TeamClients";
import TeamMessages from "@/pages/TeamMessages";
import TeamSchedule from "@/pages/TeamSchedule";
import TeamAssets from "@/pages/TeamAssets";
import TeamCrew from "@/pages/TeamCrew";
import TeamSettings from "@/pages/TeamSettings";
import CaseStudyDetail from "@/pages/case-studies/CaseStudyDetail";
import AlaskaBeringSeaCrabbers from "@/pages/case-studies/AlaskaBeringSeaCrabbers";
import GreenJuju from "@/pages/case-studies/GreenJuju";
import NWSablefish from "@/pages/case-studies/NWSablefish";
import AlaskaWhitefishTrawlers from "@/pages/case-studies/AlaskaWhitefishTrawlers";
import Lodge58North from "@/pages/case-studies/Lodge58North";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import NotFound from "@/pages/not-found";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

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
      <Route path="/team/dashboard" component={TeamDashboard} />
      <Route path="/team/projects/:id" component={TeamProjectDetail} />
      <Route path="/team/projects" component={TeamProjects} />
      <Route path="/team/clients" component={TeamClients} />
      <Route path="/team/messages" component={TeamMessages} />
      <Route path="/team/schedule" component={TeamSchedule} />
      <Route path="/team/assets" component={TeamAssets} />
      <Route path="/team/crew" component={TeamCrew} />
      <Route path="/team/settings" component={TeamSettings} />
      <Route path="/team" component={TeamLogin} />
      <Route path="/case-studies/alaska-bering-sea-crabbers" component={AlaskaBeringSeaCrabbers} />
      <Route path="/case-studies/green-juju" component={GreenJuju} />
      <Route path="/case-studies/nw-sablefish" component={NWSablefish} />
      <Route path="/case-studies/alaska-whitefish-trawlers" component={AlaskaWhitefishTrawlers} />
      <Route path="/case-studies/lodge-58-north" component={Lodge58North} />
      <Route>
        {() => (
          <>
            <Header />
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/services" component={Services} />
              <Route path="/about" component={About} />
              <Route path="/case-studies/:slug" component={CaseStudyDetail} />
              <Route path="/case-studies" component={CaseStudies} />
              <Route path="/contact" component={Contact} />
              <Route path="/privacy-policy" component={PrivacyPolicy} />
              <Route path="/terms" component={TermsOfService} />
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
        <ScrollToTop />
        <Router />
      </ThemeProvider>
    </WouterRouter>
  );
}

export default App;
