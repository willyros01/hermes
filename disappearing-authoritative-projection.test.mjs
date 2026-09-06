import {planAuthoritativeMessageProjection,DISAPPEARING_AUTHORITATIVE_PROJECTION_V1} from "./disappearing-authoritative-projection.js";

const disappearing={id:"expired",mine:true,state:"sent",cloud:true,disappearAfterSeconds:60,serverBacked:true};
const pending={id:"pending",mine:true,state:"queued",cloud:true,disappearAfterSeconds:60,serverBacked:false};
const ordinary={id:"ordinary",mine:false,state:"read",cloud:true,serverBacked:true};

let p=planAuthoritativeMessageProjection({existingRows:[disappearing,pending,ordinary],remoteRows:[{...ordinary,state:"read"}],snapshotMeta:{fromCache:false},outboxMessageIds:["expired","pending"]});
if(!p.authoritative||p.purgeMessageIds.join()!=="expired"||p.purgeOutboxMessageIds.join()!=="expired")throw new Error("authoritative absence did not plan exact disappearing purge");
if(p.rows.some(x=>x.id==="expired")||!p.rows.some(x=>x.id==="pending"&&x.serverBacked===false))throw new Error("authoritative projection removed legitimate pending work or retained expired row");
if(!p.rows.some(x=>x.id==="ordinary"&&x.serverBacked===true))throw new Error("server-present row was not marked server-backed");

p=planAuthoritativeMessageProjection({existingRows:[disappearing,pending],remoteRows:[],snapshotMeta:{fromCache:true},outboxMessageIds:["expired","pending"]});
if(p.authoritative||p.purgeMessageIds.length||p.purgeOutboxMessageIds.length||p.rows.length!==2)throw new Error("cache-only empty snapshot gained purge authority");

p=planAuthoritativeMessageProjection({existingRows:[disappearing],remoteRows:[{id:"expired",mine:true,state:"sent",cloud:true,disappearAfterSeconds:60}],snapshotMeta:{fromCache:false}});
if(p.purgeMessageIds.length||p.rows[0]?.serverBacked!==true)throw new Error("server-present disappearing row was not retained/marked");

p=planAuthoritativeMessageProjection({existingRows:[disappearing],remoteRows:[{id:"expired",mine:false,state:"sent",cloud:true,e2ee:4,granted:true,historyGrantId:"g1",authoritativeSource:false}],snapshotMeta:{fromCache:false},outboxMessageIds:["expired"]});
if(p.purgeMessageIds.join()!=="expired"||p.purgeOutboxMessageIds.join()!=="expired"||p.rows.some(x=>x.id==="expired"))throw new Error("grant-only history copy resurrected a purged source message");

if(DISAPPEARING_AUTHORITATIVE_PROJECTION_V1.cacheSnapshotCanPurge!==false||DISAPPEARING_AUTHORITATIVE_PROJECTION_V1.grantOnlyRowsAreSourceAuthority!==false||DISAPPEARING_AUTHORITATIVE_PROJECTION_V1.clientClockIsAuthority!==false||DISAPPEARING_AUTHORITATIVE_PROJECTION_V1.createsTombstones!==false)throw new Error("projection contract weakened");
console.log("Authoritative disappearing projection convergence gate passed");
