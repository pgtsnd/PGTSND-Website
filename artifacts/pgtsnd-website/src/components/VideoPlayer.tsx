import { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "./ThemeContext";

interface CommentMarker {
  id: string;
  timestampSeconds: number;
}

interface VideoPlayerProps {
  src: string;
  markers?: CommentMarker[];
  onTimeClick?: (seconds: number) => void;
  onMarkerClick?: (id: string) => void;
  currentTime?: number;
  seekTo?: number | null;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VideoPlayer({
  src,
  markers = [],
  onTimeClick,
  onMarkerClick,
  seekTo,
}: VideoPlayerProps) {
  const { t } = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeout = useRef<number | null>(null);

  useEffect(() => {
    if (seekTo !== null && seekTo !== undefined && videoRef.current) {
      videoRef.current.currentTime = seekTo;
      setCurrentTime(seekTo);
    }
  }, [seekTo]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const bar = progressRef.current;
      const video = videoRef.current;
      if (!bar || !video) return;
      const rect = bar.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));
      video.currentTime = ratio * duration;
      setCurrentTime(video.currentTime);
    },
    [duration],
  );

  const handleSpeedChange = useCallback((rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
    setShowSpeedMenu(false);
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = videoRef.current?.parentElement?.parentElement;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = window.setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  }, [isPlaying]);

  const handleAddComment = useCallback(() => {
    if (onTimeClick && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
      onTimeClick(videoRef.current.currentTime);
    }
  }, [onTimeClick]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div
      style={{ position: "relative", background: "#000", borderRadius: "10px", overflow: "hidden" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onClick={togglePlay}
        style={{ width: "100%", display: "block", cursor: "pointer" }}
      />

      {!isPlaying && currentTime === 0 && (
        <div
          onClick={togglePlay}
          style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.3)", cursor: "pointer",
          }}
        >
          <div style={{
            width: "64px", height: "64px", borderRadius: "50%",
            background: "rgba(255,255,255,0.9)", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#000">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>
      )}

      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
        padding: "32px 16px 12px",
        opacity: showControls ? 1 : 0,
        transition: "opacity 0.3s",
      }}>
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          style={{
            position: "relative", height: "6px", background: "rgba(255,255,255,0.2)",
            borderRadius: "3px", cursor: "pointer", marginBottom: "10px",
          }}
        >
          <div style={{
            height: "100%", width: `${progress}%`,
            background: "#fff", borderRadius: "3px",
            transition: "width 0.1s linear",
          }} />
          <div style={{
            position: "absolute", top: "50%", left: `${progress}%`,
            transform: "translate(-50%, -50%)",
            width: "14px", height: "14px", borderRadius: "50%",
            background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
          }} />
          {markers.map((marker) => {
            const pos = duration > 0 ? (marker.timestampSeconds / duration) * 100 : 0;
            return (
              <div
                key={marker.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkerClick?.(marker.id);
                }}
                title={formatTime(marker.timestampSeconds)}
                style={{
                  position: "absolute", top: "-3px",
                  left: `${pos}%`, transform: "translateX(-50%)",
                  width: "4px", height: "12px", borderRadius: "2px",
                  background: "rgba(255,200,60,0.9)", cursor: "pointer",
                }}
              />
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={togglePlay} style={{
              background: "none", border: "none", cursor: "pointer", padding: "4px",
              display: "flex", alignItems: "center",
            }}>
              {isPlaying ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>

            <button onClick={toggleMute} style={{
              background: "none", border: "none", cursor: "pointer", padding: "4px",
              display: "flex", alignItems: "center",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                {isMuted ? (
                  <>
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </>
                ) : (
                  <>
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </>
                )}
              </svg>
            </button>

            <span style={{
              fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "11px",
              color: "rgba(255,255,255,0.8)", fontVariantNumeric: "tabular-nums",
            }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {onTimeClick && (
              <button
                onClick={handleAddComment}
                title="Add comment at current time"
                style={{
                  background: "rgba(255,200,60,0.9)", border: "none", borderRadius: "4px",
                  padding: "4px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px",
                  fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "10px",
                  color: "#000",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Comment
              </button>
            )}

            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                style={{
                  background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "4px",
                  padding: "4px 8px", cursor: "pointer",
                  fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "10px",
                  color: "#fff",
                }}
              >
                {playbackRate}x
              </button>
              {showSpeedMenu && (
                <div style={{
                  position: "absolute", bottom: "28px", right: 0,
                  background: "rgba(30,30,30,0.95)", borderRadius: "6px",
                  padding: "4px 0", minWidth: "60px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                }}>
                  {speeds.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSpeedChange(s)}
                      style={{
                        display: "block", width: "100%", background: s === playbackRate ? "rgba(255,255,255,0.1)" : "none",
                        border: "none", padding: "6px 12px", cursor: "pointer",
                        fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "11px",
                        color: s === playbackRate ? "#fff" : "rgba(255,255,255,0.7)",
                        textAlign: "center",
                      }}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={toggleFullscreen} style={{
              background: "none", border: "none", cursor: "pointer", padding: "4px",
              display: "flex", alignItems: "center",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                {isFullscreen ? (
                  <>
                    <polyline points="4 14 10 14 10 20" />
                    <polyline points="20 10 14 10 14 4" />
                    <line x1="14" y1="10" x2="21" y2="3" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </>
                ) : (
                  <>
                    <polyline points="15 3 21 3 21 9" />
                    <polyline points="9 21 3 21 3 15" />
                    <line x1="21" y1="3" x2="14" y2="10" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { formatTime };
