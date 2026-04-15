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
        border: "2px solid #ffffff",
        padding: "48px 40px 40px",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-32px",
          left: "36px",
        }}
      >
        <img
          src={avatarSrc}
          alt={avatarAlt || author}
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            objectFit: "cover",
            border: "none",
          }}
        />
      </div>
      <blockquote
        style={{
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 400,
          fontSize: "16px",
          lineHeight: 1.75,
          color: "rgba(255,255,255,0.85)",
          marginTop: "8px",
          marginBottom: "24px",
        }}
      >
        &ldquo;{quote}&rdquo;
      </blockquote>
      <p
        style={{
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 700,
          fontSize: "15px",
          color: "#ffffff",
        }}
      >
        {author}
      </p>
    </div>
  );
}
