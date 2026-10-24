/* Disposable simulator-only compatibility probe.
 * This runs AFTER cap sync, on ios/App/App/public, NEVER on checked-in app
 * sources or production/TestFlight builds. If WebKit rejects nonextractable
 * CryptoKey structured cloning in IndexedDB, keep the already-unlocked key
 * in memory for this ONE simulator session so later screens can be tested.
 * E2EE local-key persistence, restart and recovery remain NOT VERIFIED.
 */
import fs from 'node:fs';
import path from 'node:path';

const folder = path.resolve(process.argv[2] || '');
const file = path.join(folder, 'local-security.js');
if(!folder.endsWith(path.join('ios', 'App', 'App', 'public')) || !fs.existsSync(file))
  throw new Error('Refusing iOS key patch outside disposable Capacitor public folder');
if(process.env.GITHUB_ACTIONS !== 'true' || !process.cwd().endsWith('ios-src'))
  throw new Error('Refusing simulator compatibility patch outside ios-src Actions checkout');
let source = fs.readFileSync(file, 'utf8');
if(source.includes('FIDUNIO_SIMULATOR_ONLY_IDB_KEY_FALLBACK'))throw new Error('Simulator key patch already applied');
const save = source.match(/^export async function saveLocalAccountE2EEIdentity\([^\n]+$/m)?.[0];
const read = source.match(/^export async function readLocalAccountE2EEIdentity\([^\n]+$/m)?.[0];
if(!save || !read || !save.includes('tx.objectStore("meta").put(') || !read.includes('ACCOUNT_E2EE_LOCAL_PREFIX'))
  throw new Error('The release-source local E2EE identity functions changed; refusing unsafe patch');

const substitute = `
// SIMULATOR-ONLY, session-volatile compatibility: never include in release.
const __fidunioSimulatorMemoryKeys = new Map();
${save.replace('export async function saveLocalAccountE2EEIdentity', 'async function __fidunioSaveIdentityOriginal')}
export async function saveLocalAccountE2EEIdentity(identity){
  try { return await __fidunioSaveIdentityOriginal(identity); }
  catch(error){
    if(!/clone|cloned|dataclone/i.test(String(error?.name||'')+' '+String(error?.message||error)))throw error;
    // Keep original nonextractable CryptoKey. Never export, log or send it.
    __fidunioSimulatorMemoryKeys.set(String(identity.uid), {...identity});
    globalThis.FIDUNIO_SIMULATOR_ONLY_IDB_KEY_FALLBACK = true;
    console.warn('FIDUNIO SIMULATOR ONLY: WKWebView refused IndexedDB CryptoKey clone; using volatile in-memory identity for functional UI tests');
  }
}
${read.replace('export async function readLocalAccountE2EEIdentity', 'async function __fidunioReadIdentityOriginal')}
export async function readLocalAccountE2EEIdentity(uid, {keyId,revision}={}){
  const row=__fidunioSimulatorMemoryKeys.get(String(uid));
  if(row && row.keyId===String(keyId) && Number(row.revision)===Number(revision))return row;
  return __fidunioReadIdentityOriginal(uid,{keyId,revision});
}
`;
source = source.replace(save, '').replace(read, substitute);
fs.writeFileSync(file, source);
console.log('SIMULATOR ONLY: patched generated iOS web asset for optional volatile CryptoKey fallback; production source untouched');

// Localize a remaining error without changing app behavior: phase markers are
// session-only strings and contain no private keys, PINs or email addresses.
function annotate(filename, markers){
  const target=path.join(folder,filename);
  if(!fs.existsSync(target))throw new Error('Missing generated diagnostic target: '+filename);
  let js=fs.readFileSync(target,'utf8');
  for(const [uniqueCode,label] of markers){
    const pieces=js.split(uniqueCode);
    if(pieces.length!==2)throw new Error('Ambiguous simulator diagnostic checkpoint '+label+' in '+filename);
    js=pieces.join(`globalThis.FIDUNIO_SIMULATOR_ONLY_PHASE=${JSON.stringify(label)};\n    `+uniqueCode);
  }
  fs.writeFileSync(target,js);
  console.log('SIMULATOR ONLY: inserted non-sensitive enrollment checkpoints into generated '+filename);
}
annotate('auth-ui-clean.js',[
  ['const bound=await bindAuthenticatedAccountE2EE(user.uid);\n      await unlockAccountForMessaging(user,password,pin,{hasIdentity:bound.hasIdentity});','join:bind-identity'],
  ['await unlockAccountForMessaging(user,password,pin,{hasIdentity:bound.hasIdentity});','join:unlock-messaging'],
  ['      await startAppAfterLegalAcceptance(user);\n    };','join:start-app'],
  ['const identity=getAccountE2EERuntimeIdentity();','unlock:runtime-identity'],
  ['if(!local.hasPin)await setLocalPin(pin);','unlock:save-pin'],
  ['await saveLocalAccountE2EEIdentity(identity);','unlock:save-local-key'],
  ['const storageStatus=await getAccountStorageStatus();','start:storage-status'],
  ['await activateAccountStorage(user.uid,{legacyOwnerUid});','start:activate-storage'],
  ['const appModule=await import("./app.js");','start:import-app'],
  ['await appModule.FIDUNIO_APP_READY;','start:app-ready'],
]);
annotate('e2ee-account-identity-manager.js',[
  ['const existing=await identityStore.readIdentity(clean);','enroll:read-existing'],
  ['generated=await generateAccountIdentity();','enroll:generate-key'],
  ['const normalWrapper=await wrapPrivateKeyNormal({privatePkcs8:generated.privatePkcs8,password,pin,uid:clean,keyId});','enroll:wrap-normal'],
  ['const recoveryWrapperLocal=await wrapPrivateKeyRecovery({privatePkcs8:generated.privatePkcs8,recoveryUnlockKey:ruk,uid:clean,keyId});','enroll:wrap-recovery'],
  ['const protectedRecovery=await recoveryService.protectRecoveryKey({uid:clean,keyId,pin,recoveryUnlockKey:ruk});','enroll:protect-recovery'],
  ['const created=await identityStore.createIdentity({uid:clean,privateIdentity:privateDoc({keyId,normalWrapper,recoveryWrapper}),publicIdentity:publicDoc({uid:clean,keyId,publicJwk:generated.publicJwk})});','enroll:write-identity'],
  ['const privateKey=await unwrapPrivateKeyNormal({wrapper:normalWrapper,password,pin,uid:clean,keyId});','enroll:unwrap-runtime'],
]);
