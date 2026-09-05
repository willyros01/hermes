import { createAccountE2EEAuthLifecycle } from "./e2ee-account-lifecycle.js";

const results=[];
async function test(name,fn){try{await fn();results.push([name,true]);console.log("PASS",name);}catch(e){results.push([name,false]);console.error("FAIL",name,e?.message||e);}}
function deferred(){let resolve,reject;const promise=new Promise((res,rej)=>{resolve=res;reject=rej;});return{promise,resolve,reject};}
function makeManager(){
  const calls=[],loads=new Map();let state={state:"EMPTY",uid:null};
  return{
    calls,loads,
    load(uid){calls.push(["load",uid]);const d=deferred();loads.set(uid,d);return d.promise.then(doc=>{state={state:doc?"LOCKED":"EMPTY",uid};return doc;});},
    resetForSignOut(){calls.push(["reset"]);state={state:"EMPTY",uid:null};},
    getState(){return{...state};}
  };
}

await test("duplicate bind joins one in-flight load",async()=>{const m=makeManager(),l=createAccountE2EEAuthLifecycle({manager:m});const a=l.bindAuthenticatedUid("A"),b=l.bindAuthenticatedUid("A");if(a!==b)throw new Error("duplicate bind did not join");if(m.calls.filter(c=>c[0]==="load").length!==0)await Promise.resolve();if(m.calls.filter(c=>c[0]==="load").length!==1)throw new Error("load count not one");m.loads.get("A").resolve({keyId:"k"});const r=await a;if(!r.hasIdentity||r.stale)throw new Error("identity load result wrong");});
await test("empty UID is rejected",async()=>{const m=makeManager(),l=createAccountE2EEAuthLifecycle({manager:m});let failed=false;try{l.bindAuthenticatedUid("");}catch{failed=true;}if(!failed)throw new Error("empty uid accepted");});
await test("sign-out resets synchronously",async()=>{const m=makeManager(),l=createAccountE2EEAuthLifecycle({manager:m});const p=l.bindAuthenticatedUid("A");await Promise.resolve();l.resetForSignOut();const s=l.getLifecycleState();if(s.uid!==null||s.inFlight)throw new Error("binding not cleared");if(m.calls.at(-1)?.[0]!=="reset")throw new Error("manager not reset");m.loads.get("A").resolve(null);const r=await p;if(!r.stale)throw new Error("old load was not stale");});
await test("account switch resets before loading next UID",async()=>{const m=makeManager(),l=createAccountE2EEAuthLifecycle({manager:m});const pA=l.bindAuthenticatedUid("A");await Promise.resolve();const pB=l.bindAuthenticatedUid("B");await Promise.resolve();const sequence=m.calls.map(x=>x.join(":"));if(sequence.join(",")!=="load:A,reset,load:B")throw new Error(sequence.join(","));m.loads.get("A").resolve(null);m.loads.get("B").resolve({keyId:"b"});if(!(await pA).stale)throw new Error("A not stale");const b=await pB;if(b.stale||!b.hasIdentity)throw new Error("B not current");});
await test("manager invalidation is normalized as stale",async()=>{const m=makeManager();m.load=uid=>{m.calls.push(["load",uid]);const e=new Error("invalidated");e.code="OPERATION_INVALIDATED";return Promise.reject(e);};const l=createAccountE2EEAuthLifecycle({manager:m});const r=await l.bindAuthenticatedUid("A");if(!r.stale)throw new Error("invalidation not stale");});
await test("ordinary manager errors propagate",async()=>{const m=makeManager();m.load=()=>Promise.reject(new Error("backend down"));const l=createAccountE2EEAuthLifecycle({manager:m});let failed=false;try{await l.bindAuthenticatedUid("A");}catch(e){failed=e.message==="backend down";}if(!failed)throw new Error("ordinary error swallowed");});
await test("settled bind may reload same authenticated UID",async()=>{const m=makeManager(),l=createAccountE2EEAuthLifecycle({manager:m});let p=l.bindAuthenticatedUid("A");await Promise.resolve();m.loads.get("A").resolve(null);await p;p=l.bindAuthenticatedUid("A");await Promise.resolve();if(m.calls.filter(c=>c[0]==="load").length!==2)throw new Error("second load did not occur");m.loads.get("A").resolve(null);await p;});

const failed=results.filter(([,ok])=>!ok);console.log(`\n${results.length-failed.length}/${results.length} account E2EE lifecycle assertions passed.`);if(failed.length)process.exitCode=1;
