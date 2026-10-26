/* Patch only a disposable generated Capacitor payload, NEVER the source files.
 * Builds that skip this fail-closed guard cannot be used for simulator testing.
 * The test-only app uses demo- project IDs and local Firebase emulators. */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
const platform = process.argv[3];
if (!['android', 'ios'].includes(platform)) throw new Error('Usage: node patch-sandbox.mjs SOURCE_CHECKOUT android|ios');
const generated = path.join(root, 'www');
const firebase = path.join(generated, 'firebase.js');
const config = path.join(generated, 'firebase-config.js');
const capacitorConfig = path.join(root, 'capacitor.config.json');
for (const file of [firebase, config, capacitorConfig]) if (!fs.statSync(file).isFile()) throw new Error('Missing test-only build input: ' + file);

const srcConfig = fs.readFileSync(config, 'utf8');
if (!srcConfig.includes('fidunio-fef13')) throw new Error('Unexpected Firebase source config: no source production identifier to replace');
const srcFirebase = fs.readFileSync(firebase, 'utf8');
const appCheckAnchor = 'const appCheck=await createPlatformFirebaseAppCheck({app,appCheckSdk,siteKey:FIDUNIO_RECAPTCHA_ENTERPRISE_SITE_KEY});';
const servicesAnchor = 'services={app,appCheck,auth,db,functions,storage,authSdk,fsSdk,functionsSdk,storageSdk,messagingSdk,messaging:null};';
if (srcFirebase.split(appCheckAnchor).length !== 2 || srcFirebase.split(servicesAnchor).length !== 2) {
  throw new Error('Firebase owner structure changed. Stop and audit before generating an emulator app.');
}
const demo = Object.freeze({
  apiKey: 'demo-only-no-production-credentials',
  authDomain: 'demo-fidunio-simulator-tests.firebaseapp.com',
  projectId: 'demo-fidunio-simulator-tests',
  storageBucket: 'demo-fidunio-simulator-tests.appspot.com',
  messagingSenderId: '1234567890',
  appId: '1:1234567890:web:fiduniosimtest'
});
const ownerGuard = 'if(firebaseConfig.projectId!=="demo-fidunio-simulator-tests")throw new Error("Simulator Firebase project guard");';
const host = platform === 'android' ? '10.0.2.2' : '127.0.0.1';
const emulators =
  ownerGuard +
  'authSdk.connectAuthEmulator(auth,"http://' + host + ':9099",{disableWarnings:true});' +
  'fsSdk.connectFirestoreEmulator(db,"' + host + '",8080);' +
  'storageSdk.connectStorageEmulator(storage,"' + host + '",9199);' +
  'functionsSdk.connectFunctionsEmulator(functions,"' + host + '",5001);';
let patched = srcFirebase.replace(appCheckAnchor, 'const appCheck=null;/* simulator only: App Check does not contact production */');
patched = patched.replace(servicesAnchor, emulators + servicesAnchor);

const reactionAnchor='try{return await s.fsSdk.runTransaction(s.db,async tx=>{const snap=await tx.get(ref);if(!snap.exists())throw new Error("Message was not found.");const next=nextMessageReactions(snap.data().reactions,authUser.uid,reaction);tx.update(ref,{reactions:next});return{reactions:next,reaction:next[authUser.uid]||null};});}';
const reactionErrorAnchor='catch(err){const code=String(err?.code||"").toLowerCase();if(kind==="direct"';
if(patched.split(reactionAnchor).length!==2 || patched.split(reactionErrorAnchor).length!==2)
  throw new Error('Reaction transaction owner changed. Do not install simulator diagnostics.');
const reactionInstrumented=String.raw`
const simTrace={kind,id,mid,uid:authUser.uid,reaction,startedAt:Date.now(),attempts:[],outcome:"pending"};
(globalThis.__fidunioSimReactionTrace||(globalThis.__fidunioSimReactionTrace=[])).push(simTrace);
try{
  const result=await s.fsSdk.runTransaction(s.db,async tx=>{
    const snap=await tx.get(ref);if(!snap.exists())throw new Error("Message was not found.");
    const previous=snap.data().reactions||{};
    const next=nextMessageReactions(previous,authUser.uid,reaction);
    simTrace.attempts.push({prior:previous[authUser.uid]||null,next:next[authUser.uid]||null,at:Date.now()});
    tx.update(ref,{reactions:next});return{reactions:next,reaction:next[authUser.uid]||null};
  });
  simTrace.outcome="committed";simTrace.result=result.reaction;simTrace.finishedAt=Date.now();return result;
}
`;
patched=patched.replace(reactionAnchor,reactionInstrumented);
patched=patched.replace(reactionErrorAnchor,'catch(err){simTrace.outcome="error";simTrace.error=String(err?.code||err?.message||err);simTrace.finishedAt=Date.now();const code=String(err?.code||"").toLowerCase();if(kind==="direct"');
const networkHook=String.raw`
globalThis.__fidunioSimNetwork={
  state:"online",error:"",
  offline(){
    this.state="switching-offline";this.error="";
    fsSdk.disableNetwork(db).then(()=>{this.state="offline";}).catch(e=>{this.error=String(e);this.state="error";});
  },
  online(){
    this.state="switching-online";this.error="";
    fsSdk.enableNetwork(db).then(()=>{this.state="online";window.dispatchEvent(new Event("online"));}).catch(e=>{this.error=String(e);this.state="error";});
  }
};
`;
patched=patched.replace(servicesAnchor,networkHook+servicesAnchor);
if(!patched.includes('__fidunioSimReactionTrace')||!patched.includes('__fidunioSimNetwork'))
  throw new Error('Simulator diagnostics were not installed');

if (!patched.includes(ownerGuard) || !patched.includes('connectFirestoreEmulator')) throw new Error('Emulator-only Firebase substitution was incomplete');
fs.writeFileSync(firebase, patched);
fs.writeFileSync(config, 'export const firebaseConfig=' + JSON.stringify(demo) + ';\n');
const cap = JSON.parse(fs.readFileSync(capacitorConfig, 'utf8'));
if (cap.appId !== 'io.github.willyros01.fidunio') throw new Error('Wrong Capacitor source app ID');
if (platform === 'android') cap.android = {...cap.android, webContentsDebuggingEnabled: true, allowMixedContent: true};
fs.writeFileSync(capacitorConfig, JSON.stringify(cap, null, 2) + '\n');

const prodConfig = fs.readFileSync(config, 'utf8');
if (prodConfig.includes('fidunio-fef13') || !prodConfig.includes('demo-fidunio-simulator-tests')) throw new Error('Unsafe test app config');
fs.writeFileSync(path.join(generated, 'SIMULATOR-ONLY.txt'),
  'DISPOSABLE FIDUNIO TEST APP. Firebase Auth/Firestore/Storage/Functions use only local emulators. NEVER DISTRIBUTE.\n');
console.log('PASS: ' + platform + ' generated test app isolated from production config, pinned to demo project and localhost emulators');
