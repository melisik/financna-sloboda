import type { ReactNode } from "react";
import { btn } from "./controls";

/**
 * Skryté tlačidlo na ďalší krok: kotva na inú sekciu v hornom paneli (D-206).
 * Obrazovka ho zobrazí len vtedy, keď dáta ukazujú, že ho používateľ potrebuje.
 */
export function NextStep({ to, children }: { to: string; children: ReactNode }) {
  return <a href={`#${to}`} style={{ ...btn, marginTop: 8, marginRight: 8 }}>{children}</a>;
}
