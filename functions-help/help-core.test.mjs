import assert from "node:assert/strict";
import {createHelpCore,realertDue,newAcks,alertBody,HELP_REALERT_MS} from "./help-core.mjs";
import {helpFcmMessage} from "./help-push.mjs";

let now=1_000_000;
const alerts=new Map(),sentLog=[];
const repo={
  async getAlert(id){return alerts.get(id)||null;},
  async getSettings(uid){return uid==="kid"?{enabled:true,helperUids:["mom","dad"]}:null;},
  async getDisplayName(uid){return {kid:"Lucas",mom:"Mom",dad:"Dad"}[uid]||"";},
  async listDevices(uid){return [{fcmToken:"tok-"+uid+"-xxxxxxxxxxxxxxxxxxxx",platform:"ios-native"}];},
  async markSent(id,f){alerts.set(id,{...alerts.get(id),...f});},
  async listOpenAlerts(){return [...alerts].filter(([,a])=>a.state==="open").map(([id,alert])=>({id,alert}));},
  async deleteAlertsBefore(){return 0;}
};
const push={async sendToDevices({uid,data}){helpFcmMessage(["x".repeat(30)],data);sentLog.push([uid,data.notificationBody]);return{sent:1,failed:0};}};
const core=createHelpCore({repo,push,nowMs:()=>now,logger:{}});
/* Test sweep: one pass only (the 30-second second pass is checked separately below). */
const sweep1=()=>core.sweep({secondPassAfterMs:0});

alerts.set("a1",{senderUid:"kid",helperUids:["mom","dad"],state:"open",acks:{}});
assert.equal((await core.alertCreated({alertId:"a1",alert:alerts.get("a1")})).status,"sent");
assert.deepEqual(sentLog.map(x=>x[1]),["HELP — Lucas","HELP — Lucas"]);
assert.equal(alerts.get("a1").nextAlertAtMs,now+HELP_REALERT_MS);

/* Not a chosen helper → nobody is alerted. */
assert.equal((await core.alertCreated({alertId:"a2",alert:{senderUid:"kid",helperUids:["stranger"],state:"open"}})).status,"not-allowed");
/* HELP off → nobody is alerted. */
assert.equal((await core.alertCreated({alertId:"a3",alert:{senderUid:"dad",helperUids:["mom"],state:"open"}})).status,"not-allowed");

/* Keep ringing (owner): every 30 seconds, no limit, while nobody answered. */
assert.equal(HELP_REALERT_MS,30*1000);
sentLog.length=0;
for(let i=1;i<=20;i++){now+=HELP_REALERT_MS;await sweep1();}
assert.equal(sentLog.length,40,"20 rings x 2 helpers — it never stops on its own");
assert.equal(sentLog.at(-1)[1],"HELP — Lucas");
/* One scheduled run rings twice: now and 30 seconds later. */
sentLog.length=0;now+=HELP_REALERT_MS;
await core.sweep({sleep:async ms=>{assert.equal(ms,30*1000);now+=ms;}});
assert.equal(sentLog.length,4,"two rings per minute x 2 helpers");

/* An answer stops re-alerts and tells the sender and the other helper. */
alerts.set("b1",{senderUid:"kid",helperUids:["mom","dad"],state:"open",acks:{},realertCount:0,nextAlertAtMs:now});
const before={...alerts.get("b1")},after={...before,acks:{mom:{at:now}}};
alerts.set("b1",after);sentLog.length=0;
await core.alertUpdated({alertId:"b1",before,after});
assert.deepEqual(sentLog,[["kid","Mom is coming"],["dad","Mom is coming"]]);
assert.equal(realertDue(after,now+10*HELP_REALERT_MS),false);
sentLog.length=0;await sweep1();assert.equal(sentLog.length,0);

/* I'm OK now tells every helper. */
sentLog.length=0;
await core.alertUpdated({alertId:"b1",before:after,after:{...after,state:"safe"}});
assert.deepEqual(sentLog,[["mom","Lucas is OK now"],["dad","Lucas is OK now"]]);
assert.deepEqual(newAcks({acks:{a:1}},{acks:{a:1,b:2}}),["b"]);
assert.equal(alertBody("Lucas",{test:true}),"TEST — HELP — Lucas");

/* Push payload: urgent on iPhone (time sensitive) and Android (own channel); no content. */
const m=helpFcmMessage(["t".repeat(30)],{alertId:"a1",kind:"alert",notificationBody:"HELP — Lucas"});
/* Old app bodies still pass (1.1.82 phones). */
helpFcmMessage(["t".repeat(30)],{alertId:"a1",kind:"alert",notificationBody:"HELP from Lucas (reminder 2)"});
helpFcmMessage(["t".repeat(30)],{alertId:"a1",kind:"update",notificationBody:"Lucas is safe now"});
assert.equal(m.apns.payload.aps["interruption-level"],"time-sensitive");
assert.equal(m.android.notification.channelId,"fidunio-help");
assert.throws(()=>helpFcmMessage(["t".repeat(30)],{alertId:"a1",kind:"alert",notificationBody:"I am at 12 Main St"}),/Unapproved/);
console.log("HELP server core gate passed");
