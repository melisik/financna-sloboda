/** Úložisko: verzia schémy a názov appky. Typy entít sú v doméne (src/domain/model), znovu exportované tu. */
export * from "../domain/model/entities";

export const APP_NAME = "financna-sloboda";
export const SCHEMA_VERSION = 8; // v2 pridáva properties (FR-28); v3 pravidelné výdavky (D-124); v4 sklad; v5 recepty (D-127); v6 položky dokladu (D-129); v7 psy (D-159); v8 prílohy (D-160)
/** Verzie schémy, ktoré import prijme; verzia 1 nemá majetok (načíta sa prázdny zoznam). */
export const READABLE_SCHEMA_VERSIONS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
