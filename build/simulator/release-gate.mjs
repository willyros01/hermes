import fs from 'node:fs';import path from 'node:path';
const args={};for(let i=2;i<process.argv.length;i+=2)args[process.argv[i].replace(/^--/,'')]=process.argv[i+1];
const read=(p)=>{try{return JSON.parse(fs.readFileSync(p,'utf8'))}catch{return null}};
const root='build/simulator/';
const list=read(args.manifest||root+'release-manifest.json');
if(list?.schema!==2||list.scenarios?.length!==88||new Set(list.scenarios.map(x=>x.id)).size!==88)throw Error('Release coverage manifest is missing/incomplete');
const paths={android:args.android||'evidence/android/auth/results.json',ios:args.ios||'evidence/ios/auth/results.json'};
const sources={android:args['android-sha']||'',ios:args['ios-sha']||''};
const results={android:read(paths.android),ios:read(paths.ios)};
const signed=read(args.attestations||root+'release-attestations.json')?.scenarios||{};
const cases=list.scenarios.map(row=>{
 const problems=[],native={};for(const p of ['android','ios']){
  const report=results[p];
  if(!report||report.platform!==p||report.result!=='PASS'||report.failed!==0||report.blocked!==0){problems.push(p+' native suite missing or failed');native[p]='NOT_VERIFIED';continue}
  if(!sources[p]||report.source_commit!==sources[p]){problems.push(p+' exact release-source commit unverified');native[p]='STALE';continue}
  const tests=(row.native_test_ids||[]).map(id=>report.tests.find(t=>t.id===id));
  if(!tests.length||tests.some(t=>!t||t.status!=='PASS'||!t.screenshots?.length)){problems.push(p+' dedicated native test/screenshot missing');native[p]='NOT_VERIFIED';continue}
  if(tests.flatMap(t=>t.screenshots).some(name=>name.includes('..')||!name.endsWith('.png')||!fs.existsSync(path.join(path.dirname(paths[p]),name)))){problems.push(p+' screenshot file missing');native[p]='NOT_VERIFIED';continue}
  native[p]='PASS';
 }
 for(const type of row.required.filter(t=>!t.endsWith('-native'))){
  const a=signed[row.id]?.[type];
  if(!(a?.status==='PASS'&&a.expected_met===true&&a.reviewed_by&&a.reviewed_at&&/^https:\/\//.test(a.evidence_url||'')&&a.android_sha===sources.android&&a.ios_sha===sources.ios))problems.push(type+' independent acceptance absent');
 }
 return{id:row.id,name:row.name,native,status:problems.length?'BLOCKED':'PASS',missing:problems};
});
const blocked=cases.filter(x=>x.status!=='PASS'),report={decision:blocked.length?'BLOCKED':'READY_FOR_OWNER_REVIEW',passed:cases.length-blocked.length,required:cases.length,source_refs:sources,cases,disclaimer:'Simulator PASS is not hardware/provider or production-release approval.'};
const out=args.output||'out-fidunio/release-gate.json';fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
const md=['# FIDUNIO release gate','',report.decision+': '+report.passed+'/'+report.required,'','| ID | Function | Android | iPhone | Verdict |','|---|---|---|---|---|',...cases.map(x=>'| '+[x.id,x.name,x.native.android,x.native.ios,x.status].join(' | ')+' |'),'','## Open gaps',...blocked.map(x=>'- '+x.id+': '+x.missing.join('; '))].join('\n');
fs.writeFileSync(out.replace(/\.json$/,'.md'),md+'\n');console.log('FIDUNIO RELEASE GATE: '+report.decision+'; '+report.passed+'/'+report.required+' scenarios');process.exit(blocked.length?1:0);
