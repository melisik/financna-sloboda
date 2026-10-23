import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

// Falošná kamera pre E2E (Chromium číta video zo súboru Y4M). Syntetický EAN-13, generuje sa pri behe testov (D-233).
const L = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"];
const G = ["0100111", "0110011", "0011011", "0100001", "0011101", "0111001", "0000101", "0010001", "0001001", "0010111"];
const R = ["1110010", "1100110", "1101100", "1000010", "1011100", "1001110", "1010000", "1000100", "1001000", "1110100"];
const PARITY = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"];

export function ean13Bits(code: string): string {
  const d = code.split("").map(Number);
  let bits = "101";
  PARITY[d[0]].split("").forEach((p, i) => {
    bits += (p === "L" ? L : G)[d[i + 1]];
  });
  bits += "01010";
  for (let i = 7; i < 13; i++) bits += R[d[i]];
  return bits + "101";
}

/** Zapíše video Y4M (640×480), na ktorom je čiarový kód; vráti cestu k súboru. */
export function writeCameraFixture(file: string, code: string): string {
  const W = 640;
  const H = 480;
  const FRAMES = 30;
  const bits = ean13Bits(code);
  const module = 4;
  const quiet = 10;
  const barWidth = (bits.length + 2 * quiet) * module;
  const x0 = Math.floor((W - barWidth) / 2) + quiet * module;
  const y = Buffer.alloc(W * H, 255);
  for (let i = 0; i < bits.length; i++) {
    if (bits[i] !== "1") continue;
    for (let dx = 0; dx < module; dx++) {
      for (let row = 140; row < 340; row++) y[row * W + x0 + i * module + dx] = 0;
    }
  }
  const chroma = Buffer.alloc((W / 2) * (H / 2), 128);
  const frame = Buffer.concat([Buffer.from("FRAME\n"), y, chroma, chroma]);
  const header = Buffer.from(`YUV4MPEG2 W${W} H${H} F15:1 Ip A1:1 C420jpeg\n`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, Buffer.concat([header, ...Array(FRAMES).fill(frame)]));
  return file;
}
