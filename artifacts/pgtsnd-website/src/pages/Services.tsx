import { useState, useEffect, useRef, useCallback } from "react";
import CTAButton from "../components/CTAButton";
import ScrollBadge from "../components/ScrollBadge";
import Footer from "../components/Footer";

const f = (s: React.CSSProperties): React.CSSProperties => ({ fontFamily: "'Montserrat', sans-serif", ...s });

function useScrollProgress(ref: React.RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);
  const onScroll = useCallback(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = Math.max(0, Math.min(1, (vh - rect.top) / (vh + rect.height)));
    setProgress(p);
  }, [ref]);
  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);
  return progress;
}

function ServiceCategory({
  title,
  items,
  cta,
}: {
  title: string;
  items: { label: string; desc: string }[];
  cta?: { href: string; label: string };
}) {
  return (
    <section
      style={{
        padding: "120px 80px 160px",
        display: "grid",
        gridTemplateColumns: "2fr 3fr",
        gap: "120px",
        alignItems: "start",
      }}
    >
      <h2
        style={f({
          fontWeight: 900,
          fontSize: "clamp(40px, 5.5vw, 68px)",
          textTransform: "uppercase",
          letterSpacing: "-0.02em",
          lineHeight: 0.95,
          color: "#ffffff",
        })}
      >
        {title}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "56px" }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              borderLeft: "3px solid rgba(255,255,255,0.5)",
              paddingLeft: "28px",
              paddingTop: "4px",
              paddingBottom: "4px",
            }}
          >
            <p style={f({ fontWeight: 700, fontSize: "17px", color: "#ffffff", marginBottom: "8px" })}>
              {item.label}
            </p>
            <p style={f({ fontWeight: 400, fontSize: "17px", color: "rgba(255,255,255,0.7)", lineHeight: 1.7 })}>
              {item.desc}
            </p>
          </div>
        ))}
        {cta && (
          <div style={{ paddingTop: "16px" }}>
            <CTAButton href={cta.href} label={cta.label} />
          </div>
        )}
      </div>
    </section>
  );
}

function TestimonialImage({
  imageSrc,
  imageAlt,
  quote,
  author,
  authorTitle,
  avatarSrc,
  scrollSlide,
}: {
  imageSrc: string;
  imageAlt: string;
  quote: string;
  author: string;
  authorTitle?: string;
  avatarSrc?: string;
  scrollSlide?: boolean;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const progress = useScrollProgress(sectionRef);

  const translateX = scrollSlide ? progress * 80 : 0;
  const translateY = scrollSlide ? progress * -50 : 0;
  const darken = scrollSlide ? progress * 0.75 : 0;

  return (
    <section
      ref={sectionRef}
      style={{ position: "relative", marginBottom: "120px" }}
    >
      <div style={{ overflow: "hidden", position: "relative" }}>
        <img
          src={imageSrc}
          alt={imageAlt}
          style={{
            width: scrollSlide ? "110%" : "100%",
            height: "55vh",
            objectFit: "cover",
            display: "block",
            marginLeft: scrollSlide ? "-5%" : undefined,
            transform: scrollSlide ? `translate(${translateX}px, ${translateY}px) scale(1.05)` : undefined,
            transition: scrollSlide ? "transform 0.1s linear" : undefined,
          }}
        />
        {scrollSlide && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `rgba(0,0,0,${darken})`,
              pointerEvents: "none",
              transition: "background 0.1s linear",
            }}
          />
        )}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: "-40px",
          left: "80px",
          maxWidth: "400px",
          zIndex: 2,
        }}
      >
        {avatarSrc && (
          <img
            src={avatarSrc}
            alt={author}
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              objectFit: "cover",
              position: "relative",
              zIndex: 3,
              marginBottom: "-24px",
              marginLeft: "24px",
            }}
          />
        )}
        <div
          style={{
            background: "rgba(0,0,0,0.92)",
            border: "2px solid #ffffff",
            padding: "36px 32px 28px",
          }}
        >
          <p style={f({ fontWeight: 400, fontSize: "14px", color: "rgba(255,255,255,0.85)", lineHeight: 1.7, fontStyle: "italic", marginBottom: "16px" })}>
            &ldquo;{quote}&rdquo;
          </p>
          <p style={f({ fontWeight: 700, fontSize: "13px", color: "#ffffff" })}>
            {author}{authorTitle ? `, ${authorTitle}` : ""}
          </p>
        </div>
      </div>
    </section>
  );
}

