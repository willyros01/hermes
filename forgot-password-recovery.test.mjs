import fs from "node:fs";

const auth=fs.readFileSync("auth-ui-clean.js","utf8");
const local=fs.readFileSync("local-security.js","utf8");
const runtime=fs.readFileSync("e2ee-account-runtime.js","utf8");

function requireTrue(value,message){if(!value)throw new Error(message);}

requireTrue(auth.includes("await sendPasswordReset(email);await markPasswordResetPending(email)"),"reset email success must persist the recovery handoff");
requireTrue(local.includes('PASSWORD_RESET_PENDING_KEY="password-reset-pending-v1"'),"password-reset handoff must use one durable local owner");
requireTrue(local.includes("24*60*60*1000"),"abandoned local reset handoffs must expire");
requireTrue(auth.includes("if(await hasPasswordResetPending(user.email))"),"successful post-reset sign-in must enter recovery before application startup");
requireTrue(auth.includes("renderPasswordResetRecovery")&&auth.includes("Existing six-digit FIDUNIO PIN"),"authentication gate must own a visible PIN-gated recovery screen");
requireTrue(auth.includes("await recoverAccountE2EE({uid:user.uid,newPassword:password,pin})"),"recovery must use the authenticated UID, new Firebase password and existing PIN");
requireTrue(runtime.includes("await manager.recover")&&runtime.includes("await saveLocalAccountE2EEIdentity(manager.getRuntimeIdentity())"),"successful recovery must persist the same runtime identity and current revision");
requireTrue(auth.includes("await clearPasswordResetPending();markSuccessfulAuthBypass();await startApp()"),"the handoff may be consumed and the app opened only after recovery succeeds");
requireTrue(auth.includes('if(bound.hasIdentity){await renderPasswordResetRecovery(user,password,{reason:"missing-local"})'),"an authenticated account with no local identity must be offered cryptographic recovery instead of being stranded");

console.log("Forgot Password Firebase-to-E2EE recovery handoff passed");
