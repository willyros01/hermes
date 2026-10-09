import assert from "node:assert/strict";
import {createNotificationLeaseSession} from "./notification-lease-session.js";
const entries=new Map();
const storage={getItem:k=>entries.get(k)||null,setItem:(k,v)=>entries.set(k,v),removeItem:k=>entries.delete(k)};
const calls=[];
function make(){return createNotificationLeaseSession({storage,getInstallationId:()=>"web-device-01",getToken:async()=>"x".repeat(80),claim:async row=>{calls.push(["claim",row]);return{leaseId:"00000000-0000-4000-8000-000000000000"};},revoke:async row=>{calls.push(["revoke",row]);return{revoked:true};},getPlatform:()=>"desktop-browser"});}
let app=make();app.setPreference("user-A",true);assert.equal((await app.activate("user-A")).activated,true);
app=make();assert.equal((await app.logout("user-A")).revoked,true,"reload must retain revocation authority");
assert.equal(app.preferred("user-A"),true,"logout must preserve notifications preference");
assert.equal(calls[1][1].leaseId,"00000000-0000-4000-8000-000000000000");
assert.equal((await app.logout("user-A")).revoked,false,"repeat logout must not revoke another lease");
console.log("PASS: web lease activation, reload-safe revocation, preferences and idempotence");
