import { useEffect, useRef, useState } from "react";
import { useTheme } from "./ThemeContext";

interface CompareDiffStripProps {
  srcA: string;
  srcB: string;
  labelA?: string;
  labelB?: string;
  samples?: number;
  onSeek?: (seconds: number) => void;
}

const THUMB_W = 96;
const THUMB_H = 54;
const DIFF_THRESHOLD = 0.06;

interface FrameData {
  thumbUrl: string | null;
  diff: number;
  time: number;
}

function seekVideo(v: HTMLVideoElement, t: number): Promise<void> {
  return new Promise((resolve) => {
    const handler = () => {
      v.removeEventListener("seeked", handler);
      resolve();
    };
    v.addEventListener("seeked", handler);
    try {
      v.currentTime = t;
    } catch {
      v.removeEventListener("seeked", handler);
      resolve();
    }
  });
}

function waitForMetadata(v: HTMLVideoElement): Promise<void> {
  return new Promise((resolve, reject) => {
    if (v.readyState >= 1 && isFinite(v.duration) && v.duration > 0) {
      resolve();
      return;
    }
    const onMeta = () => {
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("error", onErr);
      resolve();
    };
    const onErr = () => {
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("error", onErr);
      reject(new Error("metadata load failed"));
    };
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("error", onErr);
  });
}

function computeDiff(a: ImageData, b: ImageData): number {
  const da = a.data;
  const db = b.data;
  let sum = 0;
  let count = 0;
  // Sample every 4th pixel to keep this cheap.
  for (let i = 0; i < da.length; i += 16) {
    sum += Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]);
    count += 1;
  }
  if (count === 0) return 0;
  return sum / (count * 3 * 255);
}

