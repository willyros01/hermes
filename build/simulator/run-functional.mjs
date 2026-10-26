/*
 * Authenticated FIDUNIO transport integration. Disposable accounts only.
 * Exercises the exported application functions against the real Auth/Firestore
 * emulators and original security rules. This is not a physical push test and
 * test ciphertext is a deliberately synthetic envelope (not an E2EE proof).
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {chromium,webkit} from 'playwright';
import {initializeTestEnvironment,assertFails} from '@firebase/rules-unit-testing';

const project='demo-fidunio-simulator-tests';
const out=path.resolve(process.argv[2]||'out-fidunio/functional');
const source=path.resolve(process.argv[3]||'.');
const engine=process.argv[4]||'chromium';
const label=process.argv[5]||'Android-shared';
const root=path.join(source,'www');
const failures=[];
const cases=[];
const pages=[];
const origin='http://127.0.0.1';
const host=process.env.FIRESTORE_EMULATOR_HOST;
if(!['chromium','webkit'].includes(engine)||!fs.existsSync(path.join(root,'SIMULATOR-ONLY.txt')))
  throw new Error('Functional browser requires an explicitly patched disposable app');
if(!/^(127\.0\.0\.1|localhost):8080$/.test(host||'')||
   process.env.FIREBASE_AUTH_EMULATOR_HOST!=='127.0.0.1:9099')
  throw new Error('Refusing functional tests without local demo Firebase emulators');
const config=fs.readFileSync(path.join(root,'firebase-config.js'),'utf8');
if(!config.includes(project)||config.includes('fidunio-fef13'))
  throw new Error('Only the demo-fidunio simulator Firebase configuration is permitted');

// For web main-3 ONLY: expose existing production renderer to a synthetic,
// explicitly labelled message fixture. Auth and reaction transactions still
// use real SDK sessions and original emulator Firestore rules. This fixture
// bypasses encrypted-body hydration; it is NOT a peer E2EE/decryption test.
if(label.startsWith('Web-main3')){
  if(!fs.existsSync(path.join(root,'SIMULATOR-ONLY.txt'))||!['demo-fidunio-simulator-tests'].includes(project))
    throw Error('Refusing non-disposable UI fixture');
  const probe = String.raw`
export async function __FIDUNIO_SIM_PROJECT_GROUP_REACTIONS({groupId,messageId,sourceUid,members}){
  if(location.hostname!=="127.0.0.1"||!String(location.origin).startsWith("http://127.0.0.1:"))
    throw Error("Reaction probe blocked outside localhost");
  firebaseUser=getFirebaseUser();
  if(!firebaseUser?.uid)throw Error("Emulator actor must sign in");
  const group={id:groupId,type:"group",cloudGroup:true,name:"Simulator group",members,unread:0};
  state.conversations=[group,...state.conversations.filter(c=>String(c.id)!==String(groupId))];
  state.messages[groupId]=[{id:messageId,senderUid:sourceUid,mine:firebaseUser.uid===sourceUid,sender:"Simulator Owner",state:"sent",text:"Encrypted group payload (simulator projection only)",time:"10:26",createdAt:new Date(),cloud:true,authoritativeSource:true,reactions:{}}];
  state.unlocked=true;state.selectedId=groupId;state.route="chat";state.modal=null;
  render();
  const {subscribeCloudGroupMessages}=await import("./firebase.js");
  globalThis.__FIDUNIO_SIM_REACTION_UNSUB?.();
  globalThis.__FIDUNIO_SIM_REACTION_UNSUB=subscribeCloudGroupMessages(groupId,rows=>{
    const row=rows.find(item=>String(item.id)===String(messageId));
    if(!row)return;
    state.messages[groupId]=[{
      ...row,id:messageId,senderUid:sourceUid,
      mine:firebaseUser.uid===sourceUid,sender:"Simulator Owner",
      state:row.state||"sent",text:"Encrypted group payload (simulator projection only)",
      time:"10:26",createdAt:row.createdAt?.toDate?.()||new Date(),
      cloud:true,authoritativeSource:true
    }];
    render({background:true});
  },err=>{globalThis.__FIDUNIO_SIM_REACTION_LISTENER_ERROR=String(err?.message||err);});
  return true;
}
`;
  fs.appendFileSync(path.join(root,'app.js'),probe);
}

fs.mkdirSync(out,{recursive:true});
let server,testEnv,browser;
let serial=0;
const trace=(id,detail)=>{
  cases.push({id,status:'PASS',detail});
  console.log('PASS '+id+' — '+detail);
};
async function check(id,fn){
  try{const description=await fn();trace(id,description||id);return true;}
  catch(error){const msg=String(error?.message||error);cases.push({id,status:'FAIL',detail:msg});failures.push(id+': '+msg);console.error('FAIL '+id+' — '+msg);return false;}
}
async function rejected(fn,message){
  let failed=false;
  try{await fn();}catch(error){failed=true;if(message&&!String(error?.message||error).includes(message))
    throw new Error('Rejected with unexpected reason: '+String(error?.message||error));}
  assert.ok(failed,'unauthorized operation was accepted');
}
async function createOwner(){
  const email=`owner-${engine}-${process.env.GITHUB_RUN_ID||Date.now()}@simulator.invalid`;
  const password='SimulatorOnly-554411!';
  const r=await fetch(origin+':9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-only',{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({email,password,returnSecureToken:true})
  });
  const data=await r.json();
  if(!r.ok||!data.localId)throw new Error('Local owner account could not be created: '+JSON.stringify(data).slice(0,300));
  await testEnv.withSecurityRulesDisabled(async ctx=>{
    const db=ctx.firestore();
    await db.doc('users/'+data.localId).set({displayName:'Simulator Owner',email,systemRole:'owner',active:true});
    await db.doc('system/access').set({ownerUid:data.localId,createdByUid:data.localId,accessModel:'invite-only-v1'});
  });
  return {uid:data.localId,email,password,role:'owner'};
}
async function newActor(){
  const ctx=await browser.newContext({viewport:{width:390,height:844}});
  // Strict route allowlist: browser code cannot call a production Firebase URL.
  await ctx.route('**/*',route=>{
    const url=route.request().url();
    if(url.startsWith(base+'/') ||
       url.startsWith('https://www.gstatic.com/firebasejs/') ||
       [8080,9099,9199,5001].some(port=>url.startsWith(origin+':'+port+'/')))
      return route.continue();
    return route.abort();
  });
  const page=await ctx.newPage();
  pages.push({page,ctx});
  await page.goto(base+'/__fidunio_simulator__.html');
  await page.evaluate(async()=>{
    const api=await import('/firebase.js');
    const s=await api.initFirebase();
    await s.auth.authStateReady();
  });
  return page;
}
async function invoke(page,fn,...args){
  return page.evaluate(async({fn,args})=>{
    const api=await import('/firebase.js');
    if(typeof api[fn]!=='function')throw new Error('Unknown application API '+fn);
    return api[fn](...args);
  },{fn,args});
}
async function enroll(ownerPage,role,name){
  const invite=await invoke(ownerPage,'createFidunioInvitation',role,7);
  const page=await newActor();
  const valid=await invoke(page,'validateInvitation',invite.token);
  assert.equal(valid.role,role);
  const email=`${name.toLowerCase()}-${engine}-${Date.now()}-${++serial}@simulator.invalid`;
  const password='SimulatorOnly-554411!';
  const account=await invoke(page,'redeemFidunioInvitation',invite.token,email,password,name);
  assert.ok(account.uid);
  return {page,uid:account.uid,email,role,token:invite.token,id:invite.id};
}
async function seedE2eeKeys(people){
  await testEnv.withSecurityRulesDisabled(async ctx=>{
    const db=ctx.firestore();
    for(const person of people){
      const keyId='test-key-'+person.uid;
      person.keyId=keyId;
      await db.doc('e2eePublicKeys/'+person.uid).set({
        uid:person.uid,keyId,schemaVersion:1,identityVersion:1,
        keyAlgorithm:'ECDH-P256',publicJwk:{kty:'EC',crv:'P-256',x:'simulated-x',y:'simulated-y'},
        state:'ACTIVE',createdAt:new Date(),updatedAt:new Date()
      });
    }
  });
}
async function readAdmin(collectionPath){
  let value=null;
  await testEnv.withSecurityRulesDisabled(async ctx=>{
    const snap=await ctx.firestore().doc(collectionPath).get();
    value=snap.exists?snap.data():null;
  });
  return value;
}
const contentTypes={'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.webmanifest':'application/manifest+json'};
let base;
try{
  server=http.createServer((req,res)=>{
    try{
      const pathname=decodeURIComponent(new URL(req.url,origin).pathname);
      if(pathname==='/__fidunio_simulator__.html'){
        res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FIDUNIO isolated emulator client</title><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/styles-0.9.0.css"><link rel="stylesheet" href="/local-security-ui.css"><link rel="stylesheet" href="/settings-sidebar.css"><body><div id="app"></div></body></html>');return;
      }
      const file=path.resolve(root,'.'+pathname);
      if(!file.startsWith(root+path.sep))throw new Error('outside test root');
      res.setHeader('Content-Type',contentTypes[path.extname(file)]||'application/octet-stream');
      res.end(fs.readFileSync(file));
    }catch{res.statusCode=404;res.end('Not found');}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  base=origin+':'+server.address().port;
  testEnv=await initializeTestEnvironment({projectId:project,firestore:{host:'127.0.0.1',port:8080}});
  browser=await ({chromium,webkit}[engine]).launch();
  let owner,alice,bob,carol,admin,groupId,directId;
  const setup=await check('FN-001',async()=>{
    owner=await createOwner();owner.page=await newActor();
    const user=await invoke(owner.page,'signInFidunio',owner.email,owner.password);
    assert.equal(user.uid,owner.uid);
    assert.equal((await invoke(owner.page,'getFidunioAccessInfo')).role,'owner');
    return 'Disposable Owner signs in using the original FIDUNIO API and demo Auth/Firestore';
  });
  if(!setup)throw new Error('Cannot proceed without isolated owner seed');
  await check('FN-002',async()=>{
    alice=await enroll(owner.page,'user','Alice');
    bob=await enroll(owner.page,'user','Bob');
    carol=await enroll(owner.page,'user','Carol');
    admin=await enroll(owner.page,'admin','Admin');
    assert.equal((await readAdmin('invitations/'+alice.id)).status,'accepted');
    assert.equal((await readAdmin('users/'+alice.uid)).joinedByInviteId,alice.id);
    assert.equal((await invoke(admin.page,'getFidunioAccessInfo')).role,'admin');
    return 'Owner sends four actual invitations; recipients consume them; Auth accounts and Firestore profiles created';
  });
  if(!alice||!bob||!carol||!admin)throw new Error('Enrollment prerequisites failed');
  await check('FN-003',async()=>{
    await rejected(()=>invoke(owner.page,'validateInvitation',alice.token),'already been used');
    await rejected(()=>invoke(alice.page,'createFidunioInvitation','user',7),'Only');
    const fromAdmin=await invoke(admin.page,'createFidunioInvitation','user',1);
    assert.equal(fromAdmin.role,'user');
    await invoke(owner.page,'revokeFidunioInvitation',fromAdmin.id);
    await rejected(()=>invoke(bob.page,'validateInvitation',fromAdmin.token),'no longer active');
    await rejected(()=>invoke(alice.page,'listPendingFidunioInvitations'));
    return 'Used/revoked invitation rejected; User cannot issue/list invites; Admin can issue and Owner revokes';
  });
  await check('FN-004',async()=>{
    const conv=await invoke(owner.page,'startDirectConversation',alice.uid);
    directId=conv.id;
    assert.ok(directId.startsWith('dm_'));
    const remote=await invoke(alice.page,'getCloudConversationFromServer',directId,alice.uid);
    assert.equal(remote.id,directId);
    await rejected(()=>invoke(bob.page,'getCloudConversationFromServer',directId,bob.uid));
    return 'Original direct-conversation API creates shared record; outsider read denied by real rules';
  });
  await check('FN-005',async()=>{
    await seedE2eeKeys([owner,alice,bob,carol,admin]);
    const message={id:'test-direct-'+engine,timeLabel:'10:22',e2ee:3,kdfVersion:1,
      senderKeyId:owner.keyId,recipientKeyId:alice.keyId,ciphertext:'Q'.repeat(40),iv:'A'.repeat(16),
      disappearAfterSeconds:60,disappearingPurgeVersion:1};
    await invoke(owner.page,'sendCloudMessage',directId,message);
    let row=await readAdmin(`conversations/${directId}/messages/${message.id}`);
    assert.equal(row.text,'');assert.equal(row.disappearAfterSeconds,60);
    assert.equal(row.disappearingPurgeVersion,1);
    await rejected(()=>invoke(owner.page,'updateCloudMessageState',directId,message.id,'read'),'Sender cannot');
    await invoke(alice.page,'updateCloudMessageState',directId,message.id,'delivered');
    await invoke(alice.page,'updateCloudMessageState',directId,message.id,'read');
    row=await readAdmin(`conversations/${directId}/messages/${message.id}`);
    assert.equal(row.state,'read');
    await invoke(alice.page,'setCloudMessageReaction',directId,message.id,'direct','❤️','apply');
    assert.equal((await readAdmin(`conversations/${directId}/messages/${message.id}`)).reactions[alice.uid],'❤️');
    await invoke(alice.page,'setCloudMessageReaction',directId,message.id,'direct','❤️','remove');
    assert.equal((await readAdmin(`conversations/${directId}/messages/${message.id}`)).reactions[alice.uid],undefined);
    await rejected(()=>invoke(alice.page,'setCloudMessageReaction',directId,message.id,'direct','🔥','apply'),'Unsupported');
    return 'Direct encrypted-envelope transport, disappearing metadata, sent→delivered→read, emoji add/remove/invalid';
  });
  await check('FN-006',async()=>{
    await invoke(owner.page,'blockFidunioUser',alice.uid);
    const blocks=await invoke(owner.page,'listFidunioBlockedUsers');
    assert.ok(blocks.some(r=>r.blockedUid===alice.uid));
    await rejected(()=>invoke(owner.page,'sendCloudMessage',directId,{id:'blocked-msg',timeLabel:'10:24',e2ee:3,kdfVersion:1,senderKeyId:owner.keyId,recipientKeyId:alice.keyId,ciphertext:'Q'.repeat(40),iv:'A'.repeat(16)}));
    await invoke(owner.page,'unblockFidunioUser',alice.uid);
    assert.ok(!(await invoke(owner.page,'listFidunioBlockedUsers')).some(r=>r.blockedUid===alice.uid));
    return 'Block denies direct transport in actual Firestore rules; unblock removes restriction';
  });
  await check('FN-007',async()=>{
    const group=await invoke(owner.page,'createCloudGroup','Simulator Golf Buddies',[alice.uid,bob.uid]);
    groupId=group.id;
    assert.ok(groupId);
    const authority=await invoke(alice.page,'readCloudGroupAuthority',groupId);
    assert.deepEqual(new Set(authority.memberUids),new Set([owner.uid,alice.uid,bob.uid]));
    await rejected(()=>invoke(carol.page,'readCloudGroupAuthority',groupId));
    return 'Original group creation writes owner, two members and membership metadata; outsider denied';
  });
  await check('FN-008',async()=>{
    await rejected(()=>invoke(alice.page,'renameCloudGroup',{groupId,name:'Unauthorized Rename'}),'Only a group administrator');
    await invoke(owner.page,'renameCloudGroup',{groupId,name:'Renamed by Owner'});
    assert.equal((await readAdmin('groups/'+groupId)).name,'Renamed by Owner');
    await rejected(()=>invoke(owner.page,'commitCloudGroupMembershipEpoch',{
      groupId,operation:'remove',targetUid:owner.uid,expectedEpoch:0,newEpoch:1,record:{}
    }),'owner cannot');
    return 'Only group admin can rename; owner cannot be removed';
  });
  await check('FN-009',async()=>{
    const messageId='test-group-'+engine;
    await invoke(owner.page,'sendCloudEncryptedGroupMessage',{
      groupId,messageId,disappearAfterSeconds:120,disappearingPurgeVersion:1,
      envelope:{e2ee:4,groupFormat:'fidunio-group-message-v1',keyEpoch:0,senderKeyId:owner.keyId,
        ciphertext:'R'.repeat(48),iv:'B'.repeat(16),timeLabel:'10:26'}
    });
    const read=await invoke(alice.page,'getCloudGroupMessageFromServer',groupId,alice.uid,messageId);
    assert.equal(read.disappearAfterSeconds,120);
    await rejected(()=>invoke(carol.page,'getCloudGroupMessageFromServer',groupId,carol.uid,messageId));
    await invoke(alice.page,'updateCloudGroupReceipt',groupId,messageId,'delivered');
    await invoke(alice.page,'updateCloudGroupReceipt',groupId,messageId,'read');
    await invoke(bob.page,'setCloudMessageReaction',groupId,messageId,'group','😂','apply');
    await invoke(bob.page,'setCloudMessageReaction',groupId,messageId,'group','😂','remove');
    const saved=await readAdmin(`groups/${groupId}/messages/${messageId}`);
    assert.equal(saved.receiptRevision,2);
    assert.equal(saved.reactions?.[bob.uid],undefined);
    return 'Encrypted group transport, member-only access, disappearing metadata, delivery/read receipts, emoji toggle';
  });
  if(label.startsWith('Web-main3'))await check('FN-009A',async()=>{
    // A = source sender Owner; B = reactor Alice; C = independent Bob.
    // Genuine browser DOM + emulator-authenticated Firestore transactions.
    // Only the encrypted TEXT hydration is replaced by an explicit simulator
    // projection fixture; this case does not claim peer E2EE verification.
    const page=alice.page,mid='test-group-'+engine;
    const source=await readAdmin('groups/'+groupId+'/messages/'+mid);
    assert.equal(source.senderUid,owner.uid,"Target must be a message from someone else");
    const members=await Promise.all([owner,alice,bob].map(async member=>{
      const record=await readAdmin('groups/'+groupId+'/members/'+member.uid);
      if(!record?.displayName)throw Error('Group member directory missing '+member.uid);
      return{id:member.uid,name:record.displayName};
    }));
    const bobName=members.find(member=>member.id===bob.uid).name;
    await page.evaluate(async()=>{
      const app=await import('/app.js');
      await app.FIDUNIO_APP_READY;
    });
    await page.evaluate(async args=>{
      const app=await import('/app.js');
      if(typeof app.__FIDUNIO_SIM_PROJECT_GROUP_REACTIONS!=='function')throw Error('Probe not installed on disposable source');
      await app.__FIDUNIO_SIM_PROJECT_GROUP_REACTIONS(args);
    },{groupId,messageId:mid,sourceUid:owner.uid,members});
    await page.locator('#messageBox').waitFor({state:'visible',timeout:40000});
    const row=page.locator('.pending-message-action[data-message-id="'+mid+'"]');
    await row.waitFor({state:'visible',timeout:40000});
    const chip='.pending-message-action[data-message-id="'+mid+'"] .message-reaction-chip[data-reaction="🙏"]';
    const poll=async(fn,description,ms=40000)=>{
      const end=Date.now()+ms;
      while(Date.now()<end){if(await fn())return;await new Promise(res=>setTimeout(res,350));}
      throw Error('Timeout: '+description+'; listener='+await page.evaluate(()=>String(globalThis.__FIDUNIO_SIM_REACTION_LISTENER_ERROR||'')));
    };
    const names=async(expected)=>{
      await page.locator(chip).click();
      await page.locator('#reactionDetailsTitle').waitFor({state:'visible',timeout:25000});
      const seen=await page.locator('.reaction-authors-list li').allTextContents();
      assert.deepEqual([...seen].sort(),[...expected].sort(),'Wrong visible authors: expected '+JSON.stringify(expected)+'; saw '+JSON.stringify(seen));
      assert(!seen.join(' ').includes(alice.uid)&&!seen.join(' ').includes(bob.uid),'Raw UID leaked');
      await page.screenshot({path:path.join(out,'reaction-author-'+expected.length+'-'+engine+'.png')});
      await page.locator('#modalCancel').click();
      await page.locator('#reactionDetailsTitle').waitFor({state:'detached'});
    };
    await row.press('Enter');
    await page.locator('.message-reaction-btn[data-reaction="🙏"]').waitFor({state:'visible'});
    // Synchronous DOM paint is checked in the same JS task as the REAL UI
    // button click, before any awaited transaction can resolve.
    const initial=await page.evaluate(()=>{
      const button=document.querySelector('.message-reaction-btn[data-reaction="🙏"]');
      if(!button||button.disabled)throw Error('Reaction chooser not actionable');
      const before=performance.now();
      button.click();
      const chip=document.querySelector('.message-reaction-chip[data-reaction="🙏"]');
      return{immediate:!!chip,mine:chip?.classList.contains('mine'),ms:performance.now()-before};
    });
    assert.equal(initial.immediate,true,'Web chip not painted synchronously when reactor taps a different sender message');
    assert.equal(initial.mine,true,'Immediate chip does not identify reactor');
    assert(initial.ms<250,'Synchronous click/paint exceeded 250ms: '+initial.ms);
    await poll(async()=>((await readAdmin('groups/'+groupId+'/messages/'+mid))?.reactions||{})[alice.uid]==='🙏','Alice authoritative apply');
    await names(['You']);
    await invoke(bob.page,'setCloudMessageReaction',groupId,mid,'group','🙏','apply');
    await poll(async()=>await page.locator(chip+' .message-reaction-count').textContent().catch(()=>null)==='2','Bob remote reaction surfaced to Alice UI');
    await names(['You',bobName]);
    // Bob changes emoji; the original participant Alice must keep hers.
    await invoke(bob.page,'setCloudMessageReaction',groupId,mid,'group','❤️','apply');
    await poll(async()=>await page.locator('.message-reaction-chip[data-reaction="❤️"]').count()===1,'Bob changed emoji visible');
    await poll(async()=>((await readAdmin('groups/'+groupId+'/messages/'+mid))?.reactions||{})[alice.uid]==='🙏','Alice reaction retained');
    await invoke(bob.page,'setCloudMessageReaction',groupId,mid,'group','❤️','remove');
    await poll(async()=>await page.locator('.message-reaction-chip[data-reaction="❤️"]').count()===0,'Bob emoji removed from UI');
    await row.press('Enter');
    const removed=await page.evaluate(()=>{
      const button=document.querySelector('.message-reaction-btn[data-reaction="🙏"]');
      button?.click();
      return document.querySelectorAll('.message-reaction-chip.mine').length===0;
    });
    assert.equal(removed,true,'Web remove is not immediate');
    await poll(async()=>!((await readAdmin('groups/'+groupId+'/messages/'+mid))?.reactions||{})[alice.uid],'Alice authoritative remove');
    await poll(async()=>await page.locator('.message-reaction-chip.mine').count()===0,'final UI clean');
    return 'True A≠B message: immediate DOM add/remove, real Alice and Bob authorized transactions, listener-driven count and group names on actual '+engine+' browser, no raw account ID';
  });
  await check('FN-010',async()=>{
    const installationId='test-browser-install-'+engine;
    await invoke(owner.page,'upsertCloudNotificationDevice',{
      installationId,fcmToken:'simulatedBrowserToken'.repeat(3),platform:'ios-browser',enabled:true,showSenderName:false
    });
    assert.equal((await invoke(owner.page,'getCloudNotificationDevice',installationId)).showSenderName,false);
    await invoke(owner.page,'updateCloudNotificationSenderName',{installationId,showSenderName:true});
    assert.equal((await invoke(owner.page,'getCloudNotificationDevice',installationId)).showSenderName,true);
    assert.equal(await invoke(alice.page,'getCloudNotificationDevice',installationId),null);
    const outsider=testEnv.authenticatedContext(alice.uid).firestore();
    await assertFails(outsider.doc(`users/${owner.uid}/notificationDevices/${installationId}`).get());
    await rejected(()=>invoke(owner.page,'upsertCloudNotificationDevice',{
      installationId:'sim-adm-registration',fcmToken:'simulatedADMPushToken'.repeat(3),platform:'android-adm'
    }));
    await invoke(owner.page,'deleteCloudNotificationDevice',installationId);
    assert.equal(await invoke(owner.page,'getCloudNotificationDevice',installationId),null);
    return 'Web notification device registration, sender privacy preference, cross-user isolation, deletion; ADM direct write denied (lease API only)';
  });
  await check('FN-011',async()=>{
    const report=await invoke(alice.page,'submitFidunioAbuseReport',{
      category:'spam-scam',targetUid:bob.uid,details:'Simulated test-only report'
    });
    assert.equal((await readAdmin('abuseReports/'+report.id)).status,'open');
    const list=await invoke(admin.page,'listFidunioAbuseReportsForAdmin');
    assert.ok(list.some(x=>x.id===report.id));
    return 'Report abuse creates open report; authorized system Admin can view it';
  });
  await check('FN-012',async()=>{
    const bobBefore=await readAdmin('users/'+bob.uid);
    assert.equal(bobBefore.active,true);
    await invoke(admin.page,'updateFidunioUserLifecycle',bob.uid,'suspended');
    assert.equal((await readAdmin('users/'+bob.uid)).active,false);
    await rejected(()=>invoke(bob.page,'createCloudGroup','Suspended attempt',[alice.uid,carol.uid]));
    await invoke(admin.page,'updateFidunioUserLifecycle',bob.uid,'active');
    assert.equal((await readAdmin('users/'+bob.uid)).active,true);
    return 'System Admin suspends/restores user; suspended user cannot write group';
  });
  await check('FN-013',async()=>{
    const page=owner.page;
    await page.evaluate(async()=>{const app=await import('/app.js');await app.FIDUNIO_APP_READY;});
    await page.locator('#continueBtn').waitFor({state:'visible',timeout:30000});
    await page.locator('#continueBtn').click();
    await page.locator('#settingsBtn').waitFor({state:'visible',timeout:30000});
    await page.locator('#settingsBtn').click();
    await page.locator('#fidunioSettingsShell').waitFor({state:'visible',timeout:30000});
    await page.screenshot({path:path.join(out,'settings-before.png'),fullPage:true});
    // The section sidebar exists but is intentionally hidden below 900px;
    // on phones the General cards are stacked and already visible.
    const generalNav=page.locator('.fidunio-settings-nav-btn[data-group="general"]');
    if(await generalNav.isVisible())await generalNav.click();
    await page.locator('.text-size-btn[data-text-size="xlarge"]').click();
    assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('text-aplusplus')),true);
    await page.locator('.appearance-btn[data-appearance="dark"]').click();
    assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),'dark');
    await page.locator('.toggle[data-key="previews"]').click();
    assert.equal(await page.locator('.toggle[data-key="previews"]').getAttribute('class').then(x=>x.includes('on')),true);
    await page.locator('.toggle[data-key="wifiAttachments"]').click();
    await page.screenshot({path:path.join(out,'settings-changed.png'),fullPage:true});
    await page.waitForTimeout(700); // Local encrypted IndexedDB debounce, NOT network delivery.
    await page.reload();
    await page.evaluate(async()=>{const app=await import('/app.js');await app.FIDUNIO_APP_READY;});
    await page.locator('#continueBtn').waitFor({state:'visible',timeout:30000});
    await page.locator('#continueBtn').click();
    await page.locator('#settingsBtn').click();
    await page.locator('#fidunioSettingsShell').waitFor({state:'visible',timeout:30000});
    assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('text-aplusplus')),true);
    assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),'dark');
    assert.equal(await page.locator('.toggle[data-key="previews"]').getAttribute('class').then(x=>x.includes('on')),true);
    assert.equal(await page.locator('.toggle[data-key="wifiAttachments"]').getAttribute('class').then(x=>x.includes('on')),false);
    await page.screenshot({path:path.join(out,'settings-reloaded.png'),fullPage:true});
    return 'Rendered Settings A++, Dark, notification previews and Wi-Fi attachment option; persisted after browser reload (3 PNGs)';
  });
  await check('FN-014',async()=>{
    const record=(epoch,memberList)=>({
      format:'fidunio-group-key-v1',groupId,keyEpoch:epoch,createdByUid:owner.uid,
      createdByKeyId:owner.keyId,
      memberKeyIds:Object.fromEntries(memberList.map(x=>[x.uid,x.keyId])),
      envelopes:Object.fromEntries(memberList.map(x=>[x.uid,'synthetic-group-key-envelope']))
    });
    await rejected(()=>invoke(alice.page,'commitCloudGroupMembershipEpoch',{
      groupId,operation:'remove',targetUid:bob.uid,expectedEpoch:0,newEpoch:1,
      record:record(1,[owner,alice])
    }),'Only a group administrator');
    const removed=await invoke(owner.page,'commitCloudGroupMembershipEpoch',{
      groupId,operation:'remove',targetUid:bob.uid,expectedEpoch:0,newEpoch:1,
      record:record(1,[owner,alice])
    });
    assert.equal(removed.keyEpoch,1);
    await rejected(()=>invoke(bob.page,'readCloudGroupAuthority',groupId));
    const added=await invoke(owner.page,'commitCloudGroupMembershipEpoch',{
      groupId,operation:'add',targetUid:carol.uid,expectedEpoch:1,newEpoch:2,
      record:record(2,[owner,alice,carol])
    });
    assert.equal(added.keyEpoch,2);
    const authority=await invoke(carol.page,'readCloudGroupAuthority',groupId);
    assert.equal(authority.memberUids.includes(carol.uid),true);
    assert.equal(authority.memberUids.includes(bob.uid),false);
    return 'Non-admin removal denied; Owner removes/adds; E2EE key epoch increments; former member loses access';
  });
}catch(error){
  const msg=String(error?.stack||error);
  failures.push(msg);
  console.error('STOP functional setup — '+msg);
}finally{
  for(const {ctx} of pages)await ctx.close().catch(()=>{});
  if(browser)await browser.close().catch(()=>{});
  if(testEnv)await testEnv.cleanup().catch(()=>{});
  if(server)await new Promise(resolve=>server.close(resolve));
  const statuses=cases.map(r=>r.status);
  const summary=[
    `# FIDUNIO ${label} ${engine} authenticated functional emulator run`,'',
    `**Result: ${failures.length?'FAIL':'PASS'} — ${statuses.filter(x=>x==='PASS').length}/${cases.length} executed cases**`,'',
    '- App source: '+source,'- Firebase project: `'+project+'` (localhost Auth and Firestore only)',
    '- Test accounts: synthetic and disposable; no production credentials',
    '- Tests invoke actual exported FIDUNIO client APIs and enforce real Firestore rules',
    '- Direct/group payloads use **synthetic ciphertext fixtures**; separate reviewed crypto tests check actual E2EE',
    '- APNs/ADM/FCM arrival, callable leases, camera, live email, hardware biometrics and settings beyond these four UI controls are **NOT VERIFIED** here','',
    '| ID | Result | Verified interaction |','| --- | --- | --- |',
    ...cases.map(c=>`| ${c.id} | **${c.status}** | ${c.detail.replaceAll('|','\\|')} |`),
    '', '## Unverified device/provider behaviour','',
    '- Actual email invitation sharing and Universal Link open on physical hardware',
    '- Real encrypted display, attachments, replies, history grants, purge execution, Firebase Functions deletion and lease endpoints',
    '- Native APNs and Amazon ADM push **arrival** and notification tap-to-PIN routing',
    '- Hardware Face ID/biometric, camera, microphone, background, offline, full settings coverage beyond the four rendered controls','',
    ...(failures.length?['## Failures','',...failures.map(f=>'- '+f.replaceAll('\n',' ')),'']:[])
  ];
  fs.writeFileSync(path.join(out,'REPORT.md'),summary.join('\n')+'\n');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({label,engine,source,passed:statuses.filter(x=>x==='PASS').length,failed:failures.length,cases},null,2)+'\n');
}
process.exitCode=failures.length?1:0;
