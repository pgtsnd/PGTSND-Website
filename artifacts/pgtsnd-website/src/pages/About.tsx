import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import CTAButton from "../components/CTAButton";
import ScrollBadge from "../components/ScrollBadge";
import Footer from "../components/Footer";

function CaseStudyCard({ img }: { img: { src: string; alt: string; title: string; subtitle: string } }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href="/case-studies" style={{ textDecoration: "none", display: "block" }}>
      <div
        style={{ position: "relative", overflow: "hidden", cursor: "pointer" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <img
          src={img.src}
          alt={img.alt}
          style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", display: "block", transition: "transform 0.4s ease", transform: hovered ? "scale(1.05)" : "scale(1)" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
        >
          <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: "clamp(20px, 2.5vw, 32px)", textTransform: "uppercase", color: "#ffffff", textAlign: "center", lineHeight: 1.1, marginBottom: "16px", padding: "0 20px" }}>
            {img.title}
          </h3>
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "15px", fontStyle: "italic", color: "rgba(255,255,255,0.9)", textAlign: "center" }}>
            {img.subtitle}
          </p>
        </div>
      </div>
    </Link>
  );
}

const teamMembers = [
  {
    name: "Kandice Brending",
    role: "Production Manager",
    image: "/images/about/kandice-pgtsnd.png",
    bio: "Kandice keeps PGTSND projects on track and sounding sharp. As Production Manager, she works directly with clients to guide productions from first brief to final cut, coordinating shoots, managing logistics, and shaping stories through sound design and video editing. She's passionate about surfacing voices and experiences that might otherwise go unheard, believing every person and place has a story worth telling. When she's off set, you'll find her making music or hiking mountain trails with her dog.",
  },
  {
    name: "Kyle Smith",
    role: "Lead Graphic Design",
    image: "/images/about/kyle.png",
    bio: "Kyle is responsible for dreaming and designing all logos, websites, and brand visuals for PGTSND's clients. His work gives life to new brands building their visual presence, and helps time-tested businesses stay current in a fast-moving world. By giving established brands a fresh, modern edge, Kyle ensures they don't just stand with the crowd, they stand out. When he's not designing, he's chasing new places with a goal to visit all 50 states by his 40th birthday (44 down, 6 to go!).",
  },
  {
    name: "Trish Whetstone",
    role: "Copy, Content & Creative Writer",
    image: "/images/about/trish.png",
    bio: "Trish gives PGTSND's visuals their voice. A specialist in creative communications, she crafts words for websites, blogs, and brand guides that reinforce the stories captured in the field and make sure our clients are heard as well as seen. She loves to bring personality to a plot, digging into the histories, motivations, and passions that drive the brands we work with. Off the page, she leads hands-on educational experiences that make seafood less intimidating and way more fun for fish-curious folk.",
  },
  {
    name: "Lauren Dey",
    role: "Operations Manager",
    image: "/images/about/lauren.png",
    bio: "Lauren keeps PGTSND running smoothly behind the scenes. As Operations Manager, she builds the systems and structure that help creative teams do their best. She turns creative chaos into organized flow\u2014building processes, managing day-to-day operations, and helping the team stay aligned from kickoff to final delivery. Her background in recruitment operations shaped her belief that the heart of good work is good people. She's known for fostering collaborative environments, solving problems with calm clarity, and scaling systems that help teams grow without losing their spark.\n\nWhen she's not in organizational mode, Lauren spends as much time outdoors as possible\u2014hiking mountain trails, snowboarding in the winter, paddle boarding in the summer, traveling to new places, and taking her dog on long walks around Portland.",
  },
  {
    name: "Allie Preusch",
    role: "Accounting",
    image: "/images/about/allie-pgtsnd.png",
    bio: "Allie wrangles the numbers at PGTSND\u2014budgets, reports, and all the behind-the-scenes details that keep productions on track and stress-free. She ensures productions run smoothly by handling the details so the creative team can focus on storytelling. When she's not crunching numbers, she's passionate about helping small farmers reach consumers, writing, and exploring the Northern Colorado mountains with her family.",
  },
  {
    name: "Cody Curtain",
    role: "Director of Photography, Editor",
    image: "/images/about/cody-pgtsnd.png",
    bio: "Cody brings an all-hands approach to every shoot. At PGTSND, he moves fluidly between camera, lighting, grip/electric, and editing, blending technical skill with artistry to capture stories that help us know one another better. He sees each project as a chance to learn from the people and communities we work with, while shaping visuals that connect with the heart of those who view them. Off set, Cody's busy welding, making music, chasing two very fast dogs, and laughing with his partner, Shannon (often while she destroys him at tennis).",
  },
];

