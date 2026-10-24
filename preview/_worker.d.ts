// Typy pre preview/_worker.js, aby ich používal test v tests/ (tsconfig typuje aj testy).

export interface PreviewEnv {
  PREVIEW_PASSWORD?: string;
  ASSETS: { fetch(request: Request): Promise<Response> };
}

export function makeToken(password: string, expires: number): Promise<string>;
export function isValidToken(token: string | null, password: string | undefined, now?: number): Promise<boolean>;

declare const worker: {
  fetch(request: Request, env: PreviewEnv): Promise<Response>;
};

export default worker;
