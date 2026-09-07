import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const app=readFileSync(new URL("./app.js",import.meta.url),"utf8");
const css=readFileSync(new URL("./styles.css",import.meta.url),"utf8");
const mirror=readFileSync(new URL("./.github/workflows/mirror-rebuild-docs-to-main.yml",import.meta.url),"utf8");

assert.match(app,/class="tablet-account-row">\$\{mainSignOutMarkup\(\)\}/,"tablet Sign Out must have a bounded row outside the icon cluster");
assert.match(app,/class="tablet-brand-actions">[\s\S]*?id="tabletSettingsBtn"[\s\S]*?id="tabletNewBtn"[\s\S]*?<\/div>\s*<\/div>\s*<div class="tablet-account-row">\$\{mainSignOutMarkup\(\)\}/,"tablet Sign Out must be outside the Settings/New icon cluster");
assert.match(css,/\.tablet-account-row\s*\{[\s\S]*?justify-content:flex-end/,"tablet account row must own Sign Out placement");

assert.match(app,/cloudConversationSyncPending\s*=\s*true/,"direct conversation discovery must expose a pending state");
assert.match(app,/cloudGroupSyncPending\s*=\s*true/,"group discovery must expose a pending state");
assert.match(app,/Loading conversations…/,"wide empty state must distinguish synchronization from authoritative emptiness");
assert.match(app,/Conversation synchronization failed:/,"wide empty state must expose failed synchronization instead of pretending the account is empty");

assert.match(app,/toolButton\("photo","Photo"\).*toolButton\("file","File"\)/s);
assert.match(app,/toolButton\("voice","Audio"\).*toolButton\("video","Video"\)/s);
assert.doesNotMatch(css,/grid-template-columns:repeat\(8,minmax/,"the four supported tablet tools must not retain the retired eight-slot grid");
assert.match(css,/grid-template-columns:repeat\(4,minmax\(72px,1fr\)\)/,"wide tablet tool row must allocate four supported tools");

for(const selector of ["tablet-brand-name","tablet-brand-sub","tablet-nav-item"]){
  assert.match(css,new RegExp(`\\.${selector}[\\s\\S]{0,180}font-size:[^;}]*rem`),`${selector} must scale from the established root text-size owner`);
}

assert.doesNotMatch(app,/MutationObserver/);
assert.doesNotMatch(app,/orientationchange/);
assert.match(mirror,/DEVICE-ACCEPTANCE-BUGS\.md/,"device acceptance ledger must remain in the critical-document mirror");
assert.match(css,/#app\s*\{\s*flex:1 1 100%/s,"the established app owner must fill the iPad standalone viewport");
assert.match(css,/\.tablet-shell\s*\{\s*width:100%;\s*max-width:none;/s,"tablet shell must fill its owner instead of retaining a standalone 100vw gap");
assert.match(css,/\.tablet-brand-row\s*\{\s*padding-top:max\(26px,calc\(14px \+ env\(safe-area-inset-top\)\)\)/s,"tablet sidebar must clear the iPad status bar even when the reported inset is zero");
assert.match(css,/\.tablet-chat-pane \.topbar\s*\{\s*padding-top:max\(26px,calc\(10px \+ env\(safe-area-inset-top\)\)\)/s,"tablet chat header must clear the iPad status bar");

console.log("iPad RC stabilization ownership and accessibility gate passed");
