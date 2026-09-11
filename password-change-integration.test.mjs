import fs from "node:fs";

const runtime=fs.readFileSync("e2ee-account-runtime.js","utf8");
const settings=fs.readFileSync("settings-lifecycle.js","utf8");

function requireTrue(value,message){if(!value)throw new Error(message);}

requireTrue(runtime.includes("manager.rewrap({uid,oldPassword:currentPassword,oldPin:pin,newPassword,newPin:pin})"),"password change must preserve the entered PIN through the E2EE rewrap");
requireTrue(runtime.includes("manager.rewrap({uid,oldPassword:newPassword,oldPin:pin,newPassword:currentPassword,newPin:pin})"),"Firebase failure rollback must restore the old password wrapper with the same PIN");
requireTrue(!runtime.includes("manager.rewrap({uid,oldPassword:currentPassword,newPassword,pin})"),"obsolete ambiguous PIN handoff must not return");
requireTrue(settings.includes('for="passwordCurrentPassword">Current password</label>')&&settings.includes('id="passwordCurrentPassword" type="password"'),"Change Password must own a clearly located current-password input");
requireTrue(settings.includes('currentPassword=card.querySelector("#passwordCurrentPassword").value'),"password mutation must read the Change Password current-password input");
requireTrue(settings.includes('card.querySelector("#passwordE2EEPin").value=""'),"successful password change must clear the transient PIN input");
requireTrue(runtime.includes("await saveLocalAccountE2EEIdentity(manager.getRuntimeIdentity())"),"password rewrap must refresh the device-local identity revision");

const auth=fs.readFileSync("auth-ui-clean.js","utf8");
const local=fs.readFileSync("local-security.js","utf8");
requireTrue(local.includes("inspectLocalAccountE2EEIdentity"),"local identity revision inspection must support bounded stale-revision repair");
requireTrue(auth.includes("local?.exists&&local.keyMatches&&!local.revisionMatches"),"login may resynchronize only an existing local identity with the same key and stale revision");
requireTrue(auth.includes("renderSessionUnlock(user,{hasIdentity:true,identity:bound.identity,password})"),"stale local revisions must return to the existing PIN-gated remote unlock owner");

console.log("Password change E2EE PIN bridge, rollback and Settings wiring passed");
