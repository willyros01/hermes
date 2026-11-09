/* App Store screenshots only: patch the GENERATED www (never source files) so
 * Firebase talks to LOCAL emulators with a demo project. Fails closed. */
import fs from 'node:fs';
import path from 'node:path';
const www=path.resolve('www');
const fb=path.join(www,'firebase.js'),cfg=path.join(www,'firebase-config.js');
let src=fs.readFileSync(fb,'utf8');
if(!fs.readFileSync(cfg,'utf8').includes('fidunio-fef13'))throw new Error('Unexpected Firebase config');
const appCheck='const appCheck=await createPlatformFirebaseAppCheck({app,appCheckSdk,siteKey:FIDUNIO_RECAPTCHA_ENTERPRISE_SITE_KEY});';
const services='services={app,appCheck,auth,db,functions,storage,authSdk,fsSdk,functionsSdk,storageSdk,messagingSdk,messaging:null};';
if(src.split(appCheck).length!==2||src.split(services).length!==2)throw new Error('Firebase structure changed; stop');
const guard='if(firebaseConfig.projectId!=="demo-fidunio-simulator-tests")throw new Error("Screenshot project guard");';
src=src.replace(appCheck,'const appCheck=null;')
  .replace(services,guard+'authSdk.connectAuthEmulator(auth,"http://127.0.0.1:9099",{disableWarnings:true});fsSdk.connectFirestoreEmulator(db,"127.0.0.1",8080);storageSdk.connectStorageEmulator(storage,"127.0.0.1",9199);functionsSdk.connectFunctionsEmulator(functions,"127.0.0.1",5001);'+services);
fs.writeFileSync(fb,src);
fs.writeFileSync(cfg,'export const firebaseConfig='+JSON.stringify({apiKey:'demo-only',authDomain:'demo-fidunio-simulator-tests.firebaseapp.com',projectId:'demo-fidunio-simulator-tests',storageBucket:'demo-fidunio-simulator-tests.appspot.com',messagingSenderId:'1234567890',appId:'1:1234567890:web:fiduniosimtest'})+';\n');
if(fs.readFileSync(cfg,'utf8').includes('fidunio-fef13'))throw new Error('Unsafe config');
fs.writeFileSync(path.join(www,'SIMULATOR-ONLY.txt'),'Disposable screenshot copy. Local emulators only. Never distribute.\n');
console.log('PASS: generated www pinned to local demo emulators');
