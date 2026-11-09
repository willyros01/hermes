/* FIDUNIO App Store screenshots — release tooling only, no app code.
 * Runs the real FIDUNIO screens (generated www, patched to LOCAL emulators by
 * build/appstore/sandbox.mjs) in WebKit with four sample family members who
 * join through the real Join screen, so every chat is genuinely end-to-end
 * encrypted between them. Never touches production Firebase.
 * Usage (inside firebase emulators:exec): node build/appstore/shots.mjs OUT
 * Output: OUT/iphone-N-*.png (1320x2868) and OUT/ipad-N-*.png (2064x2752). */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {webkit} from 'playwright';
import {initializeTestEnvironment} from '@firebase/rules-unit-testing';

const project='demo-fidunio-simulator-tests';
const out=path.resolve(process.argv[2]||'out-shots');
const root=path.resolve('www');
if(!fs.existsSync(path.join(root,'SIMULATOR-ONLY.txt')))throw new Error('Refusing: www is not the patched local-only copy');
if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8080'||process.env.FIREBASE_AUTH_EMULATOR_HOST!=='127.0.0.1:9099')throw new Error('Refusing: local emulators required');
fs.mkdirSync(out,{recursive:true});
const origin='http://127.0.0.1';
const log=(s)=>{console.log(s);fs.appendFileSync(path.join(out,'log.txt'),s+'\n');};
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const types={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.webmanifest':'application/manifest+json','.woff2':'font/woff2'};

const server=http.createServer((req,res)=>{
  try{
    let p=decodeURIComponent(new URL(req.url,origin).pathname);
    if(p==='/__api__.html'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><meta charset="utf-8"><body></body>');return;}
    if(p==='/')p='/index.html';
    const f=path.resolve(root,'.'+p);
    if(!f.startsWith(root+path.sep))throw 0;
    res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');
    res.end(fs.readFileSync(f));
  }catch{res.statusCode=404;res.end('Not found');}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=origin+':'+server.address().port;
const env=await initializeTestEnvironment({projectId:project,firestore:{host:'127.0.0.1',port:8080}});
const browser=await webkit.launch();
const pages=[];

async function context(){
  const ctx=await browser.newContext({viewport:{width:440,height:956},deviceScaleFactor:3,isMobile:false,hasTouch:true,colorScheme:'light',locale:'en-US',timezoneId:'America/Toronto'});
  await ctx.route('**/*',route=>{
    const u=route.request().url();
    if(u.startsWith(base+'/')||u.startsWith('https://www.gstatic.com/firebasejs/')||[8080,9099,9199,5001].some(p=>u.startsWith(origin+':'+p+'/')))return route.continue();
    return route.abort();
  });
  const page=await ctx.newPage();
  page.on('dialog',d=>d.dismiss().catch(()=>{}));
  pages.push(page);
  return page;
}
async function invoke(page,fn,...args){
  return page.evaluate(async({fn,args})=>{const api=await import('/firebase.js');return api[fn](...args);},{fn,args});
}
async function until(fn,label,ms=60000){
  const end=Date.now()+ms;let last='';
  while(Date.now()<end){try{if(await fn())return;}catch(e){last=String(e.message||e).slice(0,160);}await sleep(500);}
  throw new Error('Timed out: '+label+(last?' — '+last:''));
}
const visible=(page,sel)=>page.locator(sel).first().isVisible().catch(()=>false);
async function tap(page,sel){await page.locator(sel).first().click({timeout:20000});}

// Owner seeded straight into the local emulator (only issues invitations).
const ownerEmail='joe@example.com',pw='SampleFamily-2026!';
const signUp=await (await fetch(origin+':9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-only',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:ownerEmail,password:pw,returnSecureToken:true})})).json();
await env.withSecurityRulesDisabled(async c=>{
  const db=c.firestore();
  await db.doc('users/'+signUp.localId).set({displayName:'Joe Rivera',email:ownerEmail,systemRole:'owner',active:true});
  await db.doc('system/access').set({ownerUid:signUp.localId,createdByUid:signUp.localId,accessModel:'invite-only-v1'});
});
const owner=await context();
await owner.goto(base+'/__api__.html');
await owner.evaluate(async()=>{const api=await import('/firebase.js');const s=await api.initFirebase();await s.auth.authStateReady();});
await invoke(owner,'signInFidunio',ownerEmail,pw);
log('OK owner seeded');

async function join(name,email,role){
  const invite=await invoke(owner,'createFidunioInvitation',role,7);
  const page=await context();
  await page.goto(base+'/index.html');
  await until(()=>visible(page,'#startupTermsTick'),name+': Terms screen',90000);
  await tap(page,'#startupTermsTick');await tap(page,'#startupTermsAccept');
  await until(()=>visible(page,'#joinTab'),name+': Join tab');
  await tap(page,'#joinTab');
  await until(()=>visible(page,'#joinPinHost'),name+': Join form');
  await page.fill('#inviteCode',invite.token);
  await page.fill('#joinName',name);
  await page.fill('#joinEmail',email);
  await page.fill('#joinPassword',pw);
  for(let i=0;i<6;i++)await page.fill(`#joinPinHost .pin-code-slot:nth-child(${i+1})`,String(i+1));
  await tap(page,'#redeemBtn');
  await until(async()=>await visible(page,'#newBtn')||await visible(page,'#tabletNewBtn'),name+': Messages',120000);
  let uid=null;
  await env.withSecurityRulesDisabled(async c=>{const q=await c.firestore().collection('users').where('email','==',email).get();uid=q.docs[0]?.id;});
  log('OK '+name+' joined');
  return {name,page,uid};
}
const sofia=await join('Sofia Rivera','sofia@example.com','admin');
const marco=await join('Marco Rivera','marco@example.com','user');
const lucas=await join('Lucas Rivera','lucas@example.com','user');
const rosa=await join('Grandma Rosa','rosa@example.com','user');

async function home(p){
  for(let n=0;n<4&&!(await visible(p.page,'#newBtn'))&&!(await visible(p.page,'#tabletNewBtn'));n++){
    if(await visible(p.page,'#backBtn'))await tap(p.page,'#backBtn');else break;
  }
}
async function send(p,text){
  await p.page.fill('#messageBox',text);
  await tap(p.page,'#sendBtn');
  await until(()=>p.page.locator('#chatArea').getByText(text,{exact:false}).first().isVisible(),p.name+' sees own "'+text.slice(0,20)+'"',60000);
  await sleep(700);
}
async function openFrom(p,title){
  await home(p);
  const row=p.page.locator('.conversation-open, .group-list-row').filter({hasText:title}).first();
  await until(()=>row.isVisible(),p.name+': conversation "'+title+'" in list',90000);
  await row.click();
  await until(()=>visible(p.page,'#messageBox'),p.name+': chat open');
}
async function sees(p,text){
  await until(()=>p.page.locator('#chatArea').getByText(text,{exact:false}).first().isVisible(),p.name+' receives "'+text.slice(0,20)+'"',90000);
}
async function direct(from,to){
  await home(from);
  await tap(from.page,(await visible(from.page,'#newBtn'))?'#newBtn':'#tabletNewBtn');
  const choice=from.page.locator('.fidunio-recipient-choice').filter({hasText:to.name}).first();
  await until(()=>choice.isVisible(),from.name+': '+to.name+' in the contact list',60000);
  await choice.click();
  await until(()=>visible(from.page,'#messageBox'),from.name+': direct chat with '+to.name,90000);
}
async function talk(lines){
  for(const [who,text] of lines){await send(who,text);for(const other of lines.map(l=>l[0]).filter((x,i,a)=>x!==who&&a.indexOf(x)===i))await sees(other,text);}
}

// 1. Direct chat Marco <-> Sofia
await direct(marco,sofia);
await send(marco,'Are you still coming for dinner on Sunday?');
await openFrom(sofia,'Marco Rivera');await sees(sofia,'dinner on Sunday');
await talk([[sofia,'Yes! I’ll bring dessert 🍰'],[marco,'Perfect. The kids can’t wait to see you'],[sofia,'See you at 5 😊']]);
log('OK direct chat');

// 2. Family group created by Sofia
await home(sofia);
await tap(sofia.page,(await visible(sofia.page,'#newBtn'))?'#newBtn':'#tabletNewBtn');
await tap(sofia.page,'#newGroupBtn');
for(const m of [marco,lucas,rosa]){
  const opt=sofia.page.locator(`#memberChoices .member-option[data-id="${m.uid}"]`);
  await until(()=>opt.isVisible(),'member '+m.name,60000);await opt.click();
}
await tap(sofia.page,'#nextBtn');
await until(()=>visible(sofia.page,'#groupNameInput'),'group details');
await sofia.page.fill('#groupNameInput','Rivera Family');
await tap(sofia.page,'#createGroupBtn');
await until(()=>visible(sofia.page,'#messageBox'),'group chat',90000);
await send(sofia,'Who can pick up Grandma for church on Sunday?');
for(const m of [marco,lucas,rosa]){await openFrom(m,'Rivera Family');await sees(m,'pick up Grandma');}
await talk([[marco,'I will, 9:30 🚗'],[rosa,'Thank you, dear ❤️'],[lucas,'Save me a seat, Nana!'],[rosa,'Always 😘']]);
log('OK group chat');

// 3. Disappearing direct chat Lucas -> Sofia
await direct(lucas,sofia);
const ds=lucas.page.locator('#disappearSelect');
await until(()=>ds.isVisible(),'disappearing control');
const opts=await ds.evaluate(s=>[...s.options].map(o=>o.value));
const day=opts.includes('86400')?'86400':opts.filter(v=>Number(v)>0).sort((a,b)=>b-a)[0];
await ds.selectOption(day);await sleep(1500);
await send(lucas,'The cottage gate code is 4417 🔑');
await openFrom(sofia,'Lucas Rivera');await sees(sofia,'gate code');
await talk([[sofia,'Got it, thanks!'],[lucas,'This chat clears itself tomorrow 👍']]);
log('OK disappearing chat ('+day+'s)');

// Screenshots, all from Sofia's phone.
const P=sofia.page;
async function shot(name){await sleep(1200);await P.screenshot({path:path.join(out,name+'.png')});log('SHOT '+name);}
async function settle(){await P.evaluate(()=>document.activeElement?.blur?.());}
await openFrom(sofia,'Rivera Family');await sees(sofia,'Always');await settle();await shot('iphone-1-family-group');
await openFrom(sofia,'Marco Rivera');await settle();await shot('iphone-2-direct-chat');
await openFrom(sofia,'Lucas Rivera');
{const sel=P.locator('#disappearSelect');await sel.selectOption(day);await until(async()=>(await sel.inputValue())===day,'Sofia disappearing 1 day');}
await settle();await shot('iphone-3-disappearing');
await home(sofia);await settle();await shot('iphone-4-messages');

// iPad 13": 1032x1376 points, captured at 3x and scaled to 2064x2752 by the workflow.
await P.setViewportSize({width:1032,height:1376});await sleep(2500);
await openFrom(sofia,'Rivera Family');await settle();await shot('ipad-1-family-group');
await openFrom(sofia,'Marco Rivera');await settle();await shot('ipad-2-direct-chat');
await openFrom(sofia,'Lucas Rivera');await settle();await shot('ipad-3-disappearing');
log('RESULT: screenshots captured');
await browser.close();await env.cleanup();server.close();
process.exit(0);
