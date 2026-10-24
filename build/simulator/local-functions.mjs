/* Test ONLY: localhost callable adapter for enrollRecoveryV1. No real cloud
 * functions or notification push provider is simulated by this process. */
import http from 'node:http';
import {randomBytes} from 'node:crypto';
import {protectRecoveryUnlockKey} from '../../functions/recovery/e2ee-recovery-server-crypto.mjs';

if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8080'||process.env.FIREBASE_AUTH_EMULATOR_HOST!=='127.0.0.1:9099')
  throw new Error('Local functions shim requires both demo emulator guards');
const masterSecret=randomBytes(32);
const route='/demo-fidunio-simulator-tests/us-central1/enrollRecoveryV1';
const server=http.createServer(async(req,res)=>{
  const respond=(status,body)=>{res.writeHead(status,{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Authorization, Content-Type, X-Firebase-AppCheck, Firebase-Instance-ID-Token','Content-Type':'application/json'});res.end(JSON.stringify(body));};
  if(req.method==='OPTIONS')return respond(204,{});
  if(req.method!=='POST'||req.url!==route)return respond(404,{error:{status:'NOT_FOUND',message:'Test shim does not implement this callable'}});
  try{
    let raw='';for await(const c of req){raw+=c;if(raw.length>65536)throw new Error('Request too large');}
    const auth=String(req.headers.authorization||'').match(/^Bearer ([^.]+)\.([^.]+)\./);
    if(!auth)throw new Error('Missing emulator Auth token');
    const jwt=JSON.parse(Buffer.from(auth[2],'base64url').toString('utf8'));
    const uid=jwt.sub||jwt.user_id;
    if(!uid||typeof uid!=='string')throw new Error('Missing test Auth UID');
    // A syntactically parsed token alone is insufficient: validate against the
    // actual LOCAL emulator account endpoint, with the same Bearer token.
    const account=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:lookup?key=demo-only',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({idToken:req.headers.authorization.slice(7)})});
    const lookup=await account.json();
    if(!account.ok||lookup.users?.[0]?.localId!==uid)throw new Error('Unrecognized emulator Auth account');
    const {keyId,pin,recoveryUnlockKey}=JSON.parse(raw).data||{};
    const wrapped=protectRecoveryUnlockKey({masterSecret,uid,keyId,pin,recoveryUnlockKey:Buffer.from(String(recoveryUnlockKey||''),'base64url')});
    respond(200,{result:wrapped});
  }catch(e){respond(400,{error:{status:'INVALID_ARGUMENT',message:String(e.message).slice(0,140)}});}
});
server.listen(5001,'0.0.0.0',()=>console.log('LOCAL TEST ONLY recovery callable at :5001 (no push or other backend callables)'));