const caseStudyImages = [
  {
    src: "/images/case-studies/nw-sablefish/nw-sablefish-pgtsnd-photography-7.jpeg",
    alt: "A chef holding a plate of cooked sablefish",
    title: "NW Sablefish",
    subtitle: "Full Production Suite +",
  },
  {
    src: "/images/case-studies/absc/gloves-close-bri-dwyer-pgtsnd-alaska-berring.jpeg",
    alt: "A worker handling thick rope near a container",
    title: "Alaska Bering Sea Crabbers",
    subtitle: "Full Production Suite",
  },
  {
    src: "/images/case-studies/green-juju/green-juju-dog-kitchen-pgtsnd.jpeg",
    alt: "Person handing a dog a bowl of food in a kitchen",
    title: "Green JUJU",
    subtitle: "Full Production Suite +",
  },
];

const f = (s: React.CSSProperties): React.CSSProperties => ({ fontFamily: "'Montserrat', sans-serif", ...s });

const heroWords = [
  {
    text: "Resilient",
    image: "/images/boats-inlet-pgtsnd-bri-dwyer.jpeg",
    position: { top: "16%", left: "3%", width: "24%", height: "58%" },
  },
  {
    text: "Roots,",
    image: "/images/crabs-pelican-pgtsnd-bri-dwyer.jpeg",
    position: { top: "5%", left: "27%", width: "30%", height: "76%" },
  },
  {
    text: "Steady",
    image: "/images/site/foggy-fishing-coast-pgtsnd.jpeg",
    position: { top: "16%", left: "3%", width: "24%", height: "58%" },
  },
  {
    text: "Stories",
    image: "/images/fisherman-hands-close-pgtsnd-bri-dwyer.jpeg",
    position: { top: "16%", left: "62%", width: "32%", height: "60%" },
  },
];

