// Pure Android notification-status verification: old Firestore enabled=true
// must never masquerade as a current, device-owned ADM/FCM lease.
export function confirmedNativeNotificationLease({uid,registration,retainedLease,provider,nowMs=Date.now()}={}){
  const platform=provider==="adm"?"android-adm":provider==="fcm"?"android-native":"";
  return Boolean(platform&&
    registration?.enabled===true&&registration.platform===platform&&
    registration.ownerUid===uid&&
    typeof registration.leaseId==="string"&&registration.leaseId.length>0&&
    typeof registration.leaseUntilMs==="number"&&registration.leaseUntilMs>nowMs&&
    typeof registration.fcmToken==="string"&&registration.fcmToken.length>=20&&
    retainedLease?.uid===uid&&
    retainedLease.installationId===registration.installationId&&
    retainedLease.leaseId===registration.leaseId&&
    retainedLease.fcmToken===registration.fcmToken);
}
