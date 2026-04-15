import ClientLayout from "../components/ClientLayout";

const activeProjects = [
  {
    name: "Spring Campaign Film",
    status: "In Review",
    phase: "Post-Production",
    progress: 75,
    dueDate: "May 15, 2025",
  },
  {
    name: "Product Launch Teaser",
    status: "Filming",
    phase: "Production",
    progress: 40,
    dueDate: "June 2, 2025",
  },
];

const recentActivity = [
  { text: "New draft uploaded: Spring Campaign v3", time: "2 hours ago", type: "draft" },
  { text: "Comment from Bri on Product Launch storyboard", time: "5 hours ago", type: "comment" },
  { text: "Invoice #1042 paid — $4,500.00", time: "1 day ago", type: "payment" },
  { text: "Spring Campaign v2 approved", time: "3 days ago", type: "approval" },
  { text: "New assets uploaded to Spring Campaign", time: "4 days ago", type: "upload" },
];

const offerings = [
  { name: "Brand Documentary", range: "$8,000 – $25,000", available: false },
  { name: "Social Media Package", range: "$2,500 – $6,000", available: false },
  { name: "Aerial / Drone Coverage", range: "$1,500 – $4,000", available: false },
  { name: "Photography Package", range: "$1,200 – $3,500", available: false },
];

export default function ClientDashboard() {
  return (
    <ClientLayout>
      <div style={{ padding: "48px 56px" }}>
        <div style={{ marginBottom: "48px" }}>
          <p
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 400,
              fontSize: "14px",
              color: "rgba(255,255,255,0.4)",
              marginBottom: "8px",
            }}
          >
            Welcome back,
          </p>
          <h1
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 900,
              fontSize: "32px",
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              color: "#ffffff",
            }}
          >
            Nicole
          </h1>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "48px" }}>
          {activeProjects.map((project) => (
            <div
              key={project.name}
              style={{
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                padding: "28px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                <div>
                  <h3
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontWeight: 700,
                      fontSize: "16px",
                      color: "#ffffff",
                      marginBottom: "4px",
                    }}
                  >
                    {project.name}
                  </h3>
                  <p
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontWeight: 400,
                      fontSize: "12px",
                      color: "rgba(255,255,255,0.4)",
                    }}
                  >
                    Due {project.dueDate}
                  </p>
                </div>
                <span
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 600,
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: project.status === "In Review" ? "#f0c040" : "#60d060",
                    background: project.status === "In Review" ? "rgba(240,192,64,0.1)" : "rgba(96,208,96,0.1)",
                    padding: "4px 12px",
                    borderRadius: "20px",
                  }}
                >
                  {project.status}
                </span>
              </div>
              <div style={{ marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontWeight: 500,
                      fontSize: "12px",
                      color: "rgba(255,255,255,0.5)",
                    }}
                  >
                    {project.phase}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontWeight: 600,
                      fontSize: "12px",
                      color: "rgba(255,255,255,0.7)",
                    }}
                  >
                    {project.progress}%
                  </span>
                </div>
                <div
                  style={{
                    height: "3px",
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: "2px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${project.progress}%`,
                      background: "#ffffff",
                      borderRadius: "2px",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px" }}>
          <div>
            <h2
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 700,
                fontSize: "13px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.5)",
                marginBottom: "24px",
              }}
            >
              Recent Activity
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {recentActivity.map((item, i) => (
                <div
                  key={i}
                  style={{
                    padding: "16px 0",
                    borderBottom: i < recentActivity.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontWeight: 400,
                      fontSize: "14px",
                      color: "rgba(255,255,255,0.7)",
                    }}
                  >
                    {item.text}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontWeight: 400,
                      fontSize: "12px",
                      color: "rgba(255,255,255,0.3)",
                      whiteSpace: "nowrap",
                      marginLeft: "24px",
                    }}
                  >
                    {item.time}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 700,
                fontSize: "13px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.5)",
                marginBottom: "24px",
              }}
            >
              More From PGTSND
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {offerings.map((offering) => (
                <div
                  key={offering.name}
                  style={{
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "8px",
                    padding: "20px 24px",
                    opacity: 0.45,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontFamily: "'Montserrat', sans-serif",
                        fontWeight: 600,
                        fontSize: "14px",
                        color: "#ffffff",
                        marginBottom: "2px",
                      }}
                    >
                      {offering.name}
                    </p>
                    <p
                      style={{
                        fontFamily: "'Montserrat', sans-serif",
                        fontWeight: 400,
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.5)",
                      }}
                    >
                      {offering.range}
                    </p>
                  </div>
                  <span
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontWeight: 600,
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.4)",
                      textDecoration: "underline",
                      textUnderlineOffset: "3px",
                      cursor: "pointer",
                    }}
                  >
                    Contact Bri
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
