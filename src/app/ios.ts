/**
 * iPhone a iPad: web-appku na plochu pridá len Safari (D-053, D-168). Chrome, Firefox, Edge, Opera
 * a aplikácie (Facebook, Instagram) to na iOS neponúkajú, preto ich appka neblokuje, len upozorní.
 */
function isIosDevice(ua: string): boolean {
  return /iPhone|iPad|iPod/.test(ua);
}

export function isIosSafari(ua: string): boolean {
  return isIosDevice(ua) && /Safari\//.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|FBAN|FBAV|Instagram|GSA|DuckDuckGo/.test(ua);
}

/** iOS mimo Safari: appka beží, ale pridanie na plochu treba urobiť v Safari. */
export function isIosOtherBrowser(ua: string): boolean {
  return isIosDevice(ua) && !isIosSafari(ua);
}
