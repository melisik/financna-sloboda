/** Jednoduchý identifikátor pre nové záznamy (čas + náhoda). Spoločný pre formuláre. */
export const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
