/*
 * FIDUNIO HELP alerts — server core (pure logic, no Firebase imports; tested
 * with fakes). Owner-approved plan "FIDUNIO HELP Alert — Build Plan", Nov 24 2026.
 *
 * The alert document holds NO message, location or Wi-Fi name: those travel
 * end-to-end encrypted as ordinary direct messages. The server only learns who
 * asked for help, which helpers to alert, and when.
 */
export const HELP_MAX_HELPERS=5;
/* KISS HELP (owner, 2026-11-25): ring again every 30 seconds until someone answers or the
 * sender is OK — it never gives up on its own. */
export const HELP_REALERT_MS=30*1000;
export const HELP_MAX_REALERTS=Infinity;
export const HELP_HISTORY_MS=30*24*60*60*1000;
const ID=/^[A-Za-z0-9_-]{1,128}$/;

function cleanName(value){const s=String(value||"").trim();return s&&s.length<=80?s:"A FIDUNIO member";}
export function helpers(alert){
  const list=Array.isArray(alert?.helperUids)?[...new Set(alert.helperUids.map(String))]:[];
  return list.filter(uid=>ID.test(uid)&&uid!==String(alert?.senderUid||"")).slice(0,HELP_MAX_HELPERS);
}
export function alertBody(name,{test=false}={}){
  return (test?"TEST — ":"")+`HELP — ${cleanName(name)}`;
}
/* Re-alert rule: still open, nobody has said "I'm coming", and due. */
export function realertDue(alert,nowMs){
  if(alert?.state!=="open")return false;
  if(alert.acks&&typeof alert.acks==="object"&&Object.keys(alert.acks).length>0)return false;
  const sent=Number(alert.realertCount||0);
  const next=Number(alert.nextAlertAtMs||0);
  return sent<HELP_MAX_REALERTS&&Number.isFinite(next)&&next>0&&next<=nowMs+1000;
}
/* New "I'm on it" answers between two versions of an alert. */
export function newAcks(before,after){
  const a=before?.acks&&typeof before.acks==="object"?before.acks:{};
  const b=after?.acks&&typeof after.acks==="object"?after.acks:{};
  return Object.keys(b).filter(uid=>!(uid in a)&&ID.test(uid));
}

export function createHelpCore({repo,push,nowMs=()=>Date.now(),logger=console}={}){
  for(const fn of ["getAlert","getSettings","getDisplayName","listDevices","markSent","listOpenAlerts","deleteAlertsBefore"])
    if(typeof repo?.[fn]!=="function")throw new Error("HELP repository is incomplete: "+fn);
  if(typeof push?.sendToDevices!=="function")throw new Error("HELP push sender is required.");

  async function deliver(uids,{alertId,kind,body}){
    let sent=0,failed=0;
    for(const uid of uids){
      const devices=await repo.listDevices(uid);
      if(!devices.length)continue;
      const r=await push.sendToDevices({uid,devices,data:{type:"help-alert",alertId,kind,notificationBody:body}});
      sent+=r.sent;failed+=r.failed;
    }
    return{sent,failed};
  }

  /* An alert was created by the person asking for help. */
  async function alertCreated({alertId,alert}){
    if(!ID.test(String(alertId||"")))throw new Error("Invalid alert id.");
    if(!alert||alert.state!=="open")return{status:"ignored"};
    const sender=String(alert.senderUid||"");
    const list=helpers(alert);
    if(!ID.test(sender)||!list.length)return{status:"invalid"};
    /* Only helpers the sender chose in Settings may be alerted (also enforced by the database rules). */
    const settings=await repo.getSettings(sender);
    const allowed=new Set(helpers({senderUid:sender,helperUids:settings?.helperUids}));
    if(settings?.enabled!==true||!list.every(uid=>allowed.has(uid)))return{status:"not-allowed"};
    const name=await repo.getDisplayName(sender);
    const result=await deliver(list,{alertId,kind:"alert",body:alertBody(name,{test:alert.test===true})});
    await repo.markSent(alertId,{realertCount:0,nextAlertAtMs:nowMs()+HELP_REALERT_MS,lastAlertAtMs:nowMs()});
    return{status:"sent",...result};
  }

  /* Someone answered, or the sender closed the alert. */
  async function alertUpdated({alertId,before,after}){
    if(!ID.test(String(alertId||""))||!after)return{status:"ignored"};
    const sender=String(after.senderUid||"");
    const list=helpers(after);
    let sent=0;
    for(const uid of newAcks(before,after)){
      if(!list.includes(uid))continue;
      const name=await repo.getDisplayName(uid);
      const body=`${cleanName(name)} is coming`;
      const others=list.filter(x=>x!==uid);
      sent+=(await deliver([sender,...others],{alertId,kind:"ack",body})).sent;
    }
    if(before?.state==="open"&&(after.state==="safe"||after.state==="cancelled")){
      const name=await repo.getDisplayName(sender);
      const body=after.state==="safe"?`${cleanName(name)} is OK now`:`${cleanName(name)}: sorry, it was a mistake`;
      sent+=(await deliver(list,{alertId,kind:after.state,body})).sent;
    }
    return{status:"ok",sent};
  }

  /* Runs every minute and again 30 seconds later in the same run: re-alert unanswered alerts
   * every 30 seconds; forget alerts after 30 days. */
  async function sweep({secondPassAfterMs=30*1000,sleep=ms=>new Promise(r=>setTimeout(r,ms))}={}){
    const first=await realertPass();
    if(secondPassAfterMs>0){await sleep(secondPassAfterMs);await realertPass();}
    const now=nowMs();
    const purged=await repo.deleteAlertsBefore(now-HELP_HISTORY_MS);
    if(first||purged)logger.info?.("FIDUNIO HELP sweep",{realerted:first,purged});
    return{realerted:first,purged};
  }
  async function realertPass(){
    const now=nowMs();let realerted=0;
    for(const row of await repo.listOpenAlerts()){
      if(!realertDue(row.alert,now))continue;
      const n=Number(row.alert.realertCount||0)+1;
      const name=await repo.getDisplayName(String(row.alert.senderUid||""));
      await deliver(helpers(row.alert),{alertId:row.id,kind:"alert",body:alertBody(name,{test:row.alert.test===true})});
      await repo.markSent(row.id,{realertCount:n,nextAlertAtMs:now+HELP_REALERT_MS,lastAlertAtMs:now});
      realerted++;
    }
    return realerted;
  }
  return Object.freeze({alertCreated,alertUpdated,sweep});
}
