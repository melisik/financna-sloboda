import type { Dog } from "../storage/types";

/** Pes je evidovaný dnes, ak dnešok leží medzi vznikom a zánikom (zánik bez hodnoty = trvá). */
export function isDogActive(d: Pick<Dog, "startDate" | "endDate">, today: string): boolean {
  return d.startDate <= today && (d.endDate === undefined || today <= d.endDate);
}

/** Počet psov evidovaných dnes. Podklad pre tlačivo 17-dp-md, oddiel V; sadzbu určuje obec (D-159). */
export function activeDogCount(dogs: Dog[], today: string): number {
  return dogs.filter((d) => isDogActive(d, today)).length;
}
