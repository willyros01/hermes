/* Runs FIDUNIO's existing real-browser UI journeys using local fake Firebase
 * config, gstatic SDK modules, and a local Auth emulator. Never live Firebase. */
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const out = path.resolve(process.argv[2] || 'out-fidunio/browser');
const sources = [
  {name: 'Android-shared',dir:process.cwd()},
  {name: 'ios-shared',dir:path.resolve(process.argv[3] || 'ios-src')}
];
if (process.env.FIDUNIO_AUTH_EMULATOR_URL !== 'http://127.0.0.1:9099') {
  throw new Error('Browser tests require the local Auth emulator on localhost:9099');
}
if (!process.env.FIRESTORE_EMULATOR_HOST || !/^(localhost|127\.0\.0\.1):\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST)) {
  throw new Error('Browser tests refuse to run outside the localhost Firebase emulators');
}
fs.mkdirSync(out,{recursive:true});
const cases = [];
for(const source of sources){
  for(const browser of ['chromium','webkit']){
    const dest=path.join(out,source.name,browser);
    fs.mkdirSync(dest,{recursive:true});
    const env={...process.env,TEST_BROWSER:browser};
    for(const key of ['GOOGLE_APPLICATION_CREDENTIALS','FIREBASE_TOKEN','GH_TOKEN','GITHUB_TOKEN','FIREBASE_CONFIG'])delete env[key];
    const result=spawnSync(process.execPath,['build/ios-browser-release.test.mjs'],{
      cwd:source.dir,env,encoding:'utf8',timeout:300000,maxBuffer:12*1024*1024
    });
    const combined=String(result.stdout||'')+'\n'+String(result.stderr||'');
    fs.writeFileSync(path.join(dest,'console.log'),combined);
    const captures=path.join(source.dir,'browser-release-evidence');
    if(fs.existsSync(captures)){
      for(const file of fs.readdirSync(captures)){
        if(file.startsWith(browser+'-')){
          fs.copyFileSync(path.join(captures,file),path.join(dest,file));
        }
      }
    }
    const shots=fs.readdirSync(dest).filter(x=>x.endsWith('.png'));
    const pass=result.status===0&&!result.error;
    const markers=combined.split('\n').filter(x=>x.includes('PASS: '));
    const summary=[
      '# FIDUNIO '+source.name+' - '+browser+' simulated iPhone browser journey',
      '',
      '**Result: '+(pass?'PASS':'FAIL')+'**',
      '',
      '- Source: '+source.name+' checkout; real shared source and browser engine',
      '- Firebase config: demo project only; gstatic SDK and localhost Auth emulator',
      '- GitHub run: https://github.com/'+(process.env.GITHUB_REPOSITORY||'willyros01/hermes')+
        '/actions/runs/'+(process.env.GITHUB_RUN_ID||'local'),
      '',
      '## Verified assertions reported by the existing browser suite','',
      ...markers.map(x=>'- '+x.trim()),
      '',
      '## Browser screen captures','',
      ...shots.flatMap(file=>['### '+file,'','!['+file+']('+file+')','']),
      '## Scope','','This test exercises Terms, Join, startup, password visibility, invitation Universal Link simulation, PIN/biometrics mock failure, local cryptography storage, and safe startup recovery. It does not prove a real Face ID sensor or physical push receipt.',''
    ];
    fs.writeFileSync(path.join(dest,'REPORT.md'),summary.join('\n'));
    cases.push({source:source.name,browser,pass,markers:markers.length,shots:shots.length,
      path:source.name+'/'+browser+'/REPORT.md',error:result.error?.message||null});
    console.log((pass?'PASS ':'FAIL ')+source.name+' / '+browser+'; '+markers.length+' PASS markers, '+shots.length+' screenshots');
  }
}
const passed=cases.filter(x=>x.pass).length;
const lines=[
  '# FIDUNIO cross-branch browser simulation','',
  '**Result: '+(passed===cases.length?'PASS':'FAIL')+' — '+passed+'/'+cases.length+' browser-source journeys**','',
  '| Shared source | Browser engine | Result | PASS markers | Captures | Detailed report |',
  '| --- | --- | --- | ---: | ---: | --- |',
  ...cases.map(x=>'| '+x.source+' | '+x.browser+' | '+(x.pass?'PASS':'FAIL')+' | '+x.markers+' | '+x.shots+' | ['+x.path+']('+x.path+') |'),
  '','These are simulated iPhone-mode browser journeys (Chromium/WebKit), not actual device notifications.',''
];
fs.writeFileSync(path.join(out,'REPORT.md'),lines.join('\n'));
fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(cases,null,2)+'\n');
process.exit(passed===cases.length?0:1);
