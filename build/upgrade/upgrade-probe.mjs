/* iPad: what happens to FIDUNIO's saved data on an update (Willy, 24 Nov 2026).
 * Three cases, each starting from a fresh 1.1.81 signed in with a PIN:
 *   SAME     1.1.81 installed over itself (control: the simulator's own update)
 *   WEBONLY  1.1.82 app code, but the OLD iPhone/iPad shell (no HELP native parts)
 *   FULL     1.1.82 exactly as in TestFlight (HELP native parts included)
 * After each update: which saved data the app can still see, before and after
 * closing and reopening it. Local demo Firebase only.
 *   usage: node build/upgrade/upgrade-probe.mjs OUT OLD_APP WEBONLY_APP FULL_APP */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const [outArg,oldApp,webApp,fullApp]=process.argv.slice(2);
const out=path.resolve(outArg);fs.mkdirSync(out,{recursive:true});
const fixture=JSON.parse(fs.readFileSync(path.join(out,'native-fixture.json'),'utf8'));
if(fixture.project!=='demo-fidunio-simulator-tests')throw new Error('Refusing non-demo project');
const d=await import('../simulator/sim.mjs');
const APP='io.github.willyros01.fidunio',UDID=process.env.UDID,sleep=d.sleep;
const run=(c,a)=>execFileSync(c,a,{encoding:'utf8',maxBuffer:64<<20}).trim();
const js=s=>d.js(s),present=s=>js(`!!document.querySelector(${JSON.stringify(s)})`);
let n=0;const log=s=>{console.log(s);fs.appendFileSync(path.join(out,'probe.txt'),s+'\n');};
const shot=async name=>{await sleep(700);const f=String(++n).padStart(2,'0')+'-'+name+'.png';try{d.shot(path.join(out,f));}catch{}return f;};
async function until(fn,what,ms=60000){const end=Date.now()+ms;let last='';while(Date.now()<end){try{if(await fn())return;}catch(e){last=e.message;}await sleep(1000);}throw new Error('timed out: '+what+(last?' — '+last:''));}
/* What the app can see of its saved data: names only, never values. */
const SEE=`(async()=>{const o={version:globalThis.FIDUNIO_RELEASE?.version||"?"};
 try{o.databases=(await indexedDB.databases()).map(x=>x.name+"@"+x.version).join(",")}catch(e){o.databases="error "+e.message}
 try{const db=await new Promise((ok,bad)=>{const r=indexedDB.open("fidunio-local");r.onsuccess=()=>ok(r.result);r.onerror=()=>bad(r.error);setTimeout(()=>bad(new Error("open timed out")),8000)});
   o.stores=[...db.objectStoreNames].join(",");
   if(db.objectStoreNames.contains("meta")){const keys=await new Promise((ok,bad)=>{const q=db.transaction("meta").objectStore("meta").getAllKeys();q.onsuccess=()=>ok(q.result);q.onerror=()=>bad(q.error)});
     o.pinSettings=keys.includes("local-security-v1");o.encryptionKey=keys.some(k=>String(k).startsWith("account-e2ee-runtime-v1:"));o.metaKeys=keys.length;}
   db.close();}catch(e){o.local="error "+e.message}
 try{o.signInRemembered=Object.keys(localStorage).some(k=>k.startsWith("firebase:authUser"));o.localStorageKeys=localStorage.length}catch(e){o.localStorage="error "+e.message}
 o.screen=(document.querySelector("h1")?.textContent||document.querySelector(".small-note")?.textContent||"").trim().slice(0,70);
 return JSON.stringify(o)})()`;
const see=async()=>{try{return await js(SEE);}catch(e){return 'could not ask the app: '+e.message;}};
const results=[];const check=(id,ok,observed)=>{results.push({id,ok,observed});log(`${ok?'AS EXPECTED':'DIFFERENT'} ${id} — observed: ${observed}`);};

let joined=false;
async function signInOld(){
  d.disconnect();d.reinstall(APP,oldApp);d.launch(APP);
  await d.waitApp(/Terms of Use/,120000);
  await d.press('#startupTermsTick');await d.press('#startupTermsAccept');
  if(!joined){
    await until(()=>present('#joinTab'),'Join tab');await d.press('#joinTab');
    await until(()=>present('#joinPinHost'),'Join form');
    await js(`(() => {import("./firebase.js").then(m=>m.validateInvitation(${JSON.stringify(fixture.inviteToken)})).catch(()=>{});return true})()`);
    await sleep(12000);
    await d.fill('#inviteCode',fixture.inviteToken);await d.fill('#joinName',fixture.alice.name);
    await d.fill('#joinEmail',fixture.alice.email);await d.fill('#joinPassword',fixture.alice.password);
    for(let i=0;i<6;i++)await d.fill(`#joinPinHost .pin-code-slot:nth-child(${i+1})`,fixture.alice.pin[i]);
    await d.press('#redeemBtn');joined=true;
  }else{
    /* Same account again on a fresh install: Sign In, then password + PIN to restore messaging. */
    await until(()=>present('#signInTab'),'Sign In tab');await d.press('#signInTab');
    await until(()=>present('#loginEmail'),'Sign In form');
    await d.fill('#loginEmail',fixture.alice.email);await d.fill('#loginPassword',fixture.alice.password);await d.press('#loginBtn');
    await until(async()=>await present('#sessionPinHost')||await present('#newBtn')||await present('#tabletNewBtn'),'restore or Messages',90000);
    if(await present('#sessionPinHost')){
      if(await present('#sessionPassword'))await d.fill('#sessionPassword',fixture.alice.password);
      for(let i=0;i<6;i++)await d.fill(`#sessionPinHost .pin-code-slot:nth-child(${i+1})`,fixture.alice.pin[i]);
      if(await present('#sessionUnlockBtn'))await d.press('#sessionUnlockBtn').catch(()=>{});
    }
  }
  await until(async()=>await present('#newBtn')||await present('#tabletNewBtn'),'Messages screen',150000);
}
async function scenario(label,newApp){
  log(`\n=== ${label} ===`);
  try{await signInOld();}catch(e){log('could not sign in to 1.1.81: '+e.message);await shot(label+'-signin-failed');return;}
  log('1.1.81 signed in, saved data: '+await see());
  d.terminate(APP);await sleep(2000);d.disconnect();
  run('xcrun',['simctl','install',UDID,newApp]);d.launch(APP);await sleep(15000);
  const first=await see();log('after update, first open: '+first);await shot(label+'-first-open');
  d.terminate(APP);await sleep(3000);d.disconnect();d.launch(APP);await sleep(15000);
  const second=await see();log('after closing and reopening: '+second);await shot(label+'-reopened');
  const kept=s=>/"pinSettings":true/.test(s)&&/"encryptionKey":true/.test(s);
  check(label,kept(first),`first open keeps PIN settings + encryption key: ${kept(first)}; after reopening: ${kept(second)}`);
}
log('FIDUNIO iPad update — saved data check — '+run('xcrun',['simctl','list','devices','booted']).split('\n').find(l=>/Booted/.test(l))?.trim());
await scenario('SAME',oldApp);
await scenario('WEBONLY',webApp);
await scenario('FULL',fullApp);
fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({results},null,2));
log('RESULT: probe finished');process.exit(0);
