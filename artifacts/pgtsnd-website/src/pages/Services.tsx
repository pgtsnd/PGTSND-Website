import CTAButton from "../components/CTAButton";
import ScrollBadge from "../components/ScrollBadge";
import Footer from "../components/Footer";

const services = [
  {
    title: "Video Production",
    description:
      "From concept to final cut, we manage every aspect of your video project. Whether you're documenting a day on the water, a harvest in the field, or a build on the floor — we capture it with precision and care.",
    image:
      "https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/e243522b-de50-4eb9-ae36-3c618ea6ae5d/2024_BRI_DWYER-02064.jpg",
  },
  {
    title: "Brand Films",
    description:
      "We build the kind of films that make people stop and watch. Story-driven, industry-specific, and built to last — brand films that make your audience feel what you do, not just understand it.",
    image:
      `${import.meta.env.BASE_URL}images/bri-and-team-at-camera-pgtsnd-productions.jpeg`,
  },
  {
    title: "Photography",
    description:
      "Still images that speak volumes. We shoot in the field, on the water, and in the studio to give you a library of authentic, high-quality visuals you can use across all your platforms.",
    image:
      `${import.meta.env.BASE_URL}images/catch-close-pgtsnd-bri-dwyer.jpeg`,
  },
  {
    title: "Aerial / Drone",
    description:
      "Sweeping aerials that give scale and context to your environment and operations. We hold our FAA Part 107 certification and fly in complex coastal and remote conditions.",
    image:
      "https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/b7737613-01e6-491f-bb56-a3e38eb70d5f/boats-inlet-pgtsnd-bri-dwyer.jpeg",
  },
];

export default function Services() {
  return (
    <div style={{ background: "#000000", minHeight: "100vh" }}>
      {/* Hero */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "120px 32px 100px",
          maxWidth: "1400px",
          margin: "0 auto",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "40px",
          }}
        >
          <div style={{ maxWidth: "640px" }}>
            <h1
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 900,
                fontSize: "clamp(56px, 8vw, 84px)",
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
                lineHeight: 0.9,
                color: "#ffffff",
                marginBottom: "32px",
              }}
            >
              What We Do
            </h1>
            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 400,
                fontSize: "16px",
                color: "rgba(255,255,255,0.85)",
                lineHeight: 1.7,
                maxWidth: "480px",
              }}
            >
              PGTSND Productions is a full-service media company specializing in visual assets and messaging for industries that work. We're not here to define who you are. We're here to sharpen it, bring it into focus, and give you the tools to show it with confidence.
            </p>
          </div>
          <CTAButton href="/contact" label="Work With Us" />
        </div>

        <ScrollBadge position="bottom-right" />
      </section>

      {/* Image Hero */}
      <section style={{ padding: "0", overflow: "hidden" }}>
        <img
          src="https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/ef5a6e91-5e5f-4a5f-80da-b09b16076688/net-hands-close-pgtsnd-bri-dwyer.jpeg"
          alt="A person wearing an orange raincoat and gloves repairing a blue fishing net outdoors."
          style={{ width: "100%", height: "60vh", objectFit: "cover", display: "block" }}
        />
      </section>

      {/* Services List */}
      <section style={{ padding: "80px 32px", maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {services.map((service, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "60px",
                alignItems: "center",
                padding: "80px 0",
                borderTop: "1px solid rgba(255,255,255,0.1)",
                direction: i % 2 !== 0 ? "rtl" : "ltr",
              }}
            >
              <div style={{ direction: "ltr" }}>
                <span
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 900,
                    fontSize: "80px",
                    color: "rgba(255,255,255,0.08)",
                    lineHeight: 1,
                    display: "block",
                    marginBottom: "-20px",
                  }}
                >
                  0{i + 1}
                </span>
                <h3
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 900,
                    fontSize: "clamp(28px, 4vw, 40px)",
                    textTransform: "uppercase",
                    letterSpacing: "-0.02em",
                    color: "#ffffff",
                    marginBottom: "20px",
                    position: "relative",
                  }}
                >
                  {service.title}
                </h3>
                <p
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 400,
                    fontSize: "16px",
                    color: "rgba(255,255,255,0.7)",
                    lineHeight: 1.7,
                    maxWidth: "420px",
                  }}
                >
                  {service.description}
                </p>
              </div>
              <div style={{ direction: "ltr", overflow: "hidden", borderRadius: "4px" }}>
                <img
                  src={service.image}
                  alt={service.title}
                  style={{
                    width: "100%",
                    height: "400px",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
