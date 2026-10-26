/** Úložisko: verzia schémy a názov appky. Typy entít sú v doméne (src/domain/model), znovu exportované tu. */
export * from "../domain/model/entities";

export const APP_NAME = "compaven";
export const SCHEMA_VERSION = 16; // v2 pridáva properties (FR-28); v3 pravidelné výdavky (D-124); v4 sklad; v5 recepty (D-127); v6 položky dokladu (D-129); v7 psy (D-159); v8 prílohy (D-160); v9 prílohy k výdavkom z prenájmu (D-221); v10 čiarový kód položky skladu (D-232); v11 lehota upozornenia na spotrebu (D-239); v12 ciele investícií (D-105); v13 cena položky skladu a vyhodené potraviny (D-301); v14 nákupný zoznam a minimálna zásoba (D-302); v15 poskytovateľ investície (D-329); v16 podiely položky v cieľoch (D-334)
/** Verzie schémy, ktoré import prijme; verzia 1 nemá majetok (načíta sa prázdny zoznam). */
export const READABLE_SCHEMA_VERSIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] as const;
