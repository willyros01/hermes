import fs from "node:fs";
import assert from "node:assert/strict";

const owner=fs.readFileSync("password-visibility.js","utf8");
const index=fs.readFileSync("index.html","utf8");
const recoveryPage=fs.readFileSync("account-recovery.html","utf8");
const auth=fs.readFileSync("auth-ui-clean.js","utf8");
const settings=fs.readFileSync("settings-lifecycle.js","utf8");
const recovery=fs.readFileSync("account-recovery.js","utf8");

const passwordIds=[
  "loginPassword","joinPassword","sessionPassword","profileCurrentPassword",
  "passwordCurrentPassword","newPassword","newPassword2","accountE2EEPassword",
  "recoveryPassword","signedInRecoveryPassword"
];
for(const id of passwordIds){
  assert.ok(owner.includes(`"${id}"`),`password visibility owner missing ${id}`);
  assert.ok(auth.includes(`id="${id}"`)||settings.includes(`id="${id}"`)||recovery.includes(`id="${id}"`),`password field ${id} not found in an established UI owner`);
}
for(const pinId of ["passwordE2EEPin","accountE2EEPin","accountE2EEPin2","recoveryPinHost","joinPinHost","sessionPinHost"]){
  assert.ok(!owner.includes(`"${pinId}"`),`PIN field ${pinId} must remain outside password visibility owner`);
}
assert.match(owner,/input\.type=checkbox\.checked\?"text":"password"/);
assert.match(owner,/text\.textContent=checkbox\.checked\?"Hide password":"Show password"/);
assert.match(index,/password-visibility\.css/);
assert.match(index,/password-visibility\.js/);
assert.match(recoveryPage,/password-visibility\.css/);
assert.match(recoveryPage,/password-visibility\.js/);
console.log("Password visibility owner is bounded to approved password fields and excludes PIN inputs");
