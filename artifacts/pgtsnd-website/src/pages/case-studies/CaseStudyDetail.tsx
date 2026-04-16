import { useState } from "react";
import { useRoute } from "wouter";
import { getCaseStudy } from "../../data/caseStudyData";
import CTAButton from "../../components/CTAButton";
import ScrollBadge from "../../components/ScrollBadge";
import Footer from "../../components/Footer";
import Header from "../../components/Header";

const f = (s: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "'Montserrat', sans-serif",
  ...s,
});

function PhotoCarousel({ images }: { images: string[] }) {
  const [startIndex, setStartIndex] = useState(0);
  const visible = 3;
  const maxStart = Math.max(0, images.length - visible);

  const prev = () => setStartIndex((i) => Math.max(0, i - 1));
  const next = () => setStartIndex((i) => Math.min(maxStart, i + 1));

  const visibleImages = images.slice(startIndex, startIndex + visible);

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${visible}, 1fr)`,
          gap: "10px",
        }}
      >
        {visibleImages.map((img, i) => (
          <div
            key={startIndex + i}
            style={{ overflow: "hidden", aspectRatio: "3 / 4" }}
          >
            <img
              src={img}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>
        ))}
      </div>
      {images.length > visible && (
        <div
          style={{
            display: "flex",
            gap: "2px",
            justifyContent: "flex-end",
            marginTop: "20px",
          }}
        >
          <button
            onClick={prev}
            disabled={startIndex === 0}
            style={{
              width: "44px",
              height: "44px",
              border: "2px solid rgba(255,255,255,0.4)",
              background: "transparent",
              color: startIndex === 0 ? "rgba(255,255,255,0.2)" : "#ffffff",
              cursor: startIndex === 0 ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
            }}
          >
            &#8592;
          </button>
          <button
            onClick={next}
            disabled={startIndex >= maxStart}
            style={{
              width: "44px",
              height: "44px",
              border: "2px solid rgba(255,255,255,0.4)",
              background: "transparent",
              color:
                startIndex >= maxStart ? "rgba(255,255,255,0.2)" : "#ffffff",
              cursor: startIndex >= maxStart ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
            }}
          >
            &#8594;
          </button>
        </div>
      )}
    </div>
  );
}

export default function CaseStudyDetail() {
  const [, params] = useRoute("/case-studies/:slug");
  const slug = params?.slug;
  const study = slug ? getCaseStudy(slug) : undefined;

  if (!study) {
    return (
      <>
        <Header />
        <div
          style={{
            background: "#000",
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p style={f({ color: "#fff", fontSize: "18px" })}>
            Case study not found.
          </p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div style={{ background: "#000000", minHeight: "100vh" }}>
        {/* Hero Title */}
        <section
          style={{
            padding: "180px 80px 60px",
            textAlign: "center",
          }}
        >
          <h1
            style={f({
              fontWeight: 900,
              fontSize: "clamp(36px, 6vw, 72px)",
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              lineHeight: 1,
              color: "#ffffff",
              marginBottom: "24px",
            })}
          >
            {study.title}
          </h1>
          <p
            style={f({
              fontWeight: 400,
              fontSize: "15px",
              color: "rgba(255,255,255,0.7)",
              letterSpacing: "0.03em",
            })}
          >
            {study.subtitle}
          </p>
        </section>

        {/* Hero Image + Testimonial */}
        <section style={{ padding: "0 40px", position: "relative" }}>
          <div
            style={{
              width: "100%",
              height: "70vh",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <img
              src={study.heroImage}
              alt={study.client}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
            <div style={{ position: "absolute", top: "40px", right: "40px" }}>
              <ScrollBadge position="bottom-right" inline />
            </div>
          </div>

          {/* Testimonial Box */}
          <div
            style={{
              maxWidth: "440px",
              position: "relative",
              marginTop: "-80px",
              marginLeft: "60px",
              zIndex: 2,
            }}
          >
            {study.testimonial.logo && (
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  marginBottom: "-32px",
                  position: "relative",
                  zIndex: 3,
                  border: "3px solid #000",
                }}
              >
                <img
                  src={study.testimonial.logo}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
            )}
            <div
              style={{
                border: "2px solid #ffffff",
                padding: "48px 32px 32px",
                background: "rgba(0,0,0,0.85)",
              }}
            >
              <p
                style={f({
                  fontWeight: 400,
                  fontStyle: "italic",
                  fontSize: "15px",
                  color: "rgba(255,255,255,0.85)",
                  lineHeight: 1.7,
                  marginBottom: "20px",
                })}
              >
                &ldquo;{study.testimonial.quote}&rdquo;
              </p>
              <p
                style={f({
                  fontWeight: 700,
                  fontSize: "13px",
                  color: "#ffffff",
                })}
              >
                {study.testimonial.author}
              </p>
            </div>
          </div>
        </section>

        {/* Inside Our Partnership */}
        <section
          style={{
            padding: "120px 80px",
            display: "grid",
            gridTemplateColumns: "2fr 3fr",
            gap: "80px",
            alignItems: "start",
          }}
        >
          <h2
            style={f({
              fontWeight: 900,
              fontSize: "clamp(32px, 4vw, 48px)",
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              lineHeight: 1,
              color: "#ffffff",
            })}
          >
            {study.sectionTitle}
          </h2>
          <div>
            {study.paragraphs.map((p, i) => (
              <p
                key={i}
                style={f({
                  fontWeight: 400,
                  fontSize: "15px",
                  color: "rgba(255,255,255,0.8)",
                  lineHeight: 1.8,
                  marginBottom: i < study.paragraphs.length - 1 ? "20px" : "0",
                })}
              >
                {p}
              </p>
            ))}
          </div>
        </section>

        {/* Photo Gallery Carousel */}
        <section style={{ padding: "0 40px 80px" }}>
          <PhotoCarousel images={study.gallery} />
        </section>

        {/* Bottom CTA */}
        <section
          style={{
            padding: "80px 80px 120px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "80px",
            alignItems: "center",
          }}
        >
          <div style={{ maxWidth: "440px" }}>
            {study.testimonial.logo && (
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  marginBottom: "-28px",
                  position: "relative",
                  zIndex: 3,
                  border: "3px solid #000",
                }}
              >
                <img
                  src={study.testimonial.logo}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
            )}
            <div
              style={{
                border: "2px solid #ffffff",
                padding: study.testimonial.logo
                  ? "44px 28px 28px"
                  : "28px",
              }}
            >
              <p
                style={f({
                  fontWeight: 400,
                  fontStyle: "italic",
                  fontSize: "14px",
                  color: "rgba(255,255,255,0.8)",
                  lineHeight: 1.7,
                  marginBottom: "16px",
                })}
              >
                &ldquo;{study.testimonial.quote}&rdquo;
              </p>
              <p
                style={f({
                  fontWeight: 700,
                  fontSize: "12px",
                  color: "#ffffff",
                })}
              >
                {study.testimonial.author}
              </p>
            </div>
          </div>
          <div>
            <h2
              style={f({
                fontWeight: 900,
                fontSize: "clamp(32px, 5vw, 56px)",
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
                color: "#ffffff",
                marginBottom: "32px",
              })}
            >
              Ready to show the world what you do?
            </h2>
            <CTAButton href="/contact" label="Work With Us" />
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
