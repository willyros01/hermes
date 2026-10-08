import {chromium,webkit} from "playwright";
import {createServer} from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";

const root=process.cwd();
const server=createServer(async(req,res)=>{
 try{
  const rel=decodeURIComponent(new URL(req.url,"http://localhost").pathname).replace(/^\//,"")||"index.html";
  const file=path.resolve(root,rel);
  if(!file.startsWith(root+path.sep))throw Error("unsafe path");
  let body=await fs.readFile(file);
  if(rel==="firebase-config.js")body=Buffer.from('export const firebaseConfig={apiKey:"demo-main3-web",authDomain:"demo-main3-web.firebaseapp.com",projectId:"demo-main3-web",appId:"1:123:web:main3",storageBucket:"demo-main3-web.appspot.com",messagingSenderId:"123"};');
  res.setHeader("Content-Type",({".js":"text/javascript",".html":"text/html",".css":"text/css",".json":"application/json",".png":"image/png"})[path.extname(rel)]||"application/octet-stream");
  res.end(body);
 }catch{res.writeHead(404);res.end("Not found");}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const base="http://127.0.0.1:"+server.address().port;
const name=process.env.TEST_BROWSER||"chromium";
const browser=await ({chromium,webkit}[name]).launch();
try{
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:"block"});
 await context.route("**/*",route=>{
  const url=route.request().url();
  if(url.startsWith(base+"/")||url.startsWith("https://www.gstatic.com/firebasejs/"))return route.continue();
  return route.abort();
 });
 const page=await context.newPage();
 const pageErrors=[];page.on("pageerror",e=>pageErrors.push(e.message));
 await page.goto(base);
 const platform=await page.evaluate(async()=>{
  const m=await import("/platform-runtime.js");
  return{kind:m.detectFidunioPlatform(),webPush:m.shouldUseWebPush(),webAppCheck:m.shouldUseWebAppCheck()};
 });
 assert.deepEqual(platform,{kind:"web",webPush:true,webAppCheck:true});
 await page.locator("#startupTermsTick").waitFor({state:"visible",timeout:45000});
 assert.equal(await page.locator("#loginEmail").count(),0,"Terms must block authentication");
 assert.equal(await page.locator("#startupTermsAccept").isDisabled(),true);
 await page.locator("#startupTermsTick").check();
 await page.locator("#startupTermsAccept").click();
 await page.locator("#loginEmail").waitFor({state:"visible",timeout:45000});
 assert.equal(await page.locator("#loginPassword").getAttribute("type"),"password");
 assert.equal(await page.locator(".startup-shell").count(),0);
 assert.equal(pageErrors.length,0,"Unexpected JavaScript exceptions: "+pageErrors.join("; "));
 await context.close();
 console.log("PASS: "+name+" genuine web path, legal acceptance, login shell, no native Capacitor shim");
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
