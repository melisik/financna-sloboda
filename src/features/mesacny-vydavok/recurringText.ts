import { plural } from "../../domain/impact";

/** Text riadku opakovaného výdavku (D-290): o koľko mesiacov skôr by bol cieľ; pod pol mesiaca slovom. */
export function earlierText(months: number): string {
  if (months < 0.5) return "menej ako 1 mesiac skôr";
  const n = Math.round(months);
  return `o ${n} ${plural(n, "mesiac", "mesiace", "mesiacov")} skôr`;
}
