// Generate one durable, honest run index after downloading all job artifacts.
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(process.argv[2] || 'evidence');
fs.mkdirSync(root,{recursive:true});
const stages=[
  ['unit','Reviewed functional and security regressions'],
  ['rules','Firebase emulator Firestore access rules'],
  ['browser','Browser-based native-mode UI journeys'],
  ['android','Android native simulator'],
  ['ios','iPhone native simulator']
];
const jobByStage={unit:'reviewed-regressions',rules:'firebase-rules',browser:'browser-journeys',android:'native-android',ios:'native-ios'};
const needs=JSON.parse(process.env.FIDUNIO_NEEDS_JSON||'{}');
const results=[];
for(const [name,label] of stages){
  const file=path.join(root,name,'REPORT.md');
  const text=fs.existsSync(file)?fs.readFileSync(file,'utf8'):'';
  const exists=!!text;
  const pass=exists&&/\*\*Result: PASS\b/.test(text);
  const fail=exists&&!pass;
  const images=[];
  if(fs.existsSync(path.join(root,name))){
    const recur=dir=>{
      for(const item of fs.readdirSync(dir,{withFileTypes:true})){
        const f=path.join(dir,item.name);
        if(item.isDirectory())recur(f);
        else if(item.isFile()&&/\.png$/i.test(item.name))images.push(path.relative(path.join(root,name),f));
      }
    };
    recur(path.join(root,name));
  }
  const jobResult=needs[jobByStage[name]]?.result||'unknown';
  const status=!exists?(jobResult==='failure'?'FAIL':'NOT RUN'):pass?'PASS':'FAIL';
  results.push({name,label,status,jobResult,images:images.length});
}
const success=results.every(x=>x.status==='PASS');
const url=(process.env.GITHUB_SERVER_URL||'https://github.com')+'/'+(process.env.GITHUB_REPOSITORY||'willyros01/hermes')+'/actions/runs/'+(process.env.GITHUB_RUN_ID||'local');
const lines=[
  '# FIDUNIO simulator + emulator evidence',
  '',
  '**Overall result: '+(success?'PASS':'INCOMPLETE / FAIL')+'**',
  '',
  '- GitHub Actions run: '+url,
  '- Test-only source commit: '+(process.env.GITHUB_SHA||'local'),
  '- Production app branches and Firebase project were not mutated',
  '- Firebase: disposable `demo-` project IDs and localhost emulator ports',
  '',
  '## Verification stages','',
  '| Stage | Status | PNG captures | Detailed evidence |',
  '| --- | --- | ---: | --- |',
  ...results.map(x=>'| '+x.label+' | **'+x.status+'** | '+x.images+' | '+(fs.existsSync(path.join(root,x.name,'REPORT.md'))?'['+x.name+'/REPORT.md]('+x.name+'/REPORT.md)':'No detailed report; inspect GitHub job ('+x.jobResult+')')+' |'),
  '',
  '## Interpretation','',
  '- Native device captures prove the specified pre-auth screens on disposable phone simulators, not full authenticated messaging.',
  '- Firebase rules checks verify actual repository rules inside local emulators.',
  '- Existing source tests cover a wide range of E2EE, direct/group messages, attachments, deletion, retention, recovery, notification policy, settings, and platform boundaries.',
  '- A green script build is never treated as proof that APNs, Amazon ADM, physical biometrics, actual camera pickers, or real push-tap routing works.',
  '- Live Firebase messaging, external email delivery, physical Fire HD 8, iPhone/iPad acceptance, and real notification providers require separate controlled acceptance testing.',
  ''
];
fs.writeFileSync(path.join(root,'REPORT.md'),lines.join('\n'));
fs.writeFileSync(path.join(root,'results.json'),JSON.stringify({overall:success?'PASS':'INCOMPLETE / FAIL',stages:results},null,2)+'\n');
console.log(lines.slice(0,results.length+13).join('\n'));
