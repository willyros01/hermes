import {createHash,randomUUID} from "node:crypto";
import {NOTIFICATION_LEASE_MS,NOTIFICATION_INACTIVE_RETENTION_MS,mayDeliverTo,shouldPruneInactive} from "./notification-lease-policy.mjs";
const tokenKey=token=>createHash("sha256").update(token).digest("hex");
const valid=(s,min,max)=>typeof s==="string"&&s.length>=min&&s.length<=max;
export function createNotificationLeaseFirestoreAdmin({db,now=()=>Date.now()}={}){
  if(!db?.doc||!db?.runTransaction)throw new Error("Firestore Admin required.");
  async function claim({uid,installationId,fcmToken,platform,showSenderName=false}={}){
    if(!valid(uid,1,180)||!valid(installationId,8,128)||!valid(fcmToken,20,4096)||!valid(platform,3,60))throw new Error("Invalid notification lease claim.");
    const ownerRef=db.doc("notificationTokenOwners/"+tokenKey(fcmToken));
    const target=db.doc("users/"+uid+"/notificationDevices/"+installationId);
    return db.runTransaction(async tx=>{
      const ownerSnap=await tx.get(ownerRef);
      const previous=ownerSnap.exists?ownerSnap.data():null;
      const previousRef=previous?.ownerUid&&previous?.installationId?db.doc("users/"+previous.ownerUid+"/notificationDevices/"+previous.installationId):null;
      const targetSnap=await tx.get(target);
      const oldTargetToken=targetSnap.exists?targetSnap.data()?.fcmToken:null;
      const oldTokenOwnerRef=oldTargetToken&&oldTargetToken!==fcmToken?db.doc("notificationTokenOwners/"+tokenKey(oldTargetToken)):null;
      const oldTokenOwnerSnap=oldTokenOwnerRef?await tx.get(oldTokenOwnerRef):null;
      const priorSnap=previousRef&&previousRef.path!==target.path?await tx.get(previousRef):null;
      const generation=(Number(previous?.generation)||0)+1,leaseId=randomUUID(),stamp=now(),leaseUntilMs=stamp+NOTIFICATION_LEASE_MS;
      if(previousRef&&priorSnap?.exists&&priorSnap.data()?.fcmToken===fcmToken)tx.delete(previousRef);
      if(oldTokenOwnerSnap?.exists&&oldTokenOwnerSnap.data()?.ownerUid===uid&&oldTokenOwnerSnap.data()?.installationId===installationId)tx.delete(oldTokenOwnerRef);
      const row={installationId,fcmToken,platform,enabled:true,showSenderName:showSenderName===true,ownerUid:uid,generation,leaseId,leaseUntilMs,lastSeenMs:stamp,updatedAt:new Date(stamp)};
      tx.set(target,{...row,createdAt:targetSnap.exists?(targetSnap.data()?.createdAt||new Date(stamp)):new Date(stamp)},{merge:true});
      tx.set(ownerRef,{...row,ownerUid:uid},{merge:false});
      return {leaseUntilMs,generation,leaseId};
    });
  }
  async function revoke({uid,installationId,fcmToken,leaseId}={}){
    if(!valid(uid,1,180)||!valid(installationId,8,128)||!valid(fcmToken,20,4096)||!valid(leaseId,36,36))throw new Error("Invalid notification revocation.");
    const ownerRef=db.doc("notificationTokenOwners/"+tokenKey(fcmToken));
    const target=db.doc("users/"+uid+"/notificationDevices/"+installationId);
    return db.runTransaction(async tx=>{
      const [ownerSnap,targetSnap]=await Promise.all([tx.get(ownerRef),tx.get(target)]);
      const owner=ownerSnap.exists?ownerSnap.data():null;
      const matching=owner?.ownerUid===uid&&owner?.installationId===installationId&&owner?.fcmToken===fcmToken&&owner?.leaseId===leaseId;
      if(matching)tx.delete(ownerRef);
      if(targetSnap.exists&&targetSnap.data()?.fcmToken===fcmToken&&targetSnap.data()?.leaseId===leaseId)tx.update(target,{enabled:false,leaseUntilMs:0,updatedAt:new Date(now())});
      return {revoked:matching};
    });
  }
  async function eligible(uid){
    const snap=await db.collection("users/"+uid+"/notificationDevices").where("enabled","==",true).get();
    const rows=snap.docs.map(d=>({...d.data(),installationId:d.id}));
    const withLease=rows.filter(r=>typeof r.leaseUntilMs==="number");
    const checked=await Promise.all(withLease.map(async r=>{
      const s=await db.doc("notificationTokenOwners/"+tokenKey(r.fcmToken)).get();
      return mayDeliverTo({recipientUid:uid,registration:r,owner:s.exists?s.data():null,nowMs:now()})?r:null;
    }));
    return checked.filter(Boolean);
  }
  async function purgeInactive({limit=100}={}){
    if(!Number.isInteger(limit)||limit<1||limit>200)throw new Error("Invalid cleanup batch.");
    const cutoff=now()-NOTIFICATION_INACTIVE_RETENTION_MS;
    const snap=await db.collection("notificationTokenOwners").where("lastSeenMs","<=",cutoff).limit(limit).get();
    let deleted=0;
    for(const doc of snap.docs){
      const ownerRef=db.doc("notificationTokenOwners/"+doc.id);
      const didDelete=await db.runTransaction(async tx=>{
        const fresh=await tx.get(ownerRef);
        if(!fresh.exists)return false;
        const row=fresh.data();
        if(!shouldPruneInactive({lastSeenMs:row.lastSeenMs,leaseUntilMs:row.leaseUntilMs,nowMs:now()}))return false;
        if(!valid(row.ownerUid,1,180)||!valid(row.installationId,8,128)||!valid(row.fcmToken,20,4096))return false;
        if(tokenKey(row.fcmToken)!==doc.id)return false;
        const target=db.doc("users/"+row.ownerUid+"/notificationDevices/"+row.installationId);
        const targetSnap=await tx.get(target);
        if(targetSnap.exists&&targetSnap.data()?.fcmToken===row.fcmToken&&targetSnap.data()?.generation===row.generation)tx.delete(target);
        tx.delete(ownerRef);
        return true;
      });
      if(didDelete)deleted++;
    }
    return {inspected:snap.size,deleted};
  }
  return Object.freeze({claim,revoke,eligible,purgeInactive});
}
