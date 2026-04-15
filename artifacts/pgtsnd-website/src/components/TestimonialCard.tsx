interface TestimonialCardProps {
  quote: string;
  author: string;
  avatarSrc: string;
  avatarAlt?: string;
}

export default function TestimonialCard({
  quote,
  author,
  avatarSrc,
  avatarAlt,
}: TestimonialCardProps) {
  return (
    <div
      style={{
        position: "relative",
        background: "#000000",
        border: "1px solid rgba(255,255,255,0.2)",
        padding: "40px 32px 32px",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-30px",
          left: "32px",
        }}
      >
        <img
          src={avatarSrc}
          alt={avatarAlt || author}
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            objectFit: "cover",
            border: "3px solid rgba(255,255,255,0.25)",
          }}
        />
      </div>
      <blockquote
        style={{
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 400,
          fontSize: "15px",
          lineHeight: 1.75,
          color: "rgba(255,255,255,0.85)",
          marginTop: "4px",
          marginBottom: "20px",
        }}
      >
        {quote}
      </blockquote>
      <p
        style={{
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 700,
          fontSize: "14px",
          color: "#ffffff",
        }}
      >
        {author}
      </p>
    </div>
  );
}
