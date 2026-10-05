// Scorecard-style real browser regression gate, isolated fresh contexts.
// No credentials and no live Firebase backend access. Real SDK modules load from gstatic.
import {chromium,webkit} from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve('www'),evidence=path.resolve('browser-release-evidence');
await fs.mkdir(evidence,{recursive:true});
const server=http.createServer(async(req,res)=>{
 try{
  const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'')||'index.html';
  const file=path.resolve(root,rel);if(!file.startsWith(root+path.sep))throw Error('invalid path');
  let bytes=await fs.readFile(file);
  if(rel==='firebase-config.js')bytes=Buffer.from('export const firebaseConfig={apiKey:"demo-fidunio-local-test-key",authDomain:"demo-fidunio.firebaseapp.com",projectId:"demo-fidunio",appId:"1:123:web:test",storageBucket:"demo-fidunio.appspot.com",messagingSenderId:"123"};');
  res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.json':'application/json'})[path.extname(rel)]||'application/octet-stream');res.end(bytes);
 }catch{res.statusCode=404;res.end('not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
const selected=process.env.TEST_BROWSER||'chromium';
const authEmulator=process.env.FIDUNIO_AUTH_EMULATOR_URL||'';
const browser=await ({chromium,webkit}[selected]).launch();
async function fresh(){
 const context=await browser.newContext({viewport:{width:390,height:844}});
 await context.addInitScript(()=>{window.Capacitor={
  isNativePlatform:()=>true,
  getPlatform:()=> 'ios',
  Plugins:{FirebaseAppCheck:{
   initialize:async()=>{},
   getToken:async()=>({token:"fidunio-preflight-native-app-check-token",expireTimeMillis:Date.now()+60*60*1000})
  }}
 };});
 await context.route('**/*',route=>{
  const url=route.request().url();
  // Protect production: permit only local assets and the public Firebase SDK.
  if(url.startsWith(base+'/')||url.startsWith('https://www.gstatic.com/firebasejs/')||(authEmulator&&url.startsWith(authEmulator+'/')))return route.continue();
  return route.abort();
 });
 return {context,page:await context.newPage()};
}
async function nativeAuthPersistence(page,{create=false}={}){
 if(!authEmulator)return null;
 return page.evaluate(async({authEmulator,create})=>{
  const appSdk=await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js');
  const authSdk=await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js');
  const adapter=await import('/firebase-platform-adapter.js');
  const app=appSdk.initializeApp({
   apiKey:'demo-key',
   authDomain:'demo-fidunio-ios-auth.firebaseapp.com',
   projectId:'demo-fidunio-ios-auth',
   appId:'1:123:web:ios-auth-preflight'
  },'fidunio-ios-auth-persistence-preflight');
  const auth=adapter.createPlatformFirebaseAuth({app,authSdk});
  authSdk.connectAuthEmulator(auth,authEmulator,{disableWarnings:true});
  await auth.authStateReady();
  if(create){
   if(auth.currentUser)await authSdk.signOut(auth);
   const credential=await authSdk.createUserWithEmailAndPassword(auth,'ios-persistence@fidunio.test','Preflight-12345!');
   return credential.user.uid;
  }
  const uid=auth.currentUser?.uid||null;
  if(uid)await authSdk.signOut(auth);
  return uid;
 },{authEmulator,create});
}
async function acceptStartupTermsIfNeeded(page){
 // A count() probe races the asynchronous legal-module import.
 await page.locator('#startupTermsTick, #loginEmail').first().waitFor({state:'visible',timeout:45000});
 const tick=page.locator('#startupTermsTick');
 if(await tick.count()){
  await tick.waitFor({state:'visible',timeout:45000});
  await tick.check();
  await page.locator('#startupTermsAccept').click();
 }
}
async function ready(page){
 await acceptStartupTermsIfNeeded(page);
 await page.locator('#loginEmail').waitFor({state:'visible',timeout:45000});
 assert.equal(await page.locator('#loginPassword').getAttribute('type'),'password');
 assert.equal(await page.locator('.startup-shell').count(),0);
 assert.equal(await page.locator('.startup-shell button').count(),0);
}
try{
 // Actual module initialization, auth callback, browser storage, DOM and reload.
 const {context,page}=await fresh();const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.clock.install();
 let accountRequested=false;
 page.on('request',request=>{if(request.url().endsWith('/account-guard.js'))accountRequested=true;});
 await page.goto(base);
 await page.locator('#startupTermsTick').waitFor({state:'visible',timeout:45000});
 assert.equal(await page.locator('#startupTermsAccept').isDisabled(),true);
 assert.equal(await page.locator('#loginEmail').count(),0);
 await page.clock.fastForward(45000);
 assert.equal(accountRequested,false,'auth must not start while reading Terms');
 assert.equal(await page.getByRole('button',{name:'Retry Startup'}).count(),0);
 for(const id of ['startupTermsTick','startupTermsAccept','startupTermsDecline']){
  const bounds=await page.locator('#'+id).boundingBox();
  assert.ok(bounds&&bounds.y>=0&&bounds.y+bounds.height<=844,id+' must fit the initial iPhone viewport');
 }
 await page.screenshot({path:path.join(evidence,selected+'-terms.png')});
 await page.locator('#startupTermsDecline').click();
 assert.equal(await page.locator('#loginEmail').count(),0);
 assert.equal(await page.evaluate(()=>localStorage.getItem('fidunio:terms')),null);
 await page.locator('#startupTermsAgain').click();
 assert.equal(await page.locator('#startupTermsAccept').isDisabled(),true);
 await page.clock.resume();
 await ready(page);
 assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('fidunio:terms')).acceptedAt));
 console.log('PASS: '+selected+' fresh Terms, disabled Accept, decline lock, read again, visible controls and acceptance before auth');
 assert.equal(await page.evaluate(async()=> (await import('/firebase.js')).getFirebaseUser()),null);
 if(authEmulator){
  const persistedUid=await nativeAuthPersistence(page,{create:true});
  assert.ok(persistedUid);
  await page.reload();await ready(page);
  assert.equal(await nativeAuthPersistence(page),persistedUid);
  console.log('PASS: '+selected+' native Firebase Auth local persistence survives reload against isolated Auth emulator');
 }
 // Exercise FIDUNIO's exact local E2EE storage primitive in the browser engine:
 // a P-256 private CryptoKey must survive the IndexedDB structured-clone roundtrip.
 const cryptoKeyRoundTrip=await page.evaluate(async()=>{
   const local=await import('/local-security.js');
   const pair=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},false,['deriveBits']);
   const uid='ios-preflight-crypto-key',keyId='preflight-key',revision=7;
   try{
     await local.saveLocalAccountE2EEIdentity({uid,keyId,revision,privateKey:pair.privateKey});
     const restored=await local.readLocalAccountE2EEIdentity(uid,{keyId,revision});
     if(!restored?.privateKey||restored.privateKey.type!=='private')return{ok:false,reason:'private key did not round-trip'};
     await crypto.subtle.deriveBits({name:'ECDH',public:pair.publicKey},restored.privateKey,256);
     return{ok:true};
   }catch(error){return{ok:false,reason:error?.message||String(error)};}
   finally{try{await local.clearLocalAccountE2EEIdentity(uid);}catch{}}
 });
 assert.deepEqual(cryptoKeyRoundTrip,{ok:true});
 assert.equal(await page.locator('img[alt="Fidunio logo"]').evaluate(img=>img.complete&&img.naturalWidth>0),true);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
 await page.locator('#loginPassword').focus();await page.locator('#loginPassword-show-password').check();
 assert.equal(await page.locator('#loginPassword').getAttribute('type'),'text');
 await page.locator('#loginPassword-show-password').uncheck();
 await page.locator('#forgotBtn').click();assert.match(await page.locator('#loginNote').innerText(),/Enter your email address first/);
 await page.getByRole('tab',{name:'Join FIDUNIO'}).click();
 await page.locator('#inviteCode').waitFor({state:'visible'});
 await page.locator('#redeemBtn').click();assert.match(await page.locator('#joinNote').innerText(),/six-digit FIDUNIO PIN/);
 await page.getByRole('tab',{name:'Sign In'}).click();await ready(page);
 await page.reload();await ready(page);
 // Recovery hands off to startApp(), which dynamically imports app.js inside the
 // recovery catch boundary. Parse the complete post-auth application graph in
 // real WebKit so a JavaScriptCore parser failure cannot masquerade as recovery.
 const appImport=await page.evaluate(async()=>{
   try{const appModule=await import('/app.js');await appModule.FIDUNIO_APP_READY;return{ok:true};}
   catch(error){return{ok:false,name:error?.name||'',message:error?.message||String(error)};}
 });
 if(!appImport.ok&&appImport.name==='SyntaxError')throw new Error('Post-auth app module parse failed: '+appImport.message);
 assert.doesNotMatch(String(appImport.message||''),/Invalid escape in identifier/i);
 assert.deepEqual(errors.filter(message=>/SyntaxError|Invalid escape in identifier/i.test(message)),[]);

 assert.equal(await page.evaluate(async()=> (await navigator.serviceWorker.getRegistrations()).length),0);
 await page.screenshot({path:path.join(evidence,selected+'-sign-in.png')});
 await context.close();console.log('PASS: '+selected+' native cold startup/reload, auth tabs, password visibility, validation and no web service worker');
 // A failed SDK load must show an actionable failure, then a full reload recovers.
 const failed=await fresh();await failed.context.route('https://www.gstatic.com/firebasejs/**',route=>route.abort());
 await failed.page.goto(base);await acceptStartupTermsIfNeeded(failed.page);await failed.page.getByRole('button',{name:'Retry Startup'}).waitFor({state:'visible'});
 assert.match(await failed.page.locator('.startup-shell').innerText(),/has not been reset/);
 await failed.page.screenshot({path:path.join(evidence,selected+'-load-failure.png')});
 await failed.context.unroute('https://www.gstatic.com/firebasejs/**');
 await failed.page.getByRole('button',{name:'Retry Startup'}).click();await ready(failed.page);await failed.context.close();
 console.log('PASS: '+selected+' rejected SDK load reports failure and retry recovers without bypass');
 // Hanging dependency: advance the real startup timer with the browser clock.
 const stalled=await fresh();await stalled.page.clock.install();
 await stalled.context.route('**/account-guard.js',()=>{});
 const pendingImport=stalled.page.waitForRequest('**/account-guard.js');
 await stalled.page.goto(base,{waitUntil:'commit'});await acceptStartupTermsIfNeeded(stalled.page);await pendingImport;
 await stalled.page.clock.fastForward(31000);
 await stalled.page.getByRole('button',{name:'Retry Startup'}).waitFor({state:'visible'});
 assert.match(await stalled.page.locator('.startup-shell').innerText(),/taking longer than expected/);
 assert.equal(await stalled.page.locator('#loginEmail').count(),0);
 await stalled.page.clock.resume();
 // WebKit waits for document loading before screenshots; this test deliberately
 // holds a module request open. Preserve visible text after the assertions instead.
 await fs.writeFile(path.join(evidence,selected+'-startup-timeout.txt'),await stalled.page.locator('.startup-shell').innerText());
 await stalled.context.close();console.log('PASS: '+selected+' stalled startup is visible and cannot bypass authentication');
}finally{
 for(const [i,context] of browser.contexts().entries())for(const [j,page] of context.pages().entries())try{await page.screenshot({path:path.join(evidence,selected+'-final-'+i+'-'+j+'.png')});}catch{}
 await browser.close();await new Promise(resolve=>server.close(resolve));
}
