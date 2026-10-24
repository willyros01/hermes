/* Seed only the disposable emulator. Real native Join redeems this invitation.
 * Never connect to, or even initialize, a live Firebase project here. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash, generateKeyPairSync, randomBytes} from 'node:crypto';
import {initializeTestEnvironment} from '@firebase/rules-unit-testing';

const project='demo-fidunio-simulator-tests';
if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8080'||process.env.FIREBASE_AUTH_EMULATOR_HOST!=='127.0.0.1:9099')
  throw new Error('REFUSING to seed anything outside localhost demo emulators');
const destination=path.resolve(process.argv[2]||'out-fidunio/native-fixture.json');
const test=await initializeTestEnvironment({projectId:project,firestore:{host:'127.0.0.1',port:8080}});
const suffix=(process.env.GITHUB_RUN_ID||Date.now())+'-'+randomBytes(3).toString('hex');
const password='NativeSimulatorOnly-554411!';
const peers=[];
try{
  for(const label of ['Owner','Bob','Carol']){
    const email=`${label.toLowerCase()}-${suffix}@simulator.invalid`;
    const r=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-only',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})});
    const v=await r.json();
    if(!r.ok||!v.localId)throw new Error('Local Auth seed failed: '+JSON.stringify(v).slice(0,180));
    const {publicKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
    peers.push({label,uid:v.localId,email,publicJwk:publicKey.export({format:'jwk'})});
  }
  const alice={email:`alice-${suffix}@simulator.invalid`,password,pin:'473829',name:'Native Test Alice'};
  const inviteToken=randomBytes(24).toString('base64url');
  const inviteId=createHash('sha256').update(inviteToken).digest('hex');
  await test.withSecurityRulesDisabled(async ctx=>{
    const db=ctx.firestore(),batch=db.batch();
    batch.set(db.doc('system/access'),{ownerUid:peers[0].uid,createdByUid:peers[0].uid,accessModel:'invite-only-v1'});
    for(const p of peers){
      batch.set(db.doc('users/'+p.uid),{displayName:'Simulator '+p.label,email:p.email,systemRole:p.label==='Owner'?'owner':'user',active:true});
      batch.set(db.doc('e2eePublicKeys/'+p.uid),{uid:p.uid,keyId:'native-peer-'+p.uid,schemaVersion:1,identityVersion:1,keyAlgorithm:'ECDH-P256',publicJwk:p.publicJwk,state:'ACTIVE',createdAt:new Date(),updatedAt:new Date()});
    }
    batch.set(db.doc('invitations/'+inviteId),{status:'pending',role:'admin',invitedByUid:peers[0].uid,invitedByName:'Simulator Owner',createdAt:new Date(),expiresAt:new Date(Date.now()+7*86400000),acceptedUid:null,acceptedAt:null,revokedAt:null});
    await batch.commit();
  });
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  fs.writeFileSync(destination,JSON.stringify({project,alice,inviteToken,inviteId,peers:peers.map(({label,uid,email})=>({label,uid,email}))},null,2)+'\n',{mode:0o600});
  console.log('PASS: disposable Owner/Bob/Carol and admin invitation seeded into LOCAL emulator; synthetic fixture written');
}finally{await test.cleanup();}
