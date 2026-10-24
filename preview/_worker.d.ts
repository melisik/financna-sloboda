// Typy pre preview/_worker.js, aby ich používal test v tests/ (tsconfig typuje aj testy).

export interface PreviewEnv {
  PREVIEW_PASSWORD?: string;
  ASSETS: { fetch(request: Request): Promise<Response> };
}

export function isAuthorized(header: string | null, password: string | undefined): boolean;

declare const worker: {
  fetch(request: Request, env: PreviewEnv): Promise<Response>;
};

export default worker;
