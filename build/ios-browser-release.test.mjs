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
const browser=await ({chromium,webkit}[selected]).launch();
async function fresh(){
 const context=await browser.newContext({viewport:{width:390,height:844}});
 await context.addInitScript(()=>{window.Capacitor={isNativePlatform:()=>true,getPlatform:()=> 'ios'};});
 await context.route('**/*',route=>{
  const url=route.request().url();
  // Protect production: permit only local assets and the public Firebase SDK.
  if(url.startsWith(base+'/')||url.startsWith('https://www.gstatic.com/firebasejs/'))return route.continue();
  return route.abort();
 });
 return {context,page:await context.newPage()};
}
async function ready(page){
 await page.locator('#loginEmail').waitFor({state:'visible',timeout:45000});
 assert.equal(await page.locator('#loginPassword').getAttribute('type'),'password');
 assert.equal(await page.locator('.startup-shell').count(),0);
 assert.equal(await page.locator('.startup-shell button').count(),0);
}
try{
 // Actual module initialization, auth callback, browser storage, DOM and reload.
 const {context,page}=await fresh();const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base);await ready(page);
 assert.equal(await page.evaluate(async()=> (await import('/firebase.js')).getFirebaseUser()),null);
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
   try{await import('/app.js');return{ok:true};}
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
 await failed.page.goto(base);await failed.page.getByRole('button',{name:'Retry Startup'}).waitFor({state:'visible'});
 assert.match(await failed.page.locator('.startup-shell').innerText(),/has not been reset/);
 await failed.page.screenshot({path:path.join(evidence,selected+'-load-failure.png')});
 await failed.context.unroute('https://www.gstatic.com/firebasejs/**');
 await failed.page.getByRole('button',{name:'Retry Startup'}).click();await ready(failed.page);await failed.context.close();
 console.log('PASS: '+selected+' rejected SDK load reports failure and retry recovers without bypass');
 // Hanging dependency: advance the real startup timer with the browser clock.
 const stalled=await fresh();await stalled.page.clock.install();
 await stalled.context.route('**/account-guard.js',()=>{});
 const pendingImport=stalled.page.waitForRequest('**/account-guard.js');
 await stalled.page.goto(base,{waitUntil:'commit'});await pendingImport;
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
