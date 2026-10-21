import { useEffect, useRef, useState } from "react";

const buttonStyle: React.CSSProperties = { padding: "8px 14px", fontSize: "1rem", marginTop: 8 };

/**
 * Živé skenovanie QR kódu dokladu z kamery (offline). Keď kód rozpozná, zavolá onFound s jeho textom
 * a kameru vypne. Kameru sa nedá spustiť bez povolenia; vtedy ostáva fotka ako záloha.
 */
export function ReceiptCamera({ onFound, onClose }: { onFound: (text: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onFoundRef = useRef(onFound);
  onFoundRef.current = onFound;
  const [status, setStatus] = useState("Spúšťam kameru…");

  useEffect(() => {
    let stream: MediaStream | null = null;
    let frame = 0;
    let stopped = false;
    let lastScan = 0;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });

    const stop = () => {
      stopped = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((t) => t.stop());
    };

    (async () => {
      try {
        const { default: jsQR } = await import("jsqr");
        const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        if (stopped) {
          media.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = media;
        const video = videoRef.current;
        if (!video || !context) return stop();
        video.srcObject = stream;
        await video.play();
        setStatus("Namierte kameru na QR kód dokladu.");

        const tick = (now: number) => {
          if (stopped) return;
          // Snímky sa skenujú najviac každých 150 ms, aby sa telefón neprehrieval.
          if (video.readyState >= 2 && now - lastScan > 150) {
            lastScan = now;
            const scale = Math.min(1, 1000 / Math.max(video.videoWidth, video.videoHeight));
            canvas.width = Math.round(video.videoWidth * scale);
            canvas.height = Math.round(video.videoHeight * scale);
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(pixels.data, pixels.width, pixels.height);
            if (code) {
              stop();
              onFoundRef.current(code.data);
              return;
            }
          }
          frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      } catch {
        setStatus("Kameru sa nepodarilo spustiť. Povoľte prístup ku kamere v prehliadači alebo použite fotku QR kódu.");
      }
    })();

    return stop;
  }, []);

  return (
    <div style={{ border: "1px solid var(--border-strong)", padding: 12, borderRadius: 6, background: "var(--surface)", margin: "8px 0" }}>
      <video ref={videoRef} playsInline muted aria-label="Živý náhľad kamery" style={{ width: "100%", borderRadius: 6, background: "#000" }} />
      <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{status}</p>
      <button type="button" onClick={onClose} style={buttonStyle}>Zrušiť</button>
    </div>
  );
}