export default function Services() {
  return (
    <div style={{ background: "#000000", minHeight: "100vh" }}>
      {/* 1. Hero */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "120px 80px 100px",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "80px",
            alignItems: "end",
          }}
        >
          <div>
            <h1
              style={f({
                fontWeight: 900,
                fontSize: "clamp(56px, 8vw, 100px)",
                textTransform: "uppercase",
                letterSpacing: "-0.03em",
                lineHeight: 0.9,
                color: "#ffffff",
                marginBottom: "32px",
                whiteSpace: "nowrap",
              })}
            >
              What We Do
            </h1>
            <p
              style={f({
                fontWeight: 400,
                fontSize: "16px",
                color: "rgba(255,255,255,0.85)",
                lineHeight: 1.8,
                maxWidth: "500px",
              })}
            >
              PGTSND Productions is a full-service media company specializing in visual assets and messaging for industries that work. We&rsquo;re not here to define who you are. We&rsquo;re here to sharpen it, bring it into focus, and give you the tools to show it with confidence.
            </p>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", paddingBottom: "8px" }}>
            <CTAButton href="/contact" label="Work With Us" />
          </div>
        </div>
        <div style={{ position: "absolute", bottom: "-60px", right: "32px", zIndex: 10 }}>
          <ScrollBadge inline />
        </div>
      </section>

      {/* 2. Seagulls image with Nicole Baker testimonial */}
      <TestimonialImage
        imageSrc="/images/about/pacific-gulls-bri-dwyer-pgtsnd.jpeg"
        imageAlt="Pacific gulls flying over ocean water"
        quote="The films we have created with PGTSND have been remarkably useful for us at conferences and in helping to recruit new partners. We've also taken clips from the long form video to use in social media and they are some of our most successful posts."
        author="Nicole Baker"
        authorTitle="Net Your Problem"
        avatarSrc="/images/nicole-baker-pgtsnd.jpg"
        scrollSlide
      />

      {/* 3. Visual Asset Production */}
      <ServiceCategory
        title="Visual Asset Production"
        items={[
          { label: "Photography:", desc: "On-site, in-studio, environmental, portraits, products, events" },
          { label: "Videography:", desc: "Full production (pre-pro to post), brand videos, interviews, documentary, campaigns, social cuts" },
          { label: "Design:", desc: "Logos, graphics, icon suites, branded visuals" },
          { label: "Websites:", desc: "Design, build, and launch with integrated visuals" },
        ]}
        cta={{ href: "/contact", label: "Start A Project" }}
      />

      {/* 4. Messaging & Content */}
      <ServiceCategory
        title="Messaging & Content"
        items={[
          { label: "Website writing:", desc: "Clear, concise, on-brand copy" },
          { label: "Content writing:", desc: "Blogs, case studies, articles" },
          { label: "Brand voice guides:", desc: "Messaging frameworks and tone references" },
          { label: "Support messaging:", desc: "Scripts, captions, one-pagers, and product descriptions" },
        ]}
        cta={{ href: "/contact", label: "Start Now" }}
      />

      {/* 5. Forest image with Cory Jackson testimonial */}
      <TestimonialImage
        imageSrc="/images/about/forest-rays-bri-dwyer-pgtsnd.jpeg"
        imageAlt="Sunlight streaming through tall forest trees"
        quote="From the start, PGTSND worked with us on our goals for what we wanted to accomplish, and within the parameters we set. The finished product was an incredible collection of images from the Puget Sound commercial Dungeness fishery."
        author="Cory Jackson"
        authorTitle="Vallation Outerwear"
        avatarSrc="/images/case-studies/vallation-outerwear/vallation-outerwear-logo.png"
      />

      {/* 6. How We Work */}
      <section style={{ padding: "120px 80px 180px" }}>
        <h2
          style={f({
            fontWeight: 900,
            fontSize: "clamp(48px, 8vw, 100px)",
            textTransform: "uppercase",
            letterSpacing: "-0.03em",
            lineHeight: 0.95,
            color: "#ffffff",
            marginBottom: "80px",
          })}
        >
          How We Work
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "60px 80px",
          }}
        >
          {[
            { label: "Full-service:", desc: "From pre-production to final cut" },
            { label: "Field-proven:", desc: "Travel-ready crews, remote and on-site" },
            { label: "Production Studio:", desc: "Based in Seattle, with controlled environment options" },
            { label: "Results-focused:", desc: "Assets designed to move the needle (sales, funding, hiring, policy, awareness)" },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                borderLeft: "3px solid rgba(255,255,255,0.5)",
                paddingLeft: "28px",
                paddingTop: "4px",
                paddingBottom: "4px",
              }}
            >
              <p style={f({ fontWeight: 700, fontSize: "17px", color: "#ffffff", marginBottom: "8px" })}>
                {item.label}
              </p>
              <p style={f({ fontWeight: 400, fontSize: "17px", color: "rgba(255,255,255,0.7)", lineHeight: 1.7 })}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Final CTA — Boat background */}
      <section
        style={{
          position: "relative",
          minHeight: "80vh",
          marginBottom: "80px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        <img
          src="/images/about/fishing-boat-seafoam-bri-dwyer-pgtsnd.jpeg"
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(0.3)",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <img
            src="/images/site/pgtsnd-camera.webp"
            alt="Camera illustration"
            style={{ width: "360px", height: "auto", margin: "0 auto 40px", display: "block", opacity: 0.9 }}
          />
          <h2
            style={f({
              fontWeight: 900,
              fontSize: "clamp(36px, 5vw, 60px)",
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              lineHeight: 1.0,
              color: "#ffffff",
              marginBottom: "20px",
            })}
          >
            Wherever the job
            <br />
            takes you&hellip;
          </h2>
          <p style={f({ fontWeight: 400, fontSize: "16px", color: "rgba(255,255,255,0.8)", marginBottom: "40px" })}>
            We&rsquo;ll meet you there.
          </p>
          <CTAButton href="/contact" label="Let's Get To Work" />
        </div>
      </section>

      <Footer />
    </div>
  );
}
