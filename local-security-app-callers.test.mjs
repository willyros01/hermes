import fs from 'node:fs';
const src=fs.readFileSync(new URL('./app.js',import.meta.url),'utf8');
const checks=[
  ['timeout handler is async',/timeoutSelect\.onchange=async\(\)=>/],
  ['timeout mutation awaited',/await setLockTimeoutMs\(Number\(timeoutSelect\.value\)\)/],
  ['device unlock disable handler async',/disableBiometricBtn\.onclick=async\(\)=>/],
  ['device unlock mutation awaited',/await disableBiometric\(\)/]
];
for(const [name,re] of checks){if(!re.test(src))throw new Error('FAIL: '+name);console.log('PASS:',name)}
