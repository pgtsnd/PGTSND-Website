import Footer from "../components/Footer";

const f = (s: React.CSSProperties): React.CSSProperties => ({ fontFamily: "'Montserrat', sans-serif", ...s });

export default function PrivacyPolicy() {
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
          Privacy Policy.
        </h1>

        <div>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "24px" })}>
            PGTSND Productions LLC (&ldquo;PGTSND,&rdquo; &ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) respects your privacy and is committed to protecting your personal information.
          </p>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "24px" })}>
            This Privacy Policy explains what information we collect, how we use it, and how we keep it secure when you visit our website or contact us about our services.
          </p>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "48px" })}>
            By using this website, you agree to the terms of this Privacy Policy.
          </p>

          <h2 style={f({ fontWeight: 900, fontSize: "clamp(24px, 3vw, 36px)", textTransform: "uppercase", letterSpacing: "-0.01em", lineHeight: 1.1, color: "#ffffff", marginBottom: "24px" })}>
            How We Use Your Information
          </h2>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "16px" })}>
            We only collect personal information that you voluntarily provide when you contact us through our website, email, or other direct communication. This may include:
          </p>
          <ul style={{ paddingLeft: "24px", marginBottom: "24px" }}>
            {["Name", "Email address", "Phone number (if provided)", "Message content"].map((item) => (
              <li key={item} style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 2 })}>
                {item}
              </li>
            ))}
          </ul>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "16px" })}>
            We do not automatically collect sensitive personal information, payment details, or any data unrelated to service inquiries.
          </p>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "16px" })}>
            We use the information you provide solely to:
          </p>
          <ul style={{ paddingLeft: "24px", marginBottom: "24px" }}>
            {[
              "Respond to your inquiries or requests for services",
              "Provide project quotes or proposals",
              "Communicate about ongoing or future projects",
            ].map((item) => (
              <li key={item} style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 2 })}>
                {item}
              </li>
            ))}
          </ul>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "24px" })}>
            We do not sell, rent, or share your personal information with third parties for marketing or advertising purposes.
          </p>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "24px" })}>
            We take reasonable administrative and technical measures to protect your personal information from unauthorized access, disclosure, or misuse. Your contact information is stored securely and is only accessible to authorized PGTSND team members for legitimate business purposes.
          </p>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "24px" })}>
            If you contact us, we may respond via the email address you provided.
          </p>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "48px" })}>
            We do not send marketing newsletters or promotional emails unless you have explicitly requested to receive them. You can request to be removed from any communication at any time by contacting us directly.
          </p>

          <h2 style={f({ fontWeight: 900, fontSize: "clamp(24px, 3vw, 36px)", textTransform: "uppercase", letterSpacing: "-0.01em", lineHeight: 1.1, color: "#ffffff", marginBottom: "24px" })}>
            Cookies &amp; Analytics
          </h2>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "16px" })}>
            Our website may use basic analytics tools (such as Google Analytics) to understand overall site performance and traffic patterns.
          </p>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "16px" })}>
            These tools collect anonymous, aggregated data such as page views, time on site, and referral sources.
          </p>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "48px" })}>
            No personally identifiable information is collected through cookies or analytics.
          </p>

          <h2 style={f({ fontWeight: 900, fontSize: "clamp(24px, 3vw, 36px)", textTransform: "uppercase", letterSpacing: "-0.01em", lineHeight: 1.1, color: "#ffffff", marginBottom: "24px" })}>
            SMS Communication &amp; Consent
          </h2>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "16px" })}>
            By providing your phone number and opting in to receive text messages, you consent to receive SMS communications from PGTSND Productions related to your service requests, appointments, and inquiries, including follow-up messages if your call is missed.
          </p>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "16px" })}>
            Message frequency varies. Message and data rates may apply.
          </p>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "16px" })}>
            You can reply STOP at any time to opt out of further messaging. Reply HELP for assistance.
          </p>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "48px" })}>
            Your mobile information will not be shared, sold, or disclosed to third parties for marketing or promotional purposes. We only use your information to provide and support our services.
          </p>

          <h2 style={f({ fontWeight: 900, fontSize: "clamp(24px, 3vw, 36px)", textTransform: "uppercase", letterSpacing: "-0.01em", lineHeight: 1.1, color: "#ffffff", marginBottom: "24px" })}>
            Your Information &amp; Rights
          </h2>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "16px" })}>
            We may share your information only when necessary to:
          </p>
          <ul style={{ paddingLeft: "24px", marginBottom: "24px" }}>
            {[
              "Comply with a legal obligation",
              "Protect the rights, property, or safety of PGTSND Productions, our clients, or others",
            ].map((item) => (
              <li key={item} style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 2 })}>
                {item}
              </li>
            ))}
          </ul>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "16px" })}>
            We do not sell or disclose personal information to third parties for commercial purposes.
          </p>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "16px" })}>
            You have the right to:
          </p>
          <ul style={{ paddingLeft: "24px", marginBottom: "48px" }}>
            {[
              "Request access to the personal information we hold about you",
              "Request correction or deletion of your information",
              "Withdraw consent to our use of your information at any time",
            ].map((item) => (
              <li key={item} style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 2 })}>
                {item}
              </li>
            ))}
          </ul>

          <h2 style={f({ fontWeight: 900, fontSize: "clamp(24px, 3vw, 36px)", textTransform: "uppercase", letterSpacing: "-0.01em", lineHeight: 1.1, color: "#ffffff", marginBottom: "24px" })}>
            Links
          </h2>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "48px" })}>
            Our website may include links to external websites. We are not responsible for the content or privacy practices of those sites. We encourage you to review the privacy policies of any third-party sites you visit.
          </p>

          <h2 style={f({ fontWeight: 900, fontSize: "clamp(24px, 3vw, 36px)", textTransform: "uppercase", letterSpacing: "-0.01em", lineHeight: 1.1, color: "#ffffff", marginBottom: "24px" })}>
            Changes to This Policy
          </h2>
          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "48px" })}>
            We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. Updates will be posted on this page with a revised &ldquo;last updated&rdquo; date.
          </p>

          <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "8px" })}>
            If you have questions about this Privacy Policy or our data practices, please contact us:
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
