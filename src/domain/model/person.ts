/** Osoba — člen domácnosti alebo používateľ (D-028, FR-15). */

export const PERSON_ROLES = ["owner", "partner", "dependent", "other"] as const;
export type PersonRole = (typeof PERSON_ROLES)[number];

export interface Person {
  id: string; // UUID lokálne generované
  name: string; // max 80 znakov
  role: PersonRole; // rola v kontexte domácnosti
  isCurrentUser: boolean; // práve jeden Person v modeli = ja
  birthDate?: string; // YYYY-MM-DD, voliteľné (pre dôchodkový horizont)
  authId?: string; // server-side ID po autentifikácii (F3.1)
  createdAt: string; // ISO
  updatedAt: string; // ISO
}
