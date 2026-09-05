// One-shot rebuild materializer: move Settings Firebase operations behind firebase.js. Trigger after workflow registration.
import fs from "node:fs";

const firebasePath="firebase.js",settingsPath="settings-lifecycle.js",gatePath="runtime-authority-gate.test.mjs";
let firebase=fs.readFileSync(firebasePath,"utf8");
let settings=fs.readFileSync(settingsPath,"utf8");
let gate=fs.readFileSync(gatePath,"utf8");

function replaceOnce(source,from,to,label){
  const first=source.indexOf(from);
  if(first<0)throw new Error(`${label}: anchor missing`);
  if(source.indexOf(from,first+from.length)>=0)throw new Error(`${label}: anchor not unique`);
  return source.slice(0,first)+to+source.slice(first+from.length);
}
function replaceRange(source,start,end,replacement,label){
  const a=source.indexOf(start);if(a<0)throw new Error(`${label}: start anchor missing`);
  const b=source.indexOf(end,a+start.length);if(b<0)throw new Error(`${label}: end anchor missing`);
  if(source.indexOf(start,a+start.length)>=0)throw new Error(`${label}: start anchor not unique`);
  return source.slice(0,a)+replacement+source.slice(b);
}

const centralApis=`// Settings account/admin APIs. firebase.js is the sole Firebase SDK/service owner;
// Settings owns only its DOM lifecycle and serialized user actions.
export async function updateFidunioProfile(values={}){
  const s=await ensureServices(),user=s.auth.currentUser;
  if(!user)throw new Error("Sign in first.");
  const name=String(values.displayName||"").trim(),mail=String(values.email||"").trim(),phone=String(values.telephone||"").trim(),photo=String(values.photoURL||"").trim();
  if(!name)throw new Error("Display name is required.");
  if(mail&&mail!==user.email){
    if(!values.currentPassword)throw new Error("Enter your current password to change your email address.");
    const credential=s.authSdk.EmailAuthProvider.credential(user.email,values.currentPassword);
    await s.authSdk.reauthenticateWithCredential(user,credential);
    await s.authSdk.updateEmail(user,mail);
  }
  await s.authSdk.updateProfile(user,{displayName:name,photoURL:photo||null});
  authUser=user;
  await s.fsSdk.updateDoc(s.fsSdk.doc(s.db,"users",user.uid),{displayName:name,email:user.email||mail,telephone:phone,photoURL:photo,profileUpdatedAt:s.fsSdk.serverTimestamp()});
  return{uid:user.uid,displayName:user.displayName||name,email:user.email||mail,photoURL:user.photoURL||photo};
}
export async function changeFidunioPassword(currentPassword,newPassword){
  const s=await ensureServices(),user=s.auth.currentUser;
  if(!user)throw new Error("Sign in first.");
  if(!currentPassword)throw new Error("Enter your current password.");
  if(String(newPassword||"").length<6)throw new Error("New password must be at least 6 characters.");
  const credential=s.authSdk.EmailAuthProvider.credential(user.email,currentPassword);
  await s.authSdk.reauthenticateWithCredential(user,credential);
  await s.authSdk.updatePassword(user,newPassword);
}
export async function listFidunioUsersForAdmin(){
  const s=await ensureServices();if(!authUser)throw new Error("Sign in first.");
  const snap=await s.fsSdk.getDocs(s.fsSdk.collection(s.db,"users"));
  return snap.docs.map(d=>({uid:d.id,...d.data()})).sort((a,b)=>String(a.displayName||a.email||a.uid).localeCompare(String(b.displayName||b.email||b.uid)));
}
export async function updateFidunioUserLifecycle(targetUid,status,expiryDays=undefined){
  const s=await ensureServices();if(!authUser)throw new Error("Sign in first.");
  const uid=String(targetUid||"").trim();if(!uid)throw new Error("Target user is required.");
  if(!["active","suspended","deactivated"].includes(status))throw new Error("Unsupported account status.");
  const now=s.fsSdk.serverTimestamp(),ref=s.fsSdk.doc(s.db,"users",uid),row={status,active:status==="active",adminUpdatedAt:now,adminUpdatedByUid:authUser.uid};
  if(expiryDays!==undefined)row.expiresAt=expiryDays===null?null:s.fsSdk.Timestamp.fromDate(new Date(Date.now()+Number(expiryDays)*86400000));
  if(status==="suspended"){row.suspendedAt=now;row.suspendedByUid=authUser.uid;row.restoredAt=null;row.restoredByUid=null;}
  if(status==="active"){row.restoredAt=now;row.restoredByUid=authUser.uid;row.suspendedAt=null;row.suspendedByUid=null;row.deactivatedAt=null;row.deactivatedByUid=null;}
  if(status==="deactivated"){row.deactivatedAt=now;row.deactivatedByUid=authUser.uid;}
  await s.fsSdk.updateDoc(ref,row);
}
export async function listPendingFidunioInvitations(){
  const s=await ensureServices();if(!authUser)throw new Error("Sign in first.");
  const snap=await s.fsSdk.getDocs(s.fsSdk.collection(s.db,"invitations"));
  return snap.docs.map(d=>({id:d.id,...d.data()})).filter(i=>i.status==="pending").sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
}
export async function revokeFidunioInvitation(id){
  const s=await ensureServices();if(!authUser)throw new Error("Sign in first.");
  const clean=String(id||"").trim();if(!clean)throw new Error("Invitation is required.");
  await s.fsSdk.updateDoc(s.fsSdk.doc(s.db,"invitations",clean),{status:"revoked",revokedAt:s.fsSdk.serverTimestamp()});
}

`;
if(!firebase.includes("export async function updateFidunioProfile")){
  firebase=replaceOnce(firebase,"function dmId(a,b){",centralApis+"function dmId(a,b){","central Settings API insertion");
}

