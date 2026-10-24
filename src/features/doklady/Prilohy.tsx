import { useEffect, useState } from "react";
import type { Repository } from "../../storage/repository";
import type { Attachment, AttachmentOwner } from "../../storage/types";
import { ATTACHMENT_MAX_BYTES, ATTACHMENT_TYPES } from "../../storage/types";
import { btn, btnDanger } from "../../ui/kit/controls";
import { uid } from "../../ui/kit/ids";
import { STORAGE_ERROR } from "../../ui/kit/messages";

/** Prílohy k výdavku (D-160) alebo k výdavku z prenájmu (D-221): doklady a fotky, uložené v zariadení a zahrnuté v zálohe. */
export function AttachmentsBlock({ repo, owner }: { repo: Repository; owner: AttachmentOwner }) {
  const ownerKey = "transactionId" in owner ? owner.transactionId : owner.rentalEntryId;
  const [items, setItems] = useState<Attachment[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = async () => {
    try {
      setItems("transactionId" in owner ? await repo.listAttachments(owner.transactionId) : await repo.listRentalAttachments(owner.rentalEntryId));
    } catch {
      setMsg(STORAGE_ERROR);
    }
  };
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerKey]);

  const onFile = async (file: File) => {
    if (!(ATTACHMENT_TYPES as readonly string[]).includes(file.type) || file.size > ATTACHMENT_MAX_BYTES) {
      return setMsg("Príloha musí byť JPG, PNG, WEBP alebo PDF, najviac 2 MB.");
    }
    try {
      await repo.saveAttachment({ id: uid(), ...owner, name: file.name.slice(0, 120) || "príloha", type: file.type, size: file.size, createdAt: new Date().toISOString(), data: file });
      setMsg(null);
      await load();
    } catch {
      setMsg(STORAGE_ERROR);
    }
  };

  const open = (a: Attachment) => {
    const url = URL.createObjectURL(a.data);
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const remove = async (id: string) => {
    try {
      await repo.deleteAttachment(id);
      setConfirmId(null);
      await load();
    } catch {
      setMsg(STORAGE_ERROR);
    }
  };

  return (
    <div style={{ fontSize: "var(--font-small)" }}>
      <p style={{ margin: "4px 0", color: "var(--muted)" }}>Doklady k výdavku: JPG, PNG, WEBP alebo PDF, najviac 2 MB.</p>
      {items && items.length === 0 && <p style={{ margin: "4px 0" }}>Zatiaľ nie je priložený žiadny doklad.</p>}
      <ul style={{ paddingLeft: 20, margin: "4px 0" }}>
        {(items ?? []).map((a) => (
          <li key={a.id}>
            {a.name} · {Math.max(1, Math.round(a.size / 1024))} kB{" "}
            <button onClick={() => open(a)} style={btn}>Otvoriť</button>{" "}
            {confirmId === a.id ? (
              <>
                <button onClick={() => remove(a.id)} style={btnDanger}>Potvrdiť zmazanie</button>{" "}
                <button onClick={() => setConfirmId(null)} style={btn}>Zrušiť</button>
              </>
            ) : (
              <button onClick={() => setConfirmId(a.id)} style={btnDanger}>Zmazať prílohu</button>
            )}
          </li>
        ))}
      </ul>
      <label style={{ display: "block", margin: "6px 0" }}>
        <span style={{ display: "block" }}>Pridať prílohu</span>
        <input
          type="file"
          aria-label="Pridať prílohu"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void onFile(f);
          }}
        />
      </label>
      {msg && <p style={{ color: "var(--danger)" }}>{msg}</p>}
    </div>
  );
}