export default function CompareDiffStrip({
  srcA,
  srcB,
  labelA = "A",
  labelB = "B",
  samples = 24,
  onSeek,
}: CompareDiffStripProps) {
  const { t } = useTheme();
  const [framesA, setFramesA] = useState<FrameData[]>([]);
  const [framesB, setFramesB] = useState<FrameData[]>([]);
  const [diffAvailable, setDiffAvailable] = useState(true);
  const [progress, setProgress] = useState(0);
  const [errored, setErrored] = useState(false);
  const cancelRef = useRef(false);

  useEffect(() => {
    cancelRef.current = false;
    setFramesA([]);
    setFramesB([]);
    setDiffAvailable(true);
    setProgress(0);
    setErrored(false);

    const va = document.createElement("video");
    const vb = document.createElement("video");
    va.crossOrigin = "anonymous";
    vb.crossOrigin = "anonymous";
    va.muted = true;
    vb.muted = true;
    va.preload = "auto";
    va.playsInline = true;
    vb.preload = "auto";
    vb.playsInline = true;
    va.src = srcA;
    vb.src = srcB;

    const run = async () => {
      try {
        await Promise.all([waitForMetadata(va), waitForMetadata(vb)]);
      } catch {
        if (!cancelRef.current) setErrored(true);
        return;
      }
      if (cancelRef.current) return;
      const dur = Math.min(
        isFinite(va.duration) ? va.duration : 0,
        isFinite(vb.duration) ? vb.duration : 0,
      );
      if (!dur || dur <= 0) {
        setErrored(true);
        return;
      }
      const canvasA = document.createElement("canvas");
      canvasA.width = THUMB_W;
      canvasA.height = THUMB_H;
      const canvasB = document.createElement("canvas");
      canvasB.width = THUMB_W;
      canvasB.height = THUMB_H;
      const ctxA = canvasA.getContext("2d", { willReadFrequently: true });
      const ctxB = canvasB.getContext("2d", { willReadFrequently: true });
      if (!ctxA || !ctxB) {
        setErrored(true);
        return;
      }

      const accA: FrameData[] = [];
      const accB: FrameData[] = [];
      let canRead = true;

      for (let i = 0; i < samples; i++) {
        if (cancelRef.current) return;
        const ts = ((i + 0.5) * dur) / samples;
        try {
          await Promise.all([seekVideo(va, ts), seekVideo(vb, ts)]);
        } catch {
          // continue with whatever we have
        }
        if (cancelRef.current) return;
        try {
          ctxA.drawImage(va, 0, 0, THUMB_W, THUMB_H);
          ctxB.drawImage(vb, 0, 0, THUMB_W, THUMB_H);
        } catch {
          // drawImage shouldn't throw for same-origin video, but guard anyway
        }
        let urlA: string | null = null;
        let urlB: string | null = null;
        let diff = -1;
        if (canRead) {
          try {
            const dataA = ctxA.getImageData(0, 0, THUMB_W, THUMB_H);
            const dataB = ctxB.getImageData(0, 0, THUMB_W, THUMB_H);
            diff = computeDiff(dataA, dataB);
            urlA = canvasA.toDataURL("image/jpeg", 0.5);
            urlB = canvasB.toDataURL("image/jpeg", 0.5);
          } catch {
            canRead = false;
            setDiffAvailable(false);
          }
        }
        accA.push({ thumbUrl: urlA, diff, time: ts });
        accB.push({ thumbUrl: urlB, diff, time: ts });
        if (cancelRef.current) return;
        setFramesA([...accA]);
        setFramesB([...accB]);
        setProgress(((i + 1) / samples) * 100);
      }
    };

    void run();

    return () => {
      cancelRef.current = true;
      va.removeAttribute("src");
      vb.removeAttribute("src");
      try {
        va.load();
        vb.load();
      } catch {
        /* noop */
      }
    };
  }, [srcA, srcB, samples]);

  const ff = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  const renderStrip = (frames: FrameData[], label: string) => (
    <div data-testid={`compare-diff-strip-${label.toLowerCase()}`} style={{ marginTop: "8px" }}>
      <div
        style={ff({
          fontWeight: 700,
          fontSize: "9px",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: t.textMuted,
          marginBottom: "4px",
        })}
      >
        {label} timeline
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${samples}, 1fr)`,
          gap: "2px",
          background: t.bgCard,
          border: `1px solid ${t.border}`,
          borderRadius: "6px",
          padding: "4px",
        }}
      >
        {Array.from({ length: samples }).map((_, i) => {
          const f = frames[i];
          const hasDiff = f && f.diff >= 0;
          const differs = hasDiff && f.diff > DIFF_THRESHOLD;
          const inSync = hasDiff && f.diff <= DIFF_THRESHOLD;
          const accentDiffers = "rgba(255,140,60,0.95)";
          const accentSync = "rgba(96,208,96,0.6)";
          const topBar = differs ? accentDiffers : inSync ? accentSync : "transparent";
          return (
            <button
              key={i}
              type="button"
              data-testid={`compare-diff-cell-${label.toLowerCase()}-${i}`}
              data-differs={differs ? "true" : "false"}
              onClick={() => f && onSeek?.(f.time)}
              title={
                f
                  ? `${formatT(f.time)}${
                      hasDiff ? ` · ${differs ? "differs" : "in sync"}` : ""
                    }`
                  : "loading…"
              }
              style={{
                position: "relative",
                aspectRatio: `${THUMB_W} / ${THUMB_H}`,
                background: f?.thumbUrl
                  ? `url(${f.thumbUrl}) center/cover no-repeat`
                  : t.hoverBg,
                border: differs
                  ? `1px solid ${accentDiffers}`
                  : `1px solid ${t.borderSubtle}`,
                borderRadius: "3px",
                cursor: f ? "pointer" : "default",
                padding: 0,
                overflow: "hidden",
                boxShadow: differs ? `0 0 0 1px ${accentDiffers} inset` : "none",
              }}
            >
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "3px",
                  background: topBar,
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div data-testid="compare-diff-strips">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "10px",
          marginBottom: "2px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={ff({
              fontWeight: 700,
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: t.textMuted,
            })}
          >
            Scene differences
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Legend color="rgba(255,140,60,0.95)" label="Differs" />
            <Legend color="rgba(96,208,96,0.6)" label="In sync" />
          </span>
        </div>
        {progress < 100 && !errored && (
          <span style={ff({ fontWeight: 500, fontSize: "10px", color: t.textMuted })}>
            Analyzing… {Math.round(progress)}%
          </span>
        )}
        {!diffAvailable && !errored && progress >= 100 && (
          <span
            data-testid="compare-diff-unavailable"
            style={ff({ fontWeight: 500, fontSize: "10px", color: t.textMuted })}
          >
            Diff unavailable (cross-origin video)
          </span>
        )}
        {errored && (
          <span style={ff({ fontWeight: 500, fontSize: "10px", color: t.textMuted })}>
            Couldn't analyze frames
          </span>
        )}
      </div>
      {!errored && (
        <>
          {renderStrip(framesA, labelA)}
          {renderStrip(framesB, labelB)}
        </>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  const { t } = useTheme();
  const ff = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
      <span
        style={{
          width: "10px",
          height: "4px",
          borderRadius: "2px",
          background: color,
          display: "inline-block",
        }}
      />
      <span style={ff({ fontWeight: 500, fontSize: "10px", color: t.textMuted })}>
        {label}
      </span>
    </span>
  );
}

function formatT(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
