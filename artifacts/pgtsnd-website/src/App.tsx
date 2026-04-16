import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { ThemeProvider } from "@/components/ThemeContext";
import { ToastProvider } from "@/components/Toast";
import { AuthProvider } from "@/lib/auth";
import { TeamAuthProvider } from "@/contexts/TeamAuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
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
import TeamCrew from "@/pages/TeamCrew";
import TeamSettings from "@/pages/TeamSettings";
import AuthVerify from "@/pages/AuthVerify";
import CaseStudyDetail from "@/pages/case-studies/CaseStudyDetail";
import AlaskaBeringSeaCrabbers from "@/pages/case-studies/AlaskaBeringSeaCrabbers";
import GreenJuju from "@/pages/case-studies/GreenJuju";
import NWSablefish from "@/pages/case-studies/NWSablefish";
import AlaskaWhitefishTrawlers from "@/pages/case-studies/AlaskaWhitefishTrawlers";
import Lodge58North from "@/pages/case-studies/Lodge58North";
import NetYourProblem from "@/pages/case-studies/NetYourProblem";
import VallationOuterwear from "@/pages/case-studies/VallationOuterwear";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import SharedReview from "@/pages/SharedReview";
import NotFound from "@/pages/not-found";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

const TEAM_ROLES = ["owner", "partner", "crew"];
const OWNER_ROLES = ["owner", "partner"];

function Router() {
  return (
    <Switch>
      <Route path="/auth/verify" component={AuthVerify} />
      <Route path="/review/:token" component={SharedReview} />

      <Route path="/client-hub/dashboard">
        {() => (
          <ProtectedRoute redirectTo="/client-hub">
            <ClientDashboard />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/client-hub/messages">
        {() => (
          <ProtectedRoute redirectTo="/client-hub">
            <ClientMessages />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/client-hub/projects/:id/treatment">
        {() => (
          <ProtectedRoute redirectTo="/client-hub">
            <ProjectTreatment />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/client-hub/projects/:id/storyboard">
        {() => (
          <ProtectedRoute redirectTo="/client-hub">
            <ProjectStoryboard />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/client-hub/projects/:id/shotlist">
        {() => (
          <ProtectedRoute redirectTo="/client-hub">
            <ProjectShotList />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/client-hub/projects/:id/notes">
        {() => (
          <ProtectedRoute redirectTo="/client-hub">
            <ProjectNotes />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/client-hub/projects">
        {() => (
          <ProtectedRoute redirectTo="/client-hub">
            <ClientProjects />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/client-hub/assets">
        {() => (
          <ProtectedRoute redirectTo="/client-hub">
            <ClientAssets />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/client-hub/review">
        {() => (
          <ProtectedRoute redirectTo="/client-hub">
            <ClientVideoReview />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/client-hub/contracts">
        {() => (
          <ProtectedRoute redirectTo="/client-hub">
            <ClientContracts />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/client-hub/billing">
        {() => (
          <ProtectedRoute redirectTo="/client-hub">
            <ClientBilling />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/client-hub/account">
        {() => (
          <ProtectedRoute redirectTo="/client-hub">
            <ClientAccount />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/client-hub" component={ClientHub} />

      <Route path="/team/dashboard">
        {() => (
          <ProtectedRoute allowedRoles={TEAM_ROLES} redirectTo="/team">
            <TeamDashboard />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/team/projects/:id">
        {() => (
          <ProtectedRoute allowedRoles={TEAM_ROLES} redirectTo="/team">
            <TeamProjectDetail />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/team/projects">
        {() => (
          <ProtectedRoute allowedRoles={TEAM_ROLES} redirectTo="/team">
            <TeamProjects />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/team/messages">
        {() => (
          <ProtectedRoute allowedRoles={TEAM_ROLES} redirectTo="/team">
            <TeamMessages />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/team/schedule">
        {() => (
          <ProtectedRoute allowedRoles={TEAM_ROLES} redirectTo="/team">
            <TeamSchedule />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/team/crew">
        {() => (
          <ProtectedRoute allowedRoles={OWNER_ROLES} redirectTo="/team/dashboard">
            <TeamCrew />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/team/clients">
        {() => (
          <ProtectedRoute allowedRoles={OWNER_ROLES} redirectTo="/team/dashboard">
            <TeamClients />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/team/settings">
        {() => (
          <ProtectedRoute allowedRoles={OWNER_ROLES} redirectTo="/team/dashboard">
            <TeamSettings />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/team" component={TeamLogin} />

      <Route path="/case-studies/alaska-bering-sea-crabbers" component={AlaskaBeringSeaCrabbers} />
      <Route path="/case-studies/green-juju" component={GreenJuju} />
      <Route path="/case-studies/nw-sablefish" component={NWSablefish} />
      <Route path="/case-studies/alaska-whitefish-trawlers" component={AlaskaWhitefishTrawlers} />
      <Route path="/case-studies/lodge-58-north" component={Lodge58North} />
      <Route path="/case-studies/net-your-problem" component={NetYourProblem} />
      <Route path="/case-studies/vallation-outerwear" component={VallationOuterwear} />
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
        <ToastProvider>
          <AuthProvider>
            <TeamAuthProvider>
              <ScrollToTop />
              <Router />
            </TeamAuthProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </WouterRouter>
  );
}

export default App;
