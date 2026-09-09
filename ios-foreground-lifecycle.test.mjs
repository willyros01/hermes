import fs from "node:fs";
import assert from "node:assert/strict";

const app=fs.readFileSync(new URL("./app.js",import.meta.url),"utf8");
const sw=fs.readFileSync(new URL("./service-worker.js",import.meta.url),"utf8");
const version=fs.readFileSync(new URL("./version.js",import.meta.url),"utf8");

const recovery=app.match(/let foregroundRecoveryTail=Promise\.resolve\(\);[\s\S]*?window\.addEventListener\("online"/u)?.[0]||"";
assert.match(recovery,/foregroundLifecycleActive=document\.visibilityState===?"visible"/u);
assert.match(recovery,/const routed=await applyPendingNotificationRoute\(\)/u);
assert.match(recovery,/ensureActiveCloudMessageSubscription\(resumeNeeded&&!routed\)/u);
assert.doesNotMatch(recovery,/\n\s*render\(\);/u,"foreground recovery must not structurally rerender the active screen");
assert.match(app,/else foregroundLifecycleActive=false;/u);
assert.match(app,/window\.addEventListener\("pagehide",\(\)=>\{foregroundLifecycleActive=false;\}\);/u);

const publish=app.match(/async function publishMyE2EEKey\(\)\{[\s\S]*?return e2eePublishPromise;\n\}/u)?.[0]||"";
assert.ok(publish,"publishMyE2EEKey block must exist");
assert.doesNotMatch(publish,/renderSettings\(\)/u,"background device publication must not invalidate Settings hydration");

const init=app.match(/async function initializeFirebaseLayer\(\)\{[\s\S]*?\n\}/u)?.[0]||"";
assert.doesNotMatch(init,/ensureActiveCloudMessageSubscription\(true\)/u,"Firebase initialization must not repeatedly force-restart the active listener");

assert.match(version,/version: "1\.1\.11"/u);
assert.match(sw,/SHELL_REVISION="1\.1\.11-ios-foreground-lifecycle"/u);
console.log("iOS foreground lifecycle stabilization gate passed");
