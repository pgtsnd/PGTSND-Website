import { Switch, Route, Router as WouterRouter } from "wouter";
import Header from "@/components/Header";
import Home from "@/pages/Home";
import Services from "@/pages/Services";
import About from "@/pages/About";
import CaseStudies from "@/pages/CaseStudies";
import Contact from "@/pages/Contact";
import NotFound from "@/pages/not-found";

function Router() {
  return (
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
  );
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Router />
    </WouterRouter>
  );
}

export default App;