function HeroSection() {
  const [activeWord, setActiveWord] = useState<number | null>(null);

  return (
    <section
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "120px 80px 100px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <h1
        style={f({
          fontWeight: 900,
          fontSize: "clamp(48px, 9.5vw, 130px)",
          textTransform: "uppercase",
          letterSpacing: "-0.03em",
          lineHeight: 0.95,
          color: "#ffffff",
          whiteSpace: "nowrap",
          position: "relative",
          zIndex: 1,
        })}
      >
        <span style={{ display: "inline" }}>
          {heroWords.slice(0, 2).map((word, i) => (
            <span
              key={i}
              onMouseEnter={() => setActiveWord(i)}
              onMouseLeave={() => setActiveWord(null)}
              style={{ cursor: "default" }}
            >
              {word.text}{i === 0 ? " " : ""}
            </span>
          ))}
        </span>
        <br />
        <span style={{ display: "inline" }}>
          {heroWords.slice(2).map((word, i) => (
            <span
              key={i + 2}
              onMouseEnter={() => setActiveWord(i + 2)}
              onMouseLeave={() => setActiveWord(null)}
              style={{ cursor: "default" }}
            >
              {word.text}{i === 0 ? " " : ""}
            </span>
          ))}
        </span>
      </h1>
      {heroWords.map((word, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: word.position.top,
            left: word.position.left,
            width: word.position.width,
            height: word.position.height,
            opacity: activeWord === i ? 1 : 0,
            transform: activeWord === i ? "scale(1)" : "scale(0.92)",
            transition: "opacity 0.45s ease, transform 0.55s ease",
            pointerEvents: "none",
            zIndex: 3,
            overflow: "hidden",
          }}
        >
          <img
            src={word.image}
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
      <ScrollBadge position="bottom-left" />
    </section>
  );
}

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

export default function About() {
  const boatRef = useRef<HTMLElement>(null);
  const briRef = useRef<HTMLDivElement>(null);
  const boatProgress = useScrollProgress(boatRef);
  const briProgress = useScrollProgress(briRef);

  const boatTranslateX = boatProgress * 80;
  const boatTranslateY = boatProgress * -50;
  const boatDarken = boatProgress * 0.75;

  const briBrightness = 0.15 + Math.min(1, briProgress * 2.5) * 0.85;

  return (
    <div style={{ background: "#000000", minHeight: "100vh" }}>
      {/* 1. Hero — "RESILIENT ROOTS, STEADY STORIES" */}
      <HeroSection />

      {/* 2. Mission statement — large bold heading + body copy */}
      <section
        style={{
          padding: "120px 80px 240px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "80px",
          alignItems: "start",
        }}
      >
        <h2
          style={f({
            fontWeight: 900,
            fontSize: "clamp(32px, 4vw, 52px)",
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
            lineHeight: 1.0,
            color: "#ffffff",
          })}
        >
          PGTSND Productions turns the real work you do into clear stories you can show.
        </h2>

        <div>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "20px" })}>
            We help industries that feed, build, and sustain us, show their value through visuals and words that clients can use and audiences can trust.
          </p>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "20px" })}>
            Our clients come to us when they need their work to demonstrate care and impact. Through photography, film, words, or the full production suite, we shape stories that reveal not only what the work looks like, but why it matters.
          </p>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "36px" })}>
            Our team is at the top of their technical fields, but what we deliver goes beyond precision. The assets we create build connection and understanding between crews and communities, companies and partners, industries and the people they serve.
          </p>
          <CTAButton href="/services" label="Our Services" />
        </div>
      </section>

      {/* 3. Aerial boat photo with rope coil illustration */}
      <section ref={boatRef} style={{ position: "relative", marginBottom: "120px", overflow: "hidden" }}>
        <img
          src="/images/about/fishing-boat-seafoam-bri-dwyer-pgtsnd.jpeg"
          alt="Aerial view of a fishing boat sailing through dark water with white foam"
          style={{
            width: "110%",
            height: "80vh",
            objectFit: "cover",
            display: "block",
            marginLeft: "-5%",
            transform: `translate(${boatTranslateX}px, ${boatTranslateY}px) scale(1.05)`,
            transition: "transform 0.1s linear",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `rgba(0,0,0,${boatDarken})`,
            pointerEvents: "none",
            transition: "background 0.1s linear",
          }}
        />
        <img
          src="/images/site/av-cord-pgtsnd.webp"
          alt="Coiled production cable illustration"
          style={{
            position: "absolute", top: "40px", right: "80px",
            width: "180px", height: "auto", opacity: 0.9,
          }}
        />
        <div style={{ position: "absolute", bottom: "40px", left: "80px" }}>
          <ScrollBadge inline />
        </div>
      </section>

      {/* 4. Bri's Story */}
      <section
        ref={briRef}
        style={{
          padding: "80px 80px 0",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "80px",
          alignItems: "start",
        }}
      >
        <div style={{ position: "relative" }}>
          <img
            src="/images/about/bri-dwyer-on-site-headshot-pgtsnd.jpg"
            alt="Bri Dwyer standing on a dock with boats in the background"
            style={{ width: "100%", display: "block", filter: `brightness(${briBrightness})`, transition: "filter 0.15s linear" }}
          />

          {/* Testimonial overlay */}
          <div
            style={{
              position: "absolute",
              bottom: "-50px",
              left: "25px",
              right: "25px",
            }}
          >
            <img
              src="/images/case-studies/absc/Jamie-Goen-Alaska-Bering-Sea-Crabbers-pgt-snd.jpg"
              alt="Jamie Goen"
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                objectFit: "cover",
                position: "relative",
                zIndex: 2,
                marginBottom: "-32px",
                marginLeft: "28px",
              }}
            />
            <div
              style={{
                background: "rgba(0,0,0,0.92)",
                border: "2px solid #ffffff",
                padding: "44px 36px 32px",
              }}
            >
              <p style={f({ fontWeight: 400, fontSize: "16px", color: "rgba(255,255,255,0.85)", lineHeight: 1.7, fontStyle: "italic", marginBottom: "20px" })}>
                &ldquo;Bri had an amazing vision for how to tell our story from various angles &mdash; showcasing the true grit, hard work, passion, and resilience that are the heart of our industry.&rdquo;
              </p>
              <p style={f({ fontWeight: 700, fontSize: "15px", color: "#ffffff" })}>
                Jamie Goen, Alaska Bering Sea Crabbers
              </p>
            </div>
          </div>
        </div>

        <div>
          <p
            style={f({
              fontWeight: 700,
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: "rgba(255,255,255,0.5)",
              marginBottom: "20px",
            })}
          >
            Founder of PGTSND Productions
          </p>
          <h2
            style={f({
              fontWeight: 900,
              fontSize: "clamp(36px, 5vw, 56px)",
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              lineHeight: 0.95,
              color: "#ffffff",
              marginBottom: "32px",
            })}
          >
            Bri&rsquo;s Story
          </h2>

          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "20px" })}>
            PGTSND began with a camera, a plane ticket, and a hunger for adventure. Bri Dwyer &mdash; a photographer with a decade experience behind her &mdash; landed in Dutch Harbor, Alaska, surrounded by the scale and intensity of the land, the sea, and the commercial fishing industry.
          </p>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "20px" })}>
            What struck her was not only the grit and passion of the work, but the gap: these stories weren&rsquo;t being told, and the people doing the work weren&rsquo;t being seen.
          </p>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "20px" })}>
            So she started documenting. First with photographs, then with video, bringing audiences out to sea through her lens. Word spread, and soon crews, companies, and communities were asking her to share their stories with the world.
          </p>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "20px" })}>
            Today, PGTSND has grown into a full production house with crews at the top of their fields, end-to-end projects, and a portfolio that spans industries. But the heart remains the same: show up prepared, respect the people and the place, and tell the story with conviction.
          </p>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "36px" })}>
            PGTSND is built from love and resilience, guided by creativity and business sense, and grounded in gratitude for the trust we&rsquo;re given. That gratitude keeps us steady, no matter the conditions, and drives us to deliver work worthy of the people and industries we serve.
          </p>
          <CTAButton href="/contact" label="Work With Us" />
        </div>
      </section>

      {/* 5. Our Work in Action */}
      <section style={{ padding: "160px 80px 80px" }}>
        <img
          src="/images/site/pgtsnd-spotlight.webp"
          alt="Production equipment illustration"
          style={{ width: "180px", height: "auto", marginBottom: "32px", opacity: 1, filter: "brightness(1.2)" }}
        />
        <h2
          style={f({
            fontWeight: 900,
            fontSize: "clamp(40px, 8.2vw, 105px)",
            textTransform: "uppercase",
            letterSpacing: "-0.03em",
            lineHeight: 0.95,
            color: "#ffffff",
            marginBottom: "48px",
            whiteSpace: "nowrap",
          })}
        >
          Our Work In Action
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "40px" }}>
          {caseStudyImages.map((img) => (
            <CaseStudyCard key={img.title} img={img} />
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <CTAButton href="/case-studies" label="See All Case Studies" />
        </div>
      </section>

      {/* 6. PGTSND Team Bios */}
      <section style={{ padding: "80px 80px" }}>
        <h2
          style={f({
            fontWeight: 900,
            fontSize: "clamp(36px, 5vw, 60px)",
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
            lineHeight: 0.95,
            color: "#ffffff",
            marginBottom: "80px",
          })}
        >
          PGTSND
          <br />
          Team Bios
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "0px" }}>
          {teamMembers.map((member) => (
            <div
              key={member.name}
              style={{
                display: "grid",
                gridTemplateColumns: "3fr 2fr",
                gap: "0px",
                alignItems: "start",
                padding: "60px 0",
                borderTop: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ height: "400px", display: "flex", alignItems: "flex-start" }}>
                <img
                  src={member.image}
                  alt={`Illustration of ${member.name}`}
                  style={{ height: "400px", width: "auto", maxWidth: "100%", objectFit: "contain", objectPosition: "left top" }}
                />
              </div>
              <div style={{ paddingTop: "10px" }}>
                <h3
                  style={f({
                    fontWeight: 900,
                    fontSize: "clamp(24px, 2.5vw, 32px)",
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                    lineHeight: 1,
                    color: "#ffffff",
                    marginBottom: "12px",
                  })}
                >
                  {member.name}
                </h3>
                <p
                  style={f({
                    fontWeight: 700,
                    fontSize: "13px",
                    color: "#ffffff",
                    marginBottom: "24px",
                  })}
                >
                  {member.role}
                </p>
                {member.bio.split("\n\n").map((paragraph, i) => (
                  <p
                    key={i}
                    style={f({
                      fontWeight: 400,
                      fontSize: "14px",
                      color: "rgba(255,255,255,0.85)",
                      lineHeight: 1.75,
                      marginBottom: "16px",
                    })}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Final CTA */}
      <section
        style={{
          padding: "120px 80px 160px",
          textAlign: "center",
        }}
      >
        <h2
          style={f({
            fontWeight: 900,
            fontSize: "clamp(32px, 5vw, 56px)",
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            color: "#ffffff",
            margin: "0 auto 48px",
          })}
        >
          Get down to work with the team who&rsquo;s as passionate about telling your brand&rsquo;s story as you are about living it.
        </h2>
        <CTAButton href="/contact" label="Work With Us" />
      </section>

      <Footer />
    </div>
  );
}
