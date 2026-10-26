// Combine Android-shared Chromium and iOS-shared WebKit authenticated records.
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(process.argv[2]||'out-fidunio/functional');
const jobs=[
  ['android','Android-shared / Chromium',14],
  ['ios','iOS-shared / WebKit',14],
  ['web-chromium','1.1.80 web / Chromium',15],
  ['web-webkit','1.1.80 web / WebKit',15]
];
const results=[];
for(const [dir,label,minimum] of jobs){
  const file=path.join(root,dir,'results.json');
  const report=path.join(root,dir,'REPORT.md');
  if(!fs.existsSync(file)||!fs.existsSync(report)){
    results.push({label,status:'NOT RUN',cases:0,passed:0,path:dir+'/REPORT.md'});
    continue;
  }
  const row=JSON.parse(fs.readFileSync(file,'utf8'));
  results.push({label,status:row.failed===0&&row.cases.length>=minimum&&(!dir.startsWith('web-')||row.cases.some(c=>c.id==='FN-009A'&&c.status==='PASS'))?'PASS':'FAIL',cases:row.cases.length,passed:row.passed,path:dir+'/REPORT.md'});
}
const success=results.every(r=>r.status==='PASS');
const lines=[
  '# Authenticated FIDUNIO feature workflows','',
  `**Result: ${success?'PASS':'FAIL'} — ${results.filter(r=>r.status==='PASS').length}/${results.length} cross-platform source/engine runs**`,'',
  '| Source / browser | Status | Cases passed | Report |',
  '| --- | --- | ---: | --- |',
  ...results.map(r=>`| ${r.label} | ${r.status} | ${r.passed}/${r.cases} | [${r.path}](${r.path}) |`),'',
  'Android/iOS source API tests use real authenticated Firebase transactions. Web source tests also click and inspect actual browser reaction chips, dialog and immediate DOM paint, with a clearly marked simulator-only encrypted-text projection. No live production deployment is inferred.',
  'All message ciphertext is synthetic test-fixture data; reviewed cryptography suites run separately.',
  'Actual notification delivery, Cloud Function leases, email, physical biometrics, other settings controls, and native hardware acceptance remain **NOT VERIFIED**.',''
];
fs.writeFileSync(path.join(root,'REPORT.md'),lines.join('\n'));
fs.writeFileSync(path.join(root,'results.json'),JSON.stringify({pass:success,results},null,2)+'\n');
console.log(lines.join('\n'));
if(!success)process.exitCode=1;
