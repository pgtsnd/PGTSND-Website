import Header from "../components/Header";
import Footer from "../components/Footer";

export default function ClientHub() {
  return (
    <div style={{ background: "#000000", minHeight: "100vh" }}>
      <Header />

      <section
        style={{
          paddingTop: "180px",
          padding: "180px 80px 120px",
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        <p
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 700,
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: "rgba(255,255,255,0.5)",
            marginBottom: "28px",
          }}
        >
          Client Hub
        </p>
        <h1
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 900,
            fontSize: "clamp(36px, 5vw, 64px)",
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
            lineHeight: 0.95,
            color: "#ffffff",
            marginBottom: "40px",
          }}
        >
          Welcome Back
        </h1>
        <p
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 400,
            fontSize: "18px",
            color: "rgba(255,255,255,0.7)",
            lineHeight: 1.75,
            maxWidth: "600px",
          }}
        >
          Access your project files, review deliverables, and stay connected with your PGTSND production team.
        </p>
      </section>

      <Footer />
    </div>
  );
}
