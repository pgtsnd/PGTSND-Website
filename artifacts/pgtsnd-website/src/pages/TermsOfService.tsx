import { Link } from "wouter";
import Footer from "../components/Footer";

const f = (s: React.CSSProperties): React.CSSProperties => ({ fontFamily: "'Montserrat', sans-serif", ...s });

const p = (text: string, mb = "16px") => (
  <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: mb })}>
    {text}
  </p>
);

export default function TermsOfService() {
  return (
    <div style={{ background: "#000000", minHeight: "100vh" }}>
      <section
        style={{
          padding: "160px 80px 120px",
          display: "grid",
          gridTemplateColumns: "2fr 3fr",
          gap: "120px",
          alignItems: "start",
        }}
      >
        <h1
          style={f({
            fontWeight: 900,
            fontSize: "clamp(36px, 5vw, 60px)",
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
            lineHeight: 0.95,
            color: "#ffffff",
          })}
        >
          Terms &amp; Conditions.
        </h1>

        <div>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "24px" })}>
            <strong style={{ color: "#ffffff" }}>Last updated:</strong> October 20, 2025
          </p>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "16px" })}>
            Welcome to the PGTSND Productions website (&ldquo;Site&rdquo;). This Site is operated by PGTSND Productions LLC (&ldquo;PGTSND,&rdquo; &ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;), located in Seattle, Washington.
          </p>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "48px" })}>
            By accessing or using our Site, you agree to comply with and be bound by these Terms and Conditions (&ldquo;Terms&rdquo;). If you do not agree with these Terms, please do not use our Site.
          </p>

          <h2 style={f({ fontWeight: 900, fontSize: "clamp(24px, 3vw, 36px)", textTransform: "uppercase", letterSpacing: "-0.01em", lineHeight: 1.1, color: "#ffffff", marginBottom: "24px" })}>
            1. Use of the Site
          </h2>
          {p("You agree to use this Site only for lawful purposes and in accordance with these Terms.")}
          {p("You may not:")}
          <ul style={{ paddingLeft: "24px", marginBottom: "24px" }}>
            {[
              "Copy, distribute, or modify any part of this Site without prior written permission from PGTSND Productions.",
              "Use this Site to engage in any activity that could damage, disable, or impair the Site or interfere with other users\u2019 access.",
              "Attempt to gain unauthorized access to any portion of the Site, server, or network connected to it.",
            ].map((item) => (
              <li key={item} style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 2 })}>
                {item}
              </li>
            ))}
          </ul>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "48px" })}>
            The content on this Site is intended for general informational purposes regarding our services, portfolio, and company background.
          </p>

          <h2 style={f({ fontWeight: 900, fontSize: "clamp(24px, 3vw, 36px)", textTransform: "uppercase", letterSpacing: "-0.01em", lineHeight: 1.1, color: "#ffffff", marginBottom: "24px" })}>
            2. Intellectual Property Rights
          </h2>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "16px" })}>
            All text, photos, video, graphics, design elements, trademarks, logos, and other materials on this Site are the property of PGTSND Productions, our clients or used under license.
          </p>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "48px" })}>
            You may not reproduce, republish, or transmit any content from this Site without prior written consent. Any unauthorized use may violate copyright, trademark, or other laws.
          </p>

          <h2 style={f({ fontWeight: 900, fontSize: "clamp(24px, 3vw, 36px)", textTransform: "uppercase", letterSpacing: "-0.01em", lineHeight: 1.1, color: "#ffffff", marginBottom: "24px" })}>
            3. Services and Proposals
          </h2>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "16px" })}>
            PGTSND Productions provides creative and strategic services, including photography, videography, audio production, studio rental, and consulting.
          </p>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "16px" })}>
            All services are governed by written agreements or proposals specific to each project. Those agreements supersede any general descriptions found on this Site.
          </p>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "48px" })}>
            We reserve the right to change or discontinue any service or pricing without prior notice.
          </p>

          <h2 style={f({ fontWeight: 900, fontSize: "clamp(24px, 3vw, 36px)", textTransform: "uppercase", letterSpacing: "-0.01em", lineHeight: 1.1, color: "#ffffff", marginBottom: "24px" })}>
            4. Third-Party Links
          </h2>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "16px" })}>
            Our Site may include links to third-party websites for your convenience.
          </p>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "48px" })}>
            We do not control, endorse, or assume responsibility for any third-party sites, their content, or their privacy practices. Accessing those websites is at your own risk.
          </p>

          <h2 style={f({ fontWeight: 900, fontSize: "clamp(24px, 3vw, 36px)", textTransform: "uppercase", letterSpacing: "-0.01em", lineHeight: 1.1, color: "#ffffff", marginBottom: "24px" })}>
            5. Limitation of Liability
          </h2>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "16px" })}>
            To the fullest extent permitted by law, PGTSND Productions is not liable for any direct, indirect, incidental, or consequential damages arising out of your use of&mdash;or inability to use&mdash;this Site or any content provided herein.
          </p>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "48px" })}>
            We make no representations or warranties about the accuracy, completeness, or reliability of the Site&rsquo;s content.
          </p>

          <h2 style={f({ fontWeight: 900, fontSize: "clamp(24px, 3vw, 36px)", textTransform: "uppercase", letterSpacing: "-0.01em", lineHeight: 1.1, color: "#ffffff", marginBottom: "24px" })}>
            6. Disclaimer
          </h2>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "16px" })}>
            This Site and all information contained on it are provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis.
          </p>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "48px" })}>
            PGTSND Productions makes no warranties, express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement.
          </p>

          <h2 style={f({ fontWeight: 900, fontSize: "clamp(24px, 3vw, 36px)", textTransform: "uppercase", letterSpacing: "-0.01em", lineHeight: 1.1, color: "#ffffff", marginBottom: "24px" })}>
            7. Privacy
          </h2>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "48px" })}>
            Your privacy is important to us. Please review our <Link href="/privacy-policy" style={{ color: "#ffffff", textDecoration: "underline" }}>Privacy Policy</Link> for details about how we collect, use, and protect your personal information.
          </p>

          <h2 style={f({ fontWeight: 900, fontSize: "clamp(24px, 3vw, 36px)", textTransform: "uppercase", letterSpacing: "-0.01em", lineHeight: 1.1, color: "#ffffff", marginBottom: "24px" })}>
            8. Indemnification
          </h2>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "48px" })}>
            You agree to indemnify, defend, and hold harmless PGTSND Productions, its employees, contractors, and affiliates from and against any claims, damages, liabilities, or expenses arising out of your use of this Site or violation of these Terms.
          </p>

          <h2 style={f({ fontWeight: 900, fontSize: "clamp(24px, 3vw, 36px)", textTransform: "uppercase", letterSpacing: "-0.01em", lineHeight: 1.1, color: "#ffffff", marginBottom: "24px" })}>
            9. Governing Law
          </h2>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "16px" })}>
            These Terms are governed by and construed in accordance with the laws of the State of Washington, without regard to conflict of law provisions.
          </p>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "48px" })}>
            Any legal action arising from these Terms shall be brought exclusively in the courts located in King County, Washington.
          </p>

          <h2 style={f({ fontWeight: 900, fontSize: "clamp(24px, 3vw, 36px)", textTransform: "uppercase", letterSpacing: "-0.01em", lineHeight: 1.1, color: "#ffffff", marginBottom: "24px" })}>
            10. Changes to These Terms
          </h2>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "48px" })}>
            We may update these Terms from time to time. The updated version will be posted on this page with a revised &ldquo;last updated&rdquo; date. Continued use of the Site after changes are made constitutes your acceptance of the new Terms.
          </p>

          <h2 style={f({ fontWeight: 900, fontSize: "clamp(24px, 3vw, 36px)", textTransform: "uppercase", letterSpacing: "-0.01em", lineHeight: 1.1, color: "#ffffff", marginBottom: "24px" })}>
            11. Contact Information
          </h2>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "8px" })}>
            For any questions about these Terms and Conditions, please contact us:
          </p>
          <p style={f({ fontWeight: 600, fontSize: "15px", color: "#ffffff", lineHeight: 1.8, marginBottom: "16px" })}>
            hello@pgtsndproductions.com
          </p>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.7)", lineHeight: 1.8 })}>
            PGTSND Productions LLC
            <br />
            Seattle, Washington
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
