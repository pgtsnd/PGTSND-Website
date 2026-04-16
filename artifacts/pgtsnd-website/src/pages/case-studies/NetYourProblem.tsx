import { useState, useRef, useCallback, useEffect } from "react";
import CTAButton from "../../components/CTAButton";
import ScrollBadge from "../../components/ScrollBadge";
import Footer from "../../components/Footer";
import Header from "../../components/Header";

const f = (s: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "'Montserrat', sans-serif",
  ...s,
});

const services = ["Video Production", "Photography"];

const heroImage = "/images/case-studies/net-your-problem/net-your-problem-pgt-snd-photography-5.jpeg";

const galleryImages = [
  "/images/case-studies/net-your-problem/net-your-problem-pgtsnd-photography-6.jpeg",
  "/images/case-studies/net-your-problem/net-your-progblem-pgtsnd-photography-2.jpeg",
  "/images/case-studies/net-your-problem/net-your-problem-pgt-snd-photography-4.jpeg",
  "/images/case-studies/net-your-problem/net-your-problem-pgt-snd-photography-1.jpeg",
  "/images/case-studies/net-your-problem/net-your-problem-pgtsnd-photography-7.jpeg",
  "/images/case-studies/net-your-problem/net-your-problem-pgtsnd-photography-8.jpeg",
  "/images/case-studies/net-your-problem/net-your-problem-pgtsnd-photgraphy-9.jpeg",
];

const socialLinks = [
  { label: "Visit Instagram", href: "https://www.instagram.com/netyourproblem" },
  { label: "Visit Website", href: "https://www.netyourproblem.com" },
  { label: "Visit YouTube", href: "https://www.youtube.com/@netyourproblem" },
];