settings=replaceOnce(settings,
`import {
  getFidunioAccessInfo,
  claimLegacyOwner,
  createFidunioInvitation
} from "./firebase.js";`,
`import {
  getFidunioAccessInfo,
  claimLegacyOwner,
  createFidunioInvitation,
  updateFidunioProfile,
  changeFidunioPassword,
  listFidunioUsersForAdmin,
  updateFidunioUserLifecycle,
  listPendingFidunioInvitations,
  revokeFidunioInvitation
} from "./firebase.js";`,"Settings central API imports");

const sdkStart='const SDK_VERSION="12.18.0";';
const serializeStart='function serializeSettingsMutation(label,work){';
settings=replaceRange(settings,sdkStart,serializeStart,serializeStart,"remove Settings SDK loader");

settings=replaceRange(settings,'async function saveProfile(values){','function renderProfile(profileHost,info){',
`async function saveProfile(values){return updateFidunioProfile(values);}
async function changePassword(currentPassword,newPassword){return changeFidunioPassword(currentPassword,newPassword);}
function renderProfile(profileHost,info){`,"profile Firebase wrappers");

settings=replaceRange(settings,'async function listUsers(){','function canManageUser(u,info){',
`async function listUsers(){return listFidunioUsersForAdmin();}
async function updateLifecycle(target,status,expiryDays=undefined){return updateFidunioUserLifecycle(target?.uid,status,expiryDays);}
function canManageUser(u,info){`,"admin Firebase wrappers");

settings=replaceRange(settings,'async function pendingInvites(){','async function refreshPending(card){',
`async function pendingInvites(){return listPendingFidunioInvitations();}
async function revokeInvite(id){return revokeFidunioInvitation(id);}
async function refreshPending(card){`,"invitation Firebase wrappers");

if(/gstatic\.com\/firebasejs\//.test(settings))throw new Error("Settings still contains direct Firebase SDK imports");
if(/\bapi\(\)/.test(settings)||/\bs\.fsSdk\b|\bs\.authSdk\b/.test(settings))throw new Error("Settings still owns Firebase services");

gate=gate.replace('  "settings-lifecycle.js"    // temporary Settings admin/profile data access\n','');
if(gate.includes('"settings-lifecycle.js"'))throw new Error("Settings Firebase allowlist exception remains");

fs.writeFileSync(firebasePath,firebase);
fs.writeFileSync(settingsPath,settings);
fs.writeFileSync(gatePath,gate);
console.log("Centralized Settings Firebase operations in firebase.js and removed Settings SDK ownership.");
