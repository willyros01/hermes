// Shared notification ownership policy. Pure logic; no Firebase writes here.
// 30 days (2026-10-09 user decision): a phone keeps receiving notifications while the app is not opened;
// renewal happens on every app foreground/reconnect. Matches the inactive-retention period.
export const NOTIFICATION_LEASE_MS = 30*24*60*60*1000;
export const NOTIFICATION_INACTIVE_RETENTION_MS = 30*24*60*60*1000;
export function validLease(record,nowMs=Date.now()){
  const uid=String(record?.ownerUid||"");
  const token=String(record?.fcmToken||"");
  const until=Number(record?.leaseUntilMs);
  return !!uid&&token.length>=20&&record?.enabled===true&&Number.isFinite(until)&&until>nowMs;
}
export function mayDeliverTo({recipientUid,registration,owner,nowMs=Date.now()}={}){
  if(!validLease(registration,nowMs))return false;
  if(!owner||owner.ownerUid!==recipientUid||registration.ownerUid!==recipientUid)return false;
  return owner.fcmToken===registration.fcmToken&&owner.installationId===registration.installationId&&
    owner.generation===registration.generation&&owner.leaseId===registration.leaseId&&typeof owner.leaseId==="string"&&validLease(owner,nowMs);
}
export function shouldPruneInactive({lastSeenMs,leaseUntilMs,nowMs=Date.now()}={}){
  return Number.isFinite(lastSeenMs)&&Number.isFinite(leaseUntilMs)&&
    leaseUntilMs<=nowMs&&lastSeenMs<=nowMs-NOTIFICATION_INACTIVE_RETENTION_MS;
}

export function mayDeliverRegistration({recipientUid,registration,owner,nowMs=Date.now()}={}){
  if(!registration?.enabled||typeof registration.fcmToken!=="string"||registration.fcmToken.length<20)return false;
  if(owner){
    if(owner.ownerUid!==recipientUid||owner.fcmToken!==registration.fcmToken||
       owner.installationId!==registration.installationId)return false;
    return mayDeliverTo({recipientUid,registration,owner,nowMs});
  }
  // Existing web clients still have legacy registrations during the phased rollout.
  // A leased record without its authority entry must fail closed.
  return !Object.prototype.hasOwnProperty.call(registration,"leaseUntilMs");
}
