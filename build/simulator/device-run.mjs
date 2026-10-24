/* FIDUNIO native emulator pre-auth journey. Native binaries are disposable,
 * Firebase points to localhost emulators only, and no account is created.
 * Authenticated chats, push receipt, ADM/APNs, and physical-camera operations
 * are deliberately NOT claimed by this smoke journey. */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const platform = process.argv[2];
const out = path.resolve(process.argv[3] || 'out-fidunio/device');
const artifact = process.argv[4];
const APP = 'io.github.willyros01.fidunio';
if (!['android', 'ios'].includes(platform) || !artifact) throw new Error('Usage: node device-run.mjs android|ios OUT_DIR DEBUG_APK_OR_APP');
const d = await import(platform === 'android' ? './adb.mjs' : './sim.mjs');
if (platform === 'android') d.use(APP);
fs.mkdirSync(out, {recursive: true});
const events = [], shots = [];
let passed = 0, failed = 0;
const sleep = d.sleep;
function log(message) {
  events.push(message);console.log(message);
  fs.writeFileSync(path.join(out,'report.txt'),events.join('\n')+'\n');
}
async function capture(name) {
  if(platform==='android'){
    // A busy hosted Pixel emulator can display an OS-level 'Pixel Launcher
    // isn't responding' dialog over an otherwise working FIDUNIO WebView.
    // CDP DOM assertions alone would miss it. Inspect the REAL screen before
    // taking evidence; choose harmless 'Wait', never Close app, and fail closed.
    const anr=/(?:Pixel Launcher|System UI|FIDUNIO).*(?:isn't responding|is not responding)/i;
    for(let attempt=0;attempt<3;attempt++){
      const visible=d.screenText();
      if(!anr.test(visible))break;
      log('    Emulator OS dialog detected; selecting Wait to preserve the app');
      if(attempt===2)throw new Error('Android system not-responding dialog remained over the app screen');
      await d.tapText(/^Wait$/);
      await sleep(1200);
    }
    if(anr.test(d.screenText()))throw new Error('Android system warning covers the final screen capture');
    if(name==='terms-before-consent')await d.waitText(/Terms of Use/,30000);
  }
  await sleep(450);
  const file = String(shots.length + 1).padStart(2,'0') + '-' + name + '.png';
  d.shot(path.join(out,file));
  shots.push({name,file});
  log('    Capture: ' + file);
}
async function waitFor(check,label,ms=45000) {
  const end=Date.now()+ms;
  let last='';
  while(Date.now()<end){
    try{if(await check())return;}catch(e){last=e.message;}
    await sleep(800);
  }
  throw new Error('Timeout: '+label+(last?'; '+last.slice(0,220):''));
}
async function read(expr){return d.js(expr);}
async function click(selector){
  const ok=await read('(() => {const el=document.querySelector('+JSON.stringify(selector)+');if(!el)return false;el.scrollIntoView({block:"center"});el.click();return true;})()');
  if(!ok)throw new Error('UI control not found: '+selector);
  await sleep(350);
}
async function assertText(fragment){
  const s=String(await d.appText());
  if(!s.includes(fragment))throw new Error('Expected screen text '+JSON.stringify(fragment)+'; displayed: '+s.replace(/\s+/g,' ').slice(0,350));
}
async function step(id,label,fn){
  log('\n'+id+': '+label);
  try{await fn();passed++;log('PASS '+id);}
  catch(e){failed++;try{await capture(id+'-failure');}catch{}log('FAIL '+id+': '+String(e.stack||e).slice(0,900));throw e;}
}
async function checkDemoFirebase(){
  const ok=await read('(() => {window.__fidunioDemoCheck={done:false};import("./firebase-config.js").then(m=>window.__fidunioDemoCheck={done:true,project:m.firebaseConfig?.projectId||""},e=>window.__fidunioDemoCheck={done:true,error:String(e)});return true;})()');
  if(!ok)throw new Error('Could not inspect local Firebase config');
  let result;
  await waitFor(async()=>{const s=await read('JSON.stringify(window.__fidunioDemoCheck)');if(!s)return false;result=JSON.parse(s);return result.done;},'local Firebase config');
  if(result.error||result.project!=='demo-fidunio-simulator-tests')throw new Error('Production isolation violated: '+JSON.stringify(result));
}
function writeReport(){
  const status=failed?'FAIL':'PASS';
  const lines=[
    '# FIDUNIO '+(platform==='ios'?'iPhone':'Android')+' native simulator report','',
    '**Result: '+status+' — '+passed+' passed, '+failed+' failed**','',
    '- GitHub run: https://github.com/'+(process.env.GITHUB_REPOSITORY||'willyros01/hermes')+'/actions/runs/'+(process.env.GITHUB_RUN_ID||'local'),
    '- Simulator: '+(platform==='ios'?'iPhone':'Android API 34 AOSP')+' disposable debug app',
    '- Source branch: '+(platform==='ios'?'ios':'Android')+' (read-only source checkout)',
    '- Backend: Firebase project demo-fidunio-simulator-tests; local emulators only',
    '- No authenticated user, production message, real push receipt, or actual camera capture was exercised','',
    '## Step-by-step checks','','```text',...events,'```','',
    '## Actual device screen captures',''
  ];
  for(const shot of shots)lines.push('### '+shot.name,'','!['+shot.name+']('+shot.file+')','');
  lines.push('## Coverage limitations','',
    '- This is a real native shell and WebView journey, but pre-auth only. Authenticated encrypted message flows are covered by separately labeled source/emulator tests.',
    '- Native APNs/ADM/FCM delivery and push-tap routing cannot be proved on these disposable emulators.',
    '- Biometric sensor success and camera picker handling require physical devices.',
    '- The separate browser suite tests simulated biometric failure and PIN fallback.','');
  fs.writeFileSync(path.join(out,'REPORT.md'),lines.join('\n'));
}
try{
  log('FIDUNIO '+platform.toUpperCase()+' native simulator, disposable data only');
  d.reinstall(APP,artifact);
  d.launch(APP);
  await d.waitApp(/Terms of Use/,75000);
  await step('S1','Real native cold start shows legal Terms before Firebase login',async()=>{
    await checkDemoFirebase();
    if(!await read('!!document.querySelector("#startupTermsTick")'))throw new Error('Terms checkbox missing');
    if(await read('!!document.querySelector("#loginEmail")'))throw new Error('Login shown before Terms');
    if(!await read('document.querySelector("#startupTermsAccept")?.disabled'))throw new Error('Accept enabled before consent');
    await capture('terms-before-consent');
  });
  await step('S2','Declining Terms locks the app; Read Again resets consent',async()=>{
    await click('#startupTermsDecline');
    await assertText('cannot be used unless you accept');
    if(await read('!!document.querySelector("#loginEmail")'))throw new Error('Declined Terms bypassed');
    await capture('terms-declined-locked');
    await click('#startupTermsAgain');
    await waitFor(async()=>!!(await read('!!document.querySelector("#startupTermsTick")')),'Terms visible again');
    if(!await read('document.querySelector("#startupTermsAccept")?.disabled'))throw new Error('Read Again left Accept enabled');
    await capture('terms-read-again');
  });
  await step('S3','Accept Terms and reach native Sign In without live backend',async()=>{
    await click('#startupTermsTick');
    if(await read('document.querySelector("#startupTermsAccept")?.disabled'))throw new Error('Checked consent did not unlock Accept');
    await capture('terms-ready-to-accept');
    await click('#startupTermsAccept');
    await waitFor(async()=>!!(await read('!!document.querySelector("#loginEmail")')),'Sign In screen after Terms',75000);
    if(!await read('!!document.querySelector("#loginPassword[type=password]")'))throw new Error('Password not initially hidden');
    await capture('sign-in');
  });
  await step('S4','Password visibility toggles without submitting credentials',async()=>{
    // Auth screen inserts fields after the password-visibility module loads.
    // The actual user gesture focuses the password and mounts its control.
    await read('(() => {const el=document.querySelector("#loginPassword");if(!el)return false;el.focus();return true;})()');
    await waitFor(async()=>!!(await read('!!document.querySelector("#loginPassword-show-password")')),'password visibility control');
    await click('#loginPassword-show-password');
    if(!await read('document.querySelector("#loginPassword")?.type==="text"'))throw new Error('Show password failed');
    await capture('password-visible');
    await click('#loginPassword-show-password');
    if(!await read('document.querySelector("#loginPassword")?.type==="password"'))throw new Error('Hide password failed');
  });
  await step('S5','Forgot Password rejects blank email without network write',async()=>{
    await click('#forgotBtn');
    await assertText('Enter your email address first');
    await capture('forgot-password-validation');
  });
  await step('S6','Join flow requires six-digit PIN; no account is created',async()=>{
    await click('#joinTab');
    await waitFor(async()=>!!(await read('!!document.querySelector("#inviteCode")')),'Join page');
    await capture('join-page');
    await click('#redeemBtn');
    await assertText('six-digit FIDUNIO PIN');
    await capture('join-pin-required');
  });
  await step('S7','App restart preserves Terms and does not expose a chat',async()=>{
    await click('#signInTab');
    if(platform==='android')execFileSync('adb',['shell','am','force-stop',APP]);
    else d.terminate(APP);
    d.disconnect?.();
    await sleep(1200);
    d.launch(APP);
    await waitFor(async()=>!!(await read('!!document.querySelector("#loginEmail")')),'Sign In after restart',65000);
    if(await read('!!document.querySelector("#startupTermsTick")'))throw new Error('Previously accepted Terms lost');
    if(await read('!!document.querySelector(".conversation-list")'))throw new Error('An unauthenticated chat was displayed');
    await capture('sign-in-after-restart');
  });
}catch(e){
  if(!failed)failed++;
  log('\nStopped: '+String(e.message||e).slice(0,500));
}finally{
  log('\nFINAL '+passed+' passed, '+failed+' failed');
  writeReport();
  d.disconnect?.();
}
process.exit(failed?1:0);
