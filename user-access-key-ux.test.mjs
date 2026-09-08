import fs from "node:fs";

const app=fs.readFileSync("app.js","utf8");
const settings=fs.readFileSync("settings-lifecycle.js","utf8");
const local=fs.readFileSync("local-security.js","utf8");
const quick=fs.readFileSync("quick-start.html","utf8");
const auth=fs.readFileSync("auth-ui-clean.js","utf8");
const pinInput=fs.readFileSync("pin-input.js","utf8");

function requireTrue(value,message){if(!value)throw new Error(message);}

requireTrue(local.includes('function validPin(pin){return /^\\d{6}$/.test'),"new FIDUNIO PINs must be exactly six digits");
requireTrue(local.includes('function validStoredPin(pin){return /^\\d{4,12}$/.test'),"legacy local PINs must remain unlockable during migration");
requireTrue(settings.includes('label:"Security"'),"Settings must expose one Security area");
requireTrue(!settings.includes('label:"Account Encryption"'),"Settings must not expose a separate Account Encryption area");
requireTrue(!app.includes('<h2>Device Identity</h2>'),"ordinary Settings must not expose Device Identity");
requireTrue(!app.includes('<h2>Firebase Account</h2>'),"ordinary Settings must call the user resource Account");
requireTrue(settings.includes("End-to-end encryption:"),"Security must present plain encryption status");
requireTrue(settings.includes("verifyLocalPin(pin)"),"one-PIN setup must reject a different installation PIN");
requireTrue(settings.includes("await setLocalPin(pin)"),"security setup must establish the installation verifier from the same user PIN");
requireTrue(quick.includes("one six-digit <strong>FIDUNIO PIN</strong>"),"Quick Start must describe one user PIN");
requireTrue((pinInput.match(/pin-code-slot/g)||[]).length>=1&&pinInput.includes("length:6"),"one reusable PIN owner must render six digit slots");
requireTrue(auth.includes('id="loginPinHost"')&&auth.includes("mountSixDigitPinInput"),"the login screen must use the six-slot PIN owner");
requireTrue(auth.includes("unlockAccountE2EE({uid:user.uid,password,pin})"),"sign-in must unlock message encryption with the entered password and PIN");
requireTrue(app.includes('id="localUnlockPin"')&&app.includes("mountSixDigitPinInput"),"local unlock must use the same six-slot PIN owner");

console.log("Single visible FIDUNIO PIN and hidden-key UX gate passed");
