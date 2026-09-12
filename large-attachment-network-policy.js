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

  // Option 2: browsers that do not positively disclose their physical
  // transport are allowed to proceed. This is essential on iPhone/iPad
  // Safari, which generally does not expose Wi-Fi versus cellular here.
  return {allowed:true,waitForWifi:false,reason:"network-type-unknown"};
}
