import type { Attachment, AttachmentRecord } from "./types";

/** Prevod prílohy na base64 pre zálohu a späť (D-160). Čisté funkcie, bez úložiska. */
export async function encodeAttachment(a: Attachment): Promise<AttachmentRecord> {
  const bytes = new Uint8Array(await a.data.arrayBuffer());
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  const { data: _data, ...meta } = a;
  return { ...meta, dataBase64: btoa(bin) };
}

/** Prevod z base64 späť na Blob. Pri neplatnom base64 vyhodí výnimku (volajúci ju zachytí). */
export function decodeAttachmentRecord(r: AttachmentRecord): Attachment {
  const bin = atob(r.dataBase64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  // Deklarovaná veľkosť musí zodpovedať obsahu; inak je príloha v zálohe poškodená (A-09).
  if (bytes.length !== r.size) throw new Error("veľkosť prílohy nesúhlasí s obsahom");
  const { dataBase64: _base64, ...meta } = r;
  return { ...meta, data: new Blob([bytes], { type: r.type }) };
}
