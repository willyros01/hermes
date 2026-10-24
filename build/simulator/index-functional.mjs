// Combine Android-shared Chromium and iOS-shared WebKit authenticated records.
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(process.argv[2]||'out-fidunio/functional');
const jobs=[['android','Android-shared / Chromium'],['ios','iOS-shared / WebKit']];
const results=[];
for(const [dir,label] of jobs){
  const file=path.join(root,dir,'results.json');
  const report=path.join(root,dir,'REPORT.md');
  if(!fs.existsSync(file)||!fs.existsSync(report)){
    results.push({label,status:'NOT RUN',cases:0,passed:0,path:dir+'/REPORT.md'});
    continue;
  }
  const row=JSON.parse(fs.readFileSync(file,'utf8'));
  results.push({label,status:row.failed===0&&row.cases.length>=12?'PASS':'FAIL',cases:row.cases.length,passed:row.passed,path:dir+'/REPORT.md'});
}
const success=results.every(r=>r.status==='PASS');
const lines=[
  '# Authenticated FIDUNIO feature workflows','',
  `**Result: ${success?'PASS':'FAIL'} — ${results.filter(r=>r.status==='PASS').length}/${results.length} cross-platform source/engine runs**`,'',
  '| Source / browser | Status | Cases passed | Report |',
  '| --- | --- | ---: | --- |',
  ...results.map(r=>`| ${r.label} | ${r.status} | ${r.passed}/${r.cases} | [${r.path}](${r.path}) |`),'',
  'These are real authenticated client API transactions against the Auth/Firestore emulators, not device chat-screen walkthroughs.',
  'All message ciphertext is synthetic test-fixture data; reviewed cryptography suites run separately.',
  'Actual notification delivery, Cloud Function leases, email, physical biometrics, full settings UI, and native hardware acceptance remain **NOT VERIFIED**.',''
];
fs.writeFileSync(path.join(root,'REPORT.md'),lines.join('\n'));
fs.writeFileSync(path.join(root,'results.json'),JSON.stringify({pass:success,results},null,2)+'\n');
console.log(lines.join('\n'));
if(!success)process.exitCode=1;
