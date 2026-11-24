#!/usr/bin/env node
/* Insert the HELP rules into a Firestore rules file just before the closing of
 * "match /databases/{database}/documents". Refuses if already present or if the
 * file does not end the way FIDUNIO's rules end. Usage: node merge-help-rules.mjs IN HELP OUT */
import fs from 'node:fs';
const [inFile,helpFile,outFile]=process.argv.slice(2);
const base=fs.readFileSync(inFile,'utf8'),help=fs.readFileSync(helpFile,'utf8');
if(base.includes('FIDUNIO HELP alerts'))throw new Error('HELP rules already present');
const m=base.match(/\n  \}\n\}\s*$/);
if(!m)throw new Error('Unexpected end of rules file; stop and check by hand');
const at=m.index+1;
fs.writeFileSync(outFile,base.slice(0,at)+help+base.slice(at));
console.log('PASS: HELP rules merged into '+outFile);
