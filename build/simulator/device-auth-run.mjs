/* Authenticated actions in the ACTUAL installed Android / iOS WebView.
 * The app is an isolated debug build; Firebase Auth/Firestore/Storage are real
 * local emulators. Only the recovery enrollment callable has a LOCAL substitute.
 * Push receipt, peer-side decryption, and physical device features are UNTESTED. */
import fs from 'node:fs';
import path from 'node:path';
import {initializeTestEnvironment} from '@firebase/rules-unit-testing';

const platform=process.argv[2],out=path.resolve(process.argv[3]||'out-fidunio/native-auth'),artifact=process.argv[4];
if(!['android','ios'].includes(platform)||!artifact)throw new Error('Usage: device-auth-run.mjs android|ios OUT APP');
if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8080'||process.env.FIREBASE_AUTH_EMULATOR_HOST!=='127.0.0.1:9099')
  throw new Error('Refusing authenticated native run without local Auth/Firestore emulators');
const fixture=JSON.parse(fs.readFileSync(path.join(path.dirname(out),'native-fixture.json'),'utf8'));
if(fixture.project!=='demo-fidunio-simulator-tests')throw new Error('Refusing non-demo Firebase project');
const d=await import(platform==='android'?'./adb.mjs':'./sim.mjs');
const APP='io.github.willyros01.fidunio';
if(platform==='android')d.use(APP);
fs.mkdirSync(out,{recursive:true});
const tests=[],shots=[];
const env=await initializeTestEnvironment({projectId:fixture.project,firestore:{host:'127.0.0.1',port:8080}});
const log=(line)=>{console.log(line);fs.appendFileSync(path.join(out,'report.txt'),line+'\n');};
const expr=(s)=>d.js(s);
const present=(s)=>expr(`!!document.querySelector(${JSON.stringify(s)})`);
const val=(s)=>expr(`document.querySelector(${JSON.stringify(s)})?.value`);
const text=()=>d.appText();
async function wait(fn,label,timeout=60000){const until=Date.now()+timeout;let issue='';while(Date.now()<until){try{if(await fn())return;}catch(e){issue=String(e.message);}await d.sleep(1000);}throw new Error('Timed out waiting for '+label+'; '+issue+'; screen: '+String(await text()).replace(/\s+/g,' ').slice(0,350));}
async function shot(label){await d.sleep(600);const file=String(shots.length+1).padStart(2,'0')+'-'+label+'.png';d.shot(path.join(out,file));shots.push({label,file});log('  Actual native screenshot: '+file);}
async function readDoc(p){let data;await env.withSecurityRulesDisabled(async c=>{const snap=await c.firestore().doc(p).get();data=snap.exists?{id:snap.id,...snap.data()}:null;});return data;}
async function readCollection(p){let data;await env.withSecurityRulesDisabled(async c=>{const snap=await c.firestore().collection(p).get();data=snap.docs.map(x=>({id:x.id,...x.data()}));});return data;}
async function test(id,label,fn,{requires=true}={}){
  log('\n'+id+': '+label);
  if(!requires){tests.push({id,label,status:'BLOCKED',detail:'Earlier prerequisite failed'});log('BLOCKED '+id);return false;}
  try{const detail=await fn();tests.push({id,label,status:'PASS',detail:String(detail||'Observed on native device')});log('PASS '+id);return true;}
  catch(e){
    let phase='';
    if(platform==='ios'){
      try{phase=String(await expr('globalThis.FIDUNIO_SIMULATOR_ONLY_PHASE||"unavailable"'));}catch{}
    }
    const detail=(String(e?.stack||e).slice(0,1050))+(phase?'\nSIMULATOR DIAGNOSTIC PHASE: '+phase:'');
    tests.push({id,label,status:'FAIL',detail});log('FAIL '+id+': '+detail);
    try{await shot(id+'-failure');}catch(err){log('Capture failed: '+err.message);}
    return false;
  }
}
function summarize(){
  const passed=tests.filter(t=>t.status==='PASS').length,failed=tests.filter(t=>t.status==='FAIL').length,blocked=tests.filter(t=>t.status==='BLOCKED').length;
  const result=failed||blocked?'FAIL':'PASS';
  const lines=[`# FIDUNIO authenticated ${platform==='ios'?'iPhone':'Android'} native simulator results`,'',
    `**${result} — ${passed} passed, ${failed} failed, ${blocked} blocked**`,'',
    '- Installed app: disposable native debug binary built from '+(platform==='ios'?'ios':'Android')+' release source',
    '- Local Firebase: Auth, Firestore with original rules, Storage — demo-fidunio-simulator-tests ONLY',
    '- Backend exception: enrollRecoveryV1 uses a localhost implementation of the repository recovery wrapper; production Cloud Functions are NOT validated.',
    '- Native UI operations are genuine app control gestures via OS WebView inspector; database assertions read the emulator, not production.',
    '- No ADM, APNs, FCM provider delivery, physical biometrics, real camera, or peer-device decryption is claimed.',
    '', '## Functional results',''];
  for(const t of tests)lines.push(`### ${t.id} — ${t.status}: ${t.label}`,'',t.detail,'');
  lines.push('## Captured native screens','');
  for(const s of shots)lines.push('### '+s.label,'',`![${s.label}](${s.file})`,'');
  lines.push('## Execution record','','```text',fs.readFileSync(path.join(out,'report.txt'),'utf8'),'```','');
  fs.writeFileSync(path.join(out,'REPORT.md'),lines.join('\n'));
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({platform,passed,failed,blocked,result,tests,shots},null,2)+'\n');
}
try{
  log('Native authenticated '+platform+' suite. LOCAL demo-only accounts.');
  d.disconnect?.();
  d.reinstall(APP,artifact);
  d.launch(APP);
  const t1=await test('N01','Accept legal Terms and open actual Join form',async()=>{
    await d.waitApp(/Terms of Use/,65000);
    await d.press('#startupTermsTick');await d.press('#startupTermsAccept');
    await wait(()=>present('#joinTab'),'Join tab');await d.press('#joinTab');
    await wait(()=>present('#joinPinHost'),'six-digit native PIN input');
    await shot('native-join-screen');
  });
  if(t1){
    const host=platform==='android'?'10.0.2.2':'127.0.0.1';
    // Network probe is diagnostic only and never substitutes for authentic
    // Firebase API assertions. no-cors avoids false failures from CORS rules.
    await expr(`(() => {window.__nativeSimulatorNet={state:'pending'};fetch('http://${host}:8080/',{mode:'no-cors'}).then(()=>window.__nativeSimulatorNet={state:'reachable'},e=>window.__nativeSimulatorNet={state:'failed',error:String(e)});return true})()`);
    await d.sleep(2500);
    log('  Local Firestore HTTP probe: '+String(await expr('JSON.stringify(window.__nativeSimulatorNet)')));
  }
  const t2=await test('N02','Consume a real single-use admin invite, set PIN, create E2EE identity through native Join',async()=>{
    await d.fill('#inviteCode',fixture.inviteToken);
    await d.fill('#joinName',fixture.alice.name);
    await d.fill('#joinEmail',fixture.alice.email);
    await d.fill('#joinPassword',fixture.alice.password);
    // Interact with six mounted PIN slots. Changing the first slot may
    // redistribute input; inspect every digit before Join.
    const slots=await expr('document.querySelectorAll("#joinPinHost .pin-code-slot").length');
    if(slots!==6)throw new Error('Six-slot PIN field not mounted: '+slots);
    for(let i=0;i<6;i++)await d.fill(`#joinPinHost .pin-code-slot:nth-child(${i+1})`,fixture.alice.pin[i]);
    if(await expr('[...document.querySelectorAll("#joinPinHost .pin-code-slot")].map(x=>x.value).join("")')!==fixture.alice.pin)
      throw new Error('Native PIN component did not retain all six digits');
    await shot('native-join-completed');
    await d.press('#redeemBtn');
    await wait(async()=>!!(await present('#newBtn'))||!!(await present('#tabletNewBtn'))||/Messages/.test(await text())&&!await present('#redeemBtn'),'authenticated Messages screen',90000);
    const invite=await readDoc('invitations/'+fixture.inviteId);
    if(invite?.status!=='accepted'||!invite?.acceptedUid)throw new Error('Invite not consumed by authentic native join: '+invite?.status);
    const profile=await readDoc('users/'+invite.acceptedUid);
    if(profile?.systemRole!=='admin'||profile.email!==fixture.alice.email)throw new Error('Created account lacks Admin role or correct email');
    const identity=await readDoc('users/'+invite.acceptedUid+'/e2ee/identity');
    if(!identity)throw new Error('No genuine native E2EE identity in emulator');
    await shot('native-authenticated-messages');
    const volatileKeyFallback=platform==='ios'&&await expr('globalThis.FIDUNIO_SIMULATOR_ONLY_IDB_KEY_FALLBACK===true');
    if(volatileKeyFallback)log('  SIMULATOR-ONLY iPhone volatile CryptoKey fallback was used; IndexedDB key persistence/restart NOT VERIFIED');
    return 'Admin invitation accepted; real Auth profile and account E2EE identity created in local Firebase'+(volatileKeyFallback?' (iPhone volatile key-cache workaround used)':'');
  },{requires:t1});
  const me=(await readDoc('invitations/'+fixture.inviteId))?.acceptedUid;
  const t3=await test('N03','Change actual native Settings: A++, Dark, and preview option',async()=>{
    const settings=await present('#settingsBtn')?'#settingsBtn':'#tabletSettingsBtn';await d.press(settings);
    await wait(()=>present('#fidunioSettingsShell'),'Settings sidebar/panels');
    await d.press('.text-size-btn[data-text-size="xlarge"]');
    if(!await expr('document.querySelector(".text-size-btn[data-text-size=xlarge]")?.classList.contains("active")'))throw new Error('A++ not active');
    await d.press('.appearance-btn[data-appearance="dark"]');
    if(!await expr('document.querySelector(".appearance-btn[data-appearance=dark]")?.classList.contains("active")'))throw new Error('Dark not active');
    await shot('native-settings-large-dark');
    return 'On-device Settings widgets changed and rendered selected values';
  },{requires:t2});
  const t4=await test('N04','Admin creates a new user invitation from native Settings',async()=>{
    // Settings sections may be stacked or tabbed depending on native width.
    await d.press('.fidunio-settings-nav-btn[data-group="invites"]');
    await wait(()=>present('#createInviteBtn'),'Admin create-invite control');
    await d.press('#createInviteBtn');await wait(()=>present('#inviteModalCreate'),'invite dialog');
    await d.press('#inviteModalCreate');
    await wait(()=>present('#inviteResult .uid-box'),'new invitation link',50000);
    const invites=await readCollection('invitations');
    if(!invites.some(i=>i.status==='pending'&&i.invitedByUid===me&&i.role==='user'))throw new Error('No fresh native-created invitation in Firestore');
    await shot('native-admin-invitation');
    return 'Admin UI created an authentic single-use invitation in local Firestore';
  },{requires:t3});
  const t5=await test('N05','Start a native direct conversation with Bob',async()=>{
    await d.press('#backBtn');
    await wait(()=>present('#newBtn'),'Messages navigation');
    await d.press('#newBtn');await wait(()=>present('#peerUid'),'recipient control');
    await d.fill('#peerUid',fixture.peers.find(p=>p.label==='Bob').uid);await d.press('#cloudDirectBtn');
    await wait(()=>present('#messageBox'),'direct chat composer',65000);
    await shot('native-direct-chat');
  },{requires:t3});
  const t6=await test('N06','Send encrypted direct text and confirm NO plaintext in emulator',async()=>{
    const message='NATIVE_DIRECT_'+Date.now();
    await d.fill('#messageBox',message);await d.press('#sendBtn');
    await wait(async()=>{const cs=await readCollection('conversations');return cs.some(c=>Array.isArray(c.members)&&c.members.includes(me));},'direct conversation write',65000);
    const cs=await readCollection('conversations');
    const row=cs.find(c=>c.id.startsWith('dm_')&&Array.isArray(c.members)&&c.members.includes(me));
    if(!row)throw new Error('No authenticated direct conversation in local Firestore');
    await wait(async()=>{const msgs=await readCollection('conversations/'+row.id+'/messages');return msgs.some(m=>m.ciphertext||m.e2ee);},'encrypted direct message commit',75000);
    const msgs=await readCollection('conversations/'+row.id+'/messages');
    if(msgs.some(m=>JSON.stringify(m).includes(message)))throw new Error('PLAINTEXT FOUND in stored direct payload');
    await shot('native-direct-message-sent');
    return 'Native composer sent an encrypted message with no plaintext in Firestore';
  },{requires:t5});
  const t7=await test('N07','Set disappearing timer in real native direct conversation',async()=>{
    await wait(()=>present('#disappearSelect'),'disappearing control');
    const allowed=await expr('[...document.querySelector("#disappearSelect").options].map(x=>x.value)');
    const duration=allowed.find(x=>x!=='off'&&Number(x)>0);
    if(!duration)throw new Error('No available disappearing preset');
    await d.fill('#disappearSelect',duration);
    await wait(async()=>String(await val('#disappearSelect'))===duration,'disappearing preference');
    await shot('native-disappearing-setting');
    return 'Actual per-conversation disappearing selector changed to '+duration+' seconds';
  },{requires:t5});
  const t8=await test('N08','React with an emoji to an accepted direct message',async()=>{
    await wait(async()=>!!(await present('#chatArea .pending-message-action')),'eligible message action',65000);
    // Keyboard Enter opens the exact same native action handler as a long-press.
    const opened=await expr('(() => {const m=document.querySelector("#chatArea .pending-message-action");if(!m)return false;m.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true,cancelable:true}));return true})()');
    if(!opened)throw new Error('No native message action target');
    await wait(()=>present('.message-reaction-btn'),'reaction choices',40000);
    await d.press('.message-reaction-btn');
    await wait(async()=>!(await present('.message-reaction-btn')),'reaction modal closed');
    await shot('native-emoji-reaction');
    return 'Native message action displayed and applied emoji reaction';
  },{requires:t6});
  const t9=await test('N09','Create group from native app and verify admin controls',async()=>{
    await d.press('#backBtn');await wait(()=>present('#newBtn'),'Messages before group creation');
    await d.press('#newBtn');await d.press('#newGroupBtn');
    await wait(async()=>await expr('document.querySelectorAll("#memberChoices .member-option").length')>=2,'real Firebase user directory',65000);
    for(const label of ['Bob','Carol']){
      const uid=fixture.peers.find(x=>x.label===label).uid;
      await d.press(`#memberChoices .member-option[data-id="${uid}"]`);
    }
    await d.press('#nextBtn');await wait(()=>present('#groupNameInput'),'Group Details');
    await d.fill('#groupNameInput','Native Simulator Group');await d.press('#createGroupBtn');
    await wait(()=>present('#messageBox'),'group chat composer',70000);
    await shot('native-group-created');
    await d.press('#infoBtn');await wait(()=>present('#renameBtn'),'group admin controls',40000);
    if(!await present('#addMemberBtn')||!await present('.removeMemberBtn'))throw new Error('Group administrator lacks add/remove-member UI');
    await shot('native-group-admin');
    return 'Real group creation and group-admin rename/add/remove controls visible in native app';
  },{requires:t2});
  const t10=await test('N10','Send a native group message and verify encrypted group record',async()=>{
    await d.press('#backBtn');await wait(()=>present('#messageBox'),'group composer');
    const message='NATIVE_GROUP_'+Date.now();
    await d.fill('#messageBox',message);await d.press('#sendBtn');
    const groups=await readCollection('groups');
    const group=groups.find(g=>g.name==='Native Simulator Group');
    if(!group)throw new Error('New group absent from emulator');
    await wait(async()=>{const docs=await readCollection('groups/'+group.id+'/messages');return docs.length>0;},'group ciphertext',80000);
    const docs=await readCollection('groups/'+group.id+'/messages');
    if(docs.some(m=>JSON.stringify(m).includes(message)))throw new Error('PLAINTEXT FOUND in group Firestore message');
    await shot('native-group-message-sent');
    return 'Actual native group composer wrote encrypted content to local Firestore';
  },{requires:t9});
  const t11=await test('N11','Use native group administrator to add a member',async()=>{
    await d.press('#infoBtn');await wait(()=>present('#addMemberBtn'),'Group Info administrator');
    await d.press('#addMemberBtn');await wait(()=>present('#modalConfirm'),'Add Member list',60000);
    const owner=fixture.peers.find(x=>x.label==='Owner').uid;
    if(!await present(`input[name="newMember"][value="${owner}"]`))throw new Error('Owner not listed as eligible new member');
    await d.press(`input[name="newMember"][value="${owner}"]`);
    await d.press('#modalConfirm');
    const groups=await readCollection('groups');const group=groups.find(g=>g.name==='Native Simulator Group');
    if(!group)throw new Error('Native group missing');
    await wait(async()=>!!(await readDoc(`groups/${group.id}/members/${owner}`)),'member addition stored',60000);
    await shot('native-group-member-added');
    return 'Native Group Info added Owner account as a new member; Firestore membership confirmed';
  },{requires:t10});
  const t12=await test('N12','Show native notification configuration controls (delivery requires real devices)',async()=>{
    // Group Info -> Chat -> Messages is two levels. Other app layouts can
    // already have returned to Messages, so inspect before each transition.
    for(let n=0;n<3 && !(await present('#settingsBtn')) && !(await present('#tabletSettingsBtn'));n++){
      if(!await present('#backBtn'))throw new Error('No Settings or Back control during navigation');
      await d.press('#backBtn');
    }
    const settings=await present('#settingsBtn')?'#settingsBtn':'#tabletSettingsBtn';
    await d.press(settings);
    await wait(()=>present('#fidunioSettingsShell'),'Settings');
    await d.press('.fidunio-settings-nav-btn[data-group="notifications"]');
    if(!await present('#fidunioSettingsPanel-notifications'))throw new Error('Notification settings section missing');
    await shot('native-notification-settings');
    return 'Notification UI exists and renders. Actual ADM/APNs push reception NOT tested';
  },{requires:t10});
  const t13=await test('N13','Block and unblock a native user in Safety settings',async()=>{
    await d.press('.fidunio-settings-nav-btn[data-group="safety"]');
    const bob=fixture.peers.find(x=>x.label==='Bob').uid;
    await wait(()=>present(`#blockUserSelect option[value="${bob}"]`),'blockable user directory',55000);
    await d.fill('#blockUserSelect',bob);
    if(platform==='android'){
      // The real Android app uses a native window.confirm() dialog here.
      // Web Inspector pauses Runtime.evaluate while that OS dialog is open;
      // accept it with OS accessibility/ADB, not by mocking confirm() in JS.
      await Promise.all([
        d.press('#blockUserBtn'),
        (async()=>{await d.sleep(900);await d.tapText(/^OK$/);})(),
      ]);
    }else{
      await d.press('#blockUserBtn');
    }
    await wait(()=>present(`.unblockUserBtn[data-uid="${bob}"]`),'blocked user row',60000);
    await shot('native-user-blocked');
    await d.press(`.unblockUserBtn[data-uid="${bob}"]`);
    await wait(async()=>!(await present(`.unblockUserBtn[data-uid="${bob}"]`)),'user unblocked',55000);
    await shot('native-user-unblocked');
    return 'Real native Safety UI blocked then unblocked an existing FIDUNIO account';
  },{requires:t12});
  const t14=await test('N14','A++ and Dark settings survive leaving and reopening native Settings',async()=>{
    await d.press('#backBtn');
    await wait(()=>present('#settingsBtn'),'Messages navigation');await d.press('#settingsBtn');
    await wait(()=>present('.text-size-btn[data-text-size="xlarge"]'),'text size setting');
    if(!await expr('document.querySelector(".text-size-btn[data-text-size=xlarge]")?.classList.contains("active")'))throw new Error('A++ reverted after navigation');
    if(!await expr('document.querySelector(".appearance-btn[data-appearance=dark]")?.classList.contains("active")'))throw new Error('Dark reverted after navigation');
    await shot('native-persisted-settings');
    return 'A++ and Dark retained after navigating away and back within actual native app';
  },{requires:t13});
  if([t1,t2,t3,t4,t5,t6,t7,t8,t9,t10,t11,t12,t13,t14].some(x=>!x))log('Native authenticated suite found failures or blocked checks — no production code modified.');
}catch(e){log('FATAL native test setup: '+String(e.stack||e).slice(0,1500));tests.push({id:'SETUP',status:'FAIL',label:'Native test setup',detail:String(e.stack||e)});}
finally{summarize();await env.cleanup();d.disconnect?.();}
process.exit(tests.some(t=>t.status!=='PASS')?1:0);
