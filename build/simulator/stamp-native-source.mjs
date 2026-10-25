// Immutable source provenance for a disposable native simulation result.
import fs from 'node:fs';
import path from 'node:path';
const file=path.resolve(process.argv[2]||'');
const sha=process.argv[3]||'';
if(!file.includes('/out-fidunio/')||!/\/auth\/results\.json$/.test(file)||!/^[0-9a-f]{40}$/.test(sha))
  throw Error('Require exact test artifact path and 40-digit source commit');
const result=JSON.parse(fs.readFileSync(file,'utf8'));
if(!['android','ios'].includes(result.platform)||!Array.isArray(result.tests))throw Error('Invalid native test evidence');
if(result.source_commit&&result.source_commit!==sha)throw Error('Conflicting source provenance');
result.source_commit=sha;
fs.writeFileSync(file,JSON.stringify(result,null,2)+'\n');
console.log('Native '+result.platform+' evidence bound to exact release-source commit '+sha);
