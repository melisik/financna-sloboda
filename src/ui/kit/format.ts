/** Formátovanie peňazí a dátumov pre používateľa (D-144). Spoločné pre všetky sekcie a zdieľateľné. */

export const MONTHS = ["januára", "februára", "marca", "apríla", "mája", "júna", "júla", "augusta", "septembra", "októbra", "novembra", "decembra"];
export const cents = (x: number) => Math.round(x * 100);
export const eur = (c: number) => `${(c / 100).toLocaleString("sk-SK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
/** Lokálny dnešný dátum YYYY-MM-DD (R14: nie UTC). */
export const todayIso = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
/** Dátum na zobrazenie: dd.mm.rrrr. Vnútorne sa dátum ukladá ako RRRR-MM-DD. */
export const dateSk = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso;
};
export const monthYear = (iso: string) => {
  const [y, m] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
};
