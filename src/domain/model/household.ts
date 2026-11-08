/** Domácnosť — skupina osôb so spoločným rozpočtom a vlastníctvom (D-028, FR-15). */

export const SPLIT_KINDS = ["equal", "income_ratio", "custom"] as const;
export type SplitKind = (typeof SPLIT_KINDS)[number];

export interface PersonShare {
  personId: string;
  percent: number; // 1–100; súčet pre Household musí byť 100
}

export interface SplitRule {
  kind: SplitKind;
  customShares?: PersonShare[]; // povinné ak kind === "custom"
}

export const MEMBER_ROLES = ["admin", "member", "viewer"] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

export interface HouseholdMember {
  personId: string;
  memberRole: MemberRole;
  joinedAt: string; // YYYY-MM-DD
  leftAt?: string; // YYYY-MM-DD, vyplní sa pri odchode
}

export interface Household {
  id: string; // UUID
  name: string; // max 80 znakov
  members: HouseholdMember[]; // vrátane odídených (leftAt je vyplnené)
  defaultSplitRule: SplitRule;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

/** Vlastnícke percentá — kto vlastní a akú časť (D-028, D-268). */
export interface OwnerRef {
  personId: string;
  percent: number; // 1–100; súčet pre jednu entitu = 100
}
