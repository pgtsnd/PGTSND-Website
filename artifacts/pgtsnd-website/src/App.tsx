import { Switch, Route, Router as WouterRouter } from "wouter";
import Header from "@/components/Header";
import Home from "@/pages/Home";
import Services from "@/pages/Services";
import About from "@/pages/About";
import CaseStudies from "@/pages/CaseStudies";
import Contact from "@/pages/Contact";

function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000000",
        color: "#ffffff",
        fontFamily: "'Montserrat', sans-serif",
        textAlign: "center",
        padding: "32px",
      }}
    >
      <div>
        <h1
          style={{
            fontWeight: 900,
            fontSize: "clamp(80px, 15vw, 180px)",
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
            lineHeight: 0.9,
            color: "rgba(255,255,255,0.1)",
            marginBottom: "16px",
          }}
        >
          404
        </h1>
        <p
          style={{
            fontWeight: 700,
            fontSize: "20px",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "32px",
          }}
        >
          Page not found
        </p>
        <a
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "16px",
            background: "#000000",
            border: "2px solid #ffffff",
            borderRadius: "999px",
            padding: "12px 28px 12px 14px",
            color: "#ffffff",
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 700,
            fontSize: "13px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            cursor: "pointer",
            textDecoration: "none",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "#ffffff",
              color: "#000000",
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </span>
          Back to Home
        </a>
      </div>
    </div>
  );
}

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
