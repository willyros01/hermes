// Shared notification ownership policy. Pure logic; no Firebase writes here.
export const NOTIFICATION_LEASE_MS = 24*60*60*1000;
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
    owner.generation===registration.generation&&validLease(owner,nowMs);
}
export function shouldPruneInactive({lastSeenMs,leaseUntilMs,nowMs=Date.now()}={}){
  return Number.isFinite(lastSeenMs)&&Number.isFinite(leaseUntilMs)&&
    leaseUntilMs<=nowMs&&lastSeenMs<=nowMs-NOTIFICATION_INACTIVE_RETENTION_MS;
}
