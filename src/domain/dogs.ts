import type { Dog, DogKeepingPlace, DogPurpose } from "../storage/types";

/** Popisky miesta držania a účelu podľa tlačiva 17-dp-md, oddiel V (D-159). */
export const DOG_PLACE_LABEL: Record<DogKeepingPlace, string> = {
  byt: "byt",
  rodinny_dom: "rodinný dom",
  objekt_podnikanie: "objekt na podnikanie",
  ina_stavba: "iná stavba",
};
export const DOG_PURPOSE_LABEL: Record<DogPurpose, string> = { domaci: "domáci", sluzobny: "služobný", zvlastny: "zvláštny" };

/** Pes je evidovaný dnes, ak dnešok leží medzi vznikom a zánikom (zánik bez hodnoty = trvá). */
export function isDogActive(d: Pick<Dog, "startDate" | "endDate">, today: string): boolean {
  return d.startDate <= today && (d.endDate === undefined || today <= d.endDate);
}

/** Počet psov evidovaných dnes. Podklad pre tlačivo 17-dp-md, oddiel V; sadzbu určuje obec (D-159). */
export function activeDogCount(dogs: Dog[], today: string): number {
  return dogs.filter((d) => isDogActive(d, today)).length;
}
