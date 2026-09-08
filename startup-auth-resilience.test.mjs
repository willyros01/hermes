import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const [index,styles,security,app]=await Promise.all([
  readFile(new URL("./index.html",import.meta.url),"utf8"),
  readFile(new URL("./styles.css",import.meta.url),"utf8"),
  readFile(new URL("./local-security.js",import.meta.url),"utf8"),
  readFile(new URL("./app.js",import.meta.url),"utf8")
]);

assert.match(index,/class="startup-shell"[^>]*role="status"[^>]*aria-live="polite"/);
assert.match(index,/Starting FIDUNIO…/);
assert.match(index,/Opening your secure local data\./);
assert.match(styles,/\.startup-spinner\{[^}]*width:64px[^}]*border:7px[^}]*animation:/s);
assert.match(styles,/\.startup-shell\{[^}]*font-size:22px/s);
assert.match(security,/Local PIN storage did not open in time\./);
assert.match(security,/req\.onblocked=/);
assert.match(security,/available:configAvailable/);
assert.match(security,/if\(!configAvailable\)throw new Error/);
assert.match(app,/if\(!security\.available\)/);
assert.match(app,/Your PIN has not been reset\./);
assert.doesNotMatch(app,/if\(!security\.available\)[\s\S]{0,800}continueBtn/,
  "unavailable PIN storage must fail closed without a Continue bypass");
assert.match(security,/document\.visibilityState==="hidden"[\s\S]{0,100}if\(isUnlocked\(\)\)onLock\("background"\)/,"switching away from FIDUNIO must lock immediately");
assert.match(security,/window\.addEventListener\("pagehide",\(\)=>[\s\S]{0,100}onLock\("background"\)/,"iOS pagehide must also lock FIDUNIO");

console.log("Startup and local PIN fail-closed resilience gate passed");
