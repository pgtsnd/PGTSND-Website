interface VideoPlaceholderProps {
  imageSrc: string;
  imageAlt?: string;
  aspectRatio?: string;
}

export default function VideoPlaceholder({
  imageSrc,
  imageAlt = "Video thumbnail",
  aspectRatio = "16 / 9",
}: VideoPlaceholderProps) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio,
        overflow: "hidden",
        cursor: "pointer",
      }}
    >
      <img
        src={imageSrc}
        alt={imageAlt}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0,0,0,0.15)",
          transition: "background 0.3s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.background =
            "rgba(0,0,0,0.3)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.background =
            "rgba(0,0,0,0.15)";
        }}
      >
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.9)",
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M8 5.14v13.72a1 1 0 001.5.86l11.04-6.86a1 1 0 000-1.72L9.5 4.28A1 1 0 008 5.14z" fill="#fff" />
          </svg>
        </div>
      </div>
    </div>
  );
}