function GalleryCarousel({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const len = images.length;

  const wrap = (i: number) => ((i % len) + len) % len;

  const goNext = useCallback(() => setCurrent((c) => c + 1), []);
  const goPrev = useCallback(() => setCurrent((c) => c - 1), []);

  const imageWidth = 70;
  const gap = 1.5;

  const visible = [-2, -1, 0, 1, 2].map((offset) => {
    const idx = wrap(current + offset);
    return { idx, offset, src: images[idx] };
  });

  return (
    <section style={{ padding: "0 0 40px", position: "relative", overflow: "hidden" }}>
      <div
        ref={trackRef}
        style={{
          display: "flex",
          gap: `${gap}vw`,
          justifyContent: "center",
          alignItems: "center",
          height: "clamp(400px, 50vw, 680px)",
          cursor: "grab",
        }}
        onMouseDown={(e) => {
          isDragging.current = true;
          startX.current = e.clientX;
          if (trackRef.current) trackRef.current.style.cursor = "grabbing";
        }}
        onMouseMove={(e) => {
          if (!isDragging.current) return;
          if (Math.abs(e.clientX - startX.current) > 5) e.preventDefault();
        }}
        onMouseUp={(e) => {
          if (!isDragging.current) return;
          isDragging.current = false;
          if (trackRef.current) trackRef.current.style.cursor = "grab";
          const diff = e.clientX - startX.current;
          if (diff < -60) goNext();
          else if (diff > 60) goPrev();
        }}
        onMouseLeave={() => {
          isDragging.current = false;
          if (trackRef.current) trackRef.current.style.cursor = "grab";
        }}
      >
        {visible.map(({ idx, offset, src }) => (
          <div
            key={`${current}-${offset}`}
            onClick={() => { if (offset !== 0) setCurrent(current + offset); }}
            style={{
              minWidth: `${imageWidth}vw`,
              height: "100%",
              overflow: "hidden",
              opacity: offset === 0 ? 1 : 0.4,
              transition: "opacity 0.4s ease",
              cursor: offset === 0 ? "default" : "pointer",
              flexShrink: 0,
            }}
          >
            <img
              src={src}
              alt=""
              draggable={false}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", userSelect: "none" }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end", padding: "20px 40px 0" }}>
        <button
          onClick={goPrev}
          style={{
            width: "40px",
            height: "40px",
            background: "rgba(255,255,255,0.9)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#000000",
            fontSize: "18px",
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 700,
          }}
        >
          &#8592;
        </button>
        <button
          onClick={goNext}
          style={{
            width: "40px",
            height: "40px",
            background: "rgba(255,255,255,0.9)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#000000",
            fontSize: "18px",
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 700,
          }}
        >
          &#8594;
        </button>
      </div>
    </section>
  );
}

function VideoPlaceholder({ thumbnail, duration }: { thumbnail: string; duration: string }) {
  return (
    <div style={{ position: "relative", background: "#111", aspectRatio: "16 / 9", overflow: "hidden" }}>
      <img src={thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "2px solid rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="18" height="22" viewBox="0 0 18 22" fill="white"><polygon points="0,0 18,11 0,22" /></svg>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: "12px", left: "16px" }}>
        <span style={f({ fontSize: "12px", color: "rgba(255,255,255,0.7)" })}>00:00 / {duration}</span>
      </div>
      <div style={{ position: "absolute", bottom: "12px", right: "16px", display: "flex", gap: "12px", alignItems: "center" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/></svg>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2"><circle cx="12" cy="12" r="3"/></svg>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
      </div>
    </div>
  );
}

export default function NetYourProblem() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroOffset, setHeroOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const viewH = window.innerHeight;
      const progress = 1 - (rect.top + rect.height) / (viewH + rect.height);
      const clamped = Math.max(0, Math.min(1, progress));
      setHeroOffset(clamped * 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <Header />
      <div style={{ background: "#000000", minHeight: "100vh" }}>
        <section style={{ padding: "160px 80px 180px", textAlign: "center" }}>
          <h1 style={f({ fontWeight: 900, fontSize: "clamp(36px, 5vw, 64px)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1.05, color: "#ffffff", marginBottom: "32px" })}>
            Net Your Problem X PGTSND
          </h1>
          <div style={{ display: "flex", justifyContent: "center", gap: "40px" }}>
            {services.map((s) => (
              <p key={s} style={f({ fontSize: "14px", color: "rgba(255,255,255,0.8)", lineHeight: 2 })}>&#183; {s}</p>
            ))}
          </div>
        </section>

        <section style={{ padding: "0 0 40px", position: "relative" }}>
          <div ref={heroRef} style={{ position: "relative", overflow: "visible" }}>
            <div style={{ width: "100%", height: "clamp(340px, 40vw, 520px)", overflow: "hidden" }}>
              <img
                src={heroImage}
                alt="Net Your Problem - Aerial View"
                style={{ width: "115%", height: "100%", objectFit: "cover", objectPosition: "center center", display: "block", transform: `translateX(${-7.5 + heroOffset}%)`, willChange: "transform" }}
              />
            </div>
            <div style={{ position: "absolute", bottom: "-60px", left: "60px", maxWidth: "420px", zIndex: 2 }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", overflow: "hidden", marginBottom: "-28px", marginLeft: "24px", position: "relative", zIndex: 3 }}>
                <img
                  src={"/images/nicole-baker-pgtsnd.jpg"}
                  alt="Nicole Baker"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div style={{ border: "2px solid #ffffff", padding: "44px 28px 28px", background: "rgba(0,0,0,0.85)" }}>
                <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "16px" })}>
                  &ldquo;Bri is the mother in a fishing family. So when we decided to make a film highlighting a friend of ours, their multigenerational fishing family and their decision to recycle nets from their barn, there was no better choice.&rdquo;
                </p>
                <p style={f({ fontWeight: 700, fontSize: "13px", color: "#ffffff" })}>
                  Nicole Baker, Net Your Problem
                </p>
              </div>
            </div>
            <div style={{ position: "absolute", bottom: "450px", right: "60px" }}>
              <ScrollBadge position="bottom-right" inline />
            </div>
          </div>
        </section>

        <section style={{ padding: "220px 80px 240px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "start" }}>
          <h2 style={f({ fontWeight: 900, fontSize: "clamp(32px, 4vw, 48px)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1.1, color: "#ffffff" })}>
            Inside Our Partnership
          </h2>
          <div>
            <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 2, marginBottom: "12px" })}>
              Net Your Problem is tackling one of the fishing industry's biggest challenges: what to do with old nets once their original use life is through.
            </p>
            <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 2, marginBottom: "12px" })}>
              PGTSND brought that mission to life by developing and producing two unique brand films that show the positive impact of net recycling on both communities and the environment.
            </p>
            <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 2, marginBottom: "12px" })}>
              We showcased the unique partnership NYP has with coastal communities and the ports they operate in.
            </p>
            <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 2 })}>
              Each piece was designed to educate, inspire, and connect, proving that visual storytelling can show how sustainability is not just a practical matter, but deeply human.
            </p>
          </div>
        </section>

        <section style={{ padding: "0 80px 230px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "start" }}>
            <VideoPlaceholder
              thumbnail={"/images/case-studies/net-your-problem/net-your-problem-pgtsnd-photography-8.jpeg"}
              duration="05:04"
            />
            <VideoPlaceholder
              thumbnail={"/images/case-studies/net-your-problem/net-your-problem-pgt-snd-photography-1.jpeg"}
              duration="07:49"
            />
          </div>
        </section>

        <GalleryCarousel images={galleryImages} />

        <section style={{ padding: "40px 80px 80px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "16px 24px",
                  border: "2px solid rgba(255,255,255,0.4)",
                  borderRadius: "999px",
                  textDecoration: "none",
                  ...f({ fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.12em", color: "#ffffff" }),
                }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </section>

        <section style={{ padding: "200px 80px 200px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
          <div style={{ maxWidth: "480px" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", overflow: "hidden", marginBottom: "-28px", marginLeft: "24px", position: "relative", zIndex: 3 }}>
              <img
                src={"/images/nicole-baker-pgtsnd.jpg"}
                alt="Nicole Baker"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ border: "2px solid #ffffff", padding: "64px 40px 42px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <p style={f({ fontWeight: 400, fontSize: "16px", color: "rgba(255,255,255,0.8)", lineHeight: 1.8, marginBottom: "24px" })}>
                &ldquo;Bri and her team make the whole process of making a film simple. They come up with interview questions and a shot list, and have let me be as picky as I want during the editing process. The films we've created with her have been remarkably useful for us at conferences and in helping to recruit new partners. We've also taken clips from the long form video to use in social media and they are some of our most successful posts.&rdquo;
              </p>
              <p style={f({ fontWeight: 700, fontSize: "13px", color: "#ffffff" })}>
                Nicole Baker, Net Your Problem
              </p>
            </div>
          </div>
          <div>
            <h2 style={f({ fontWeight: 900, fontSize: "clamp(28px, 4.5vw, 52px)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1.05, color: "#ffffff", marginBottom: "32px" })}>
              Your work speaks volumes. We're here to make sure it's seen &amp; heard.
            </h2>
            <div style={{ marginTop: "10px" }}>
              <CTAButton href="/contact" label="Start a Project" />
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
