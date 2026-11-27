/* Plain-words result on the GitHub run page (owner 27 Nov: no cryptic test names or machine wording).
 * usage: node build/probe/plain-summary.mjs OUT DEVICE   (DEVICE: Android, iPhone or iPad) */
import fs from 'node:fs';
import path from 'node:path';
const [out,device]=process.argv.slice(2);
const summary=process.env.GITHUB_STEP_SUMMARY;
const lines=[];
const clean=t=>String(t||'').replace(/\s+/g,' ').replace(/;?\s*(HELP )?trace \[.*?\](?=;|$)/g,'').trim();
/* Checks a simulator cannot do (listed under "Not tested" instead of failing every run). */
const limits={iPhone:['PASTE'],iPad:[],Android:[]};
const notTested={
  Android:['A real notification sent through Google\'s or Amazon\'s service (the simulator has no connection to them).','The notifications-off reminder (the test app cannot include Amazon\'s notification part).'],
  iPhone:['Paste from the phone\'s own Paste menu (the simulator\'s touch layer cannot find it).','A real notification sent through Apple\'s service (a notification is posted directly on the simulator instead).','Turning notifications on fully (the test app has no real Firebase project).'],
  iPad:['A real notification sent through Apple\'s service.']
};
let data=null;try{data=JSON.parse(fs.readFileSync(path.join(out,'results.json'),'utf8'));}catch{}
if(!data){
  let why='';try{why=clean(fs.readFileSync(path.join(out,'probe.txt'),'utf8').trim().split('\n').pop());}catch{}
  lines.push(`# ${device}: the test did not run`,'',`## The test machine could not start FIDUNIO, so there is no FIDUNIO result. This is not a FIDUNIO failure.`,'',why?`## Last thing the test saw: ${why.slice(0,300)}`:'');
  console.log(`::error title=${device}: the test did not run::The test machine could not start FIDUNIO. This is not a FIDUNIO result.`);
}else{
  const r=(data.results||[]).filter(x=>!(limits[device]||[]).includes(x.id));const bad=r.filter(x=>!x.ok),good=r.filter(x=>x.ok);
  lines.push(`# ${device}: ${good.length} passed, ${bad.length} failed`,'');
  for(const x of bad){
    lines.push(`## FAILED: ${clean(x.what)}`,`### Should happen: ${clean(x.expected)}`,`### What happened: ${clean(x.observed).slice(0,400)}`,'');
    console.log(`::error title=${device} FAILED::${clean(x.what).slice(0,180)} — should: ${clean(x.expected).slice(0,180)}`);
  }
  for(const x of good)lines.push(`### Passed: ${clean(x.what)}`);
  lines.push('');
}
lines.push(`## Not tested by the ${device} simulator (check on a real device):`);
for(const t of notTested[device]||[])lines.push(`### ${t}`);
const text=lines.join('\n')+'\n';
if(summary)fs.appendFileSync(summary,text);else process.stdout.write(text);
