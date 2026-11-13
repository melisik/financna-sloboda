/**
 * Centrálna konfigurácia prostredia COMPAVEN 2.0.
 * Jediný autoritatívny zdroj: VITE_COMPAVEN_ENV (build-time environment variable).
 * URL parametre a localStorage sa ignorujú — build-time konfigurácia má prioritu.
 */

export type Environment = "real" | "sandbox";

export interface EnvironmentConfig {
  env: Environment;
  dbName: string;
  isRealEnv: boolean;
  isSandboxEnv: boolean;
}

/**
 * Načte a validuje konfiguráciu prostredia.
 * @returns EnvironmentConfig s autentizovanou hodnotou
 * @throws Error ak VITE_COMPAVEN_ENV nie je nastavené alebo je nevalidné
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  // Jediný autoritatívny zdroj: VITE_COMPAVEN_ENV pri zostavení
  const envFromBuild = import.meta.env.VITE_COMPAVEN_ENV as string | undefined;

  if (!envFromBuild) {
    throw new Error(
      "FATAL: VITE_COMPAVEN_ENV is not set during build. " +
        "Set it to 'real' or 'sandbox' before building the application."
    );
  }

  const env = envFromBuild.toLowerCase() as Environment;

  if (env !== "real" && env !== "sandbox") {
    throw new Error(
      `FATAL: VITE_COMPAVEN_ENV="${envFromBuild}" is invalid. ` +
        "Must be 'real' or 'sandbox'."
    );
  }

  // Mapovanie prostredia na názov databázy
  const dbNameMap: Record<Environment, string> = {
    real: "compaven-2.0-real",
    sandbox: "compaven-2.0-sandbox",
  };

  const dbName = dbNameMap[env];
  const isRealEnv = env === "real";
  const isSandboxEnv = env === "sandbox";

  return {
    env,
    dbName,
    isRealEnv,
    isSandboxEnv,
  };
}

const ALLOWED_ENVIRONMENTS: readonly string[] = ["real", "sandbox"];

export function isAllowedEnvironment(value: string): value is Environment {
  return ALLOWED_ENVIRONMENTS.includes(value);
}

/**
 * Overí konflikt medzi build-time konfiguráciou a URL parametrom (ak existuje).
 * Ak sa URL param odporuje konfigurácií, zobrazí chybu a zabráni otváraniu DB.
 */
export function validateEnvironmentConsistency(search: string = window.location.search): void {
  const urlEnv = new URLSearchParams(search).get("env");

  if (!urlEnv) {
    // OK — bez URL parametra
    return;
  }

  // Hodnota z URL je nedôveryhodná: nikdy ju nevkladáme do chybovej správy.
  if (!isAllowedEnvironment(urlEnv)) {
    throw new Error("FATAL: URL parameter env has an invalid value. Allowed values: real, sandbox.");
  }

  const config = getEnvironmentConfig();
  if (urlEnv !== config.env) {
    throw new Error(
      `FATAL: Environment conflict. ` +
        `URL parameter env does not match build configuration ${config.env}. ` +
        `Use the correct URL for this deployment.`
    );
  }
}

/**
 * Aktualizuje localStorage s aktuálnym prostredím (len pre diagnostiku).
 * POZOR: localStorage NESMIE byť autorita — ide len o log.
 */
export function updateEnvironmentMarker(): void {
  const config = getEnvironmentConfig();
  localStorage.setItem("__COMPAVEN_ENV__", config.env);
  localStorage.setItem("__COMPAVEN_DB_NAME__", config.dbName);
}
