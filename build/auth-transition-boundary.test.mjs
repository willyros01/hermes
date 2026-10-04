import assert from "node:assert/strict";
import fs from "node:fs";
const src=fs.readFileSync("auth-ui-clean.js","utf8");

assert.match(src,/let appStartPromise=null/);
assert.match(src,/const appModule=await import\("\.\/app\.js"\);[\s\S]*await appModule\.FIDUNIO_APP_READY;[\s\S]*appStarted=true/);
assert.doesNotMatch(src,/appStarted=true;[\s\S]{0,180}await import\("\.\/app\.js"\)/);\nconst app=fs.readFileSync("app.js","utf8");\nassert.match(app,/export const FIDUNIO_APP_READY=initApp\(\);/);
assert.match(src,/catch\(error\)\{appStartPromise=null;throw error;\}/);

const recovery=src.slice(src.indexOf('async function renderPasswordResetRecovery'),src.indexOf('async function enterAfterPasswordSignIn'));
assert.match(recovery,/await recoverAccountE2EE/);
assert.match(recovery,/catch\(err\)[\s\S]*return;\}[\s\S]*await openStartedAppOrOfferRetry\(user\)/);
assert.doesNotMatch(recovery,/clearPasswordResetPending\(\);markSuccessfulAuthBypass\(\);await startApp/);

const signin=src.slice(src.indexOf('function renderSignIn'),src.indexOf('async function renderJoin'));
assert.match(signin,/try\{user=await signInFidunio/);
assert.match(signin,/const continueAfterSignIn=async/);
assert.match(signin,/renderAuthenticatedTransitionFailure\(user,err,continueAfterSignIn\)/);

const join=src.slice(src.indexOf('async function renderJoin'),src.indexOf('export async function runAuthGate'));
assert.match(join,/user=await redeemInvitationForEnrollment/);
assert.match(join,/const finishEnrollment=async/);
assert.match(join,/renderAuthenticatedTransitionFailure\(user,err,finishEnrollment\)/);

assert.match(src,/Signed in successfully\./);
assert.match(src,/this is not being reported as a credential failure/);
console.log("PASS: authentication, recovery, enrollment and app startup use separate retry-safe failure boundaries");
