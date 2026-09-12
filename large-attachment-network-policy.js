export const LARGE_ATTACHMENT_THRESHOLD_BYTES = 5 * 1024 * 1024;

const BLOCKED_REPORTED_NETWORK_TYPES = new Set(["cellular", "wimax"]);
const POSITIVE_UNMETERED_NETWORK_TYPES = new Set(["wifi", "ethernet"]);

export function normalizeReportedNetworkType(value){
  return String(value ?? "").trim().toLowerCase();
}

export function isLargeAttachmentSize(size){
  const value = Number(size);
  return Number.isFinite(value) && value >= LARGE_ATTACHMENT_THRESHOLD_BYTES;
}

export function readBrowserAttachmentNetworkState(navigatorLike = globalThis.navigator){
  const connection = navigatorLike?.connection || navigatorLike?.mozConnection || navigatorLike?.webkitConnection || null;
  return {
    online: navigatorLike?.onLine !== false,
    networkType: normalizeReportedNetworkType(connection?.type)
  };
}

export function evaluateLargeAttachmentNetworkPolicy({enabled,size,online,networkType}){
  if(!enabled || !isLargeAttachmentSize(size)){
    return {allowed:true,waitForWifi:false,reason:"unrestricted"};
  }

  if(online === false){
    return {allowed:false,waitForWifi:true,reason:"offline"};
  }

  const reportedType = normalizeReportedNetworkType(networkType);
  if(BLOCKED_REPORTED_NETWORK_TYPES.has(reportedType)){
    return {allowed:false,waitForWifi:true,reason:"reported-mobile"};
  }

  if(POSITIVE_UNMETERED_NETWORK_TYPES.has(reportedType)){
    return {allowed:true,waitForWifi:false,reason:"reported-unmetered"};
  }

  // Fail closed when the browser cannot positively verify Wi-Fi/Ethernet.
  // iPhone/iPad Safari commonly lands here. The application may offer an
  // explicit user override, but the policy itself never silently proceeds.
  return {allowed:false,waitForWifi:true,reason:"network-unverified",canOverride:true};
}
