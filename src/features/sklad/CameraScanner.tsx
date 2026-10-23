import { useEffect, useRef, useState } from "react";
import type { BrowserMultiFormatReader } from "@zxing/library";
import { isValidBarcode } from "../../domain/stock";
import { btn } from "../../ui/kit/controls";
import { createBarcodeReader } from "./barcode";

/** Hlásenie, keď kamera nejde. Mimo HTTPS (aj na adrese z lokálnej siete) prehliadač kameru vôbec nesprístupní. */
function cameraError(): string {
  if (!window.isSecureContext || !navigator.mediaDevices) {
    return "Kamera funguje len cez HTTPS alebo na localhoste. Na tejto adrese nie je dostupná. Použi fotku obalu.";
  }
  return "Kamera nie je dostupná. Povoľ ju v prehliadači alebo použi fotku obalu.";
}

/** Skenovanie čiarového kódu živou kamerou (D-233): offline, zadná kamera, bez fotky. */
export function CameraScanner({ onFound, onCancel }: { onFound: (code: string) => void; onCancel: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onFoundRef = useRef(onFound);
  const [msg, setMsg] = useState("Zapínam kameru…");

  useEffect(() => {
    onFoundRef.current = onFound;
  });

  useEffect(() => {
    let alive = true;
    let stream: MediaStream | undefined;
    let reader: BrowserMultiFormatReader | undefined;
    const video = videoRef.current;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (!alive || !video) return;
        video.srcObject = stream;
        // Čítanie treba spustiť pred prehrávaním: knižnica čaká na udalosť načítania videa, ktorá by sa inak zmeškala.
        reader = createBarcodeReader();
        // Čítanie beží, kým nepríde platný kód; neplatný len zobrazí hlásenie a pokus pokračuje (A-17).
        let found = false;
        const decoding = reader.decodeFromVideoElementContinuously(video, (result) => {
          if (!alive || found || !result) return;
          const text = result.getText();
          if (isValidBarcode(text)) {
            found = true;
            onFoundRef.current(text);
          } else {
            setMsg("Kód nie je platný. Namier kameru znova.");
          }
        });
        void video.play().catch(() => undefined);
        setMsg("Namier kameru na čiarový kód.");
        await decoding;
      } catch {
        if (alive) setMsg(cameraError());
      }
    })();
    return () => {
      alive = false;
      reader?.reset();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div style={{ border: "1px solid var(--border-strong)", padding: 8, borderRadius: 6, margin: "8px 0" }}>
      <video ref={videoRef} autoPlay playsInline muted aria-label="Kamera na čiarový kód" style={{ width: "100%", maxHeight: 320, background: "#000" }} />
      <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: "4px 0" }}>{msg}</p>
      <button onClick={onCancel} style={btn}>Zrušiť</button>
    </div>
  );
}
