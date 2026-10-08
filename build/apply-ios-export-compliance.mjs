// Current iOS OS-provided Web Crypto assessment: IOS-EXPORT-COMPLIANCE.md.
// Generated iOS files remain build products; run after cap add/sync.
import fs from "node:fs";
import { execFileSync } from "node:child_process";
const plist = "ios/App/App/Info.plist";
const cap = JSON.parse(fs.readFileSync("capacitor.config.json", "utf8"));
if (cap.appId !== "io.github.willyros01.fidunio") throw new Error("Unexpected app identity");
if (!fs.existsSync("IOS-EXPORT-COMPLIANCE.md")) throw new Error("Missing FIDUNIO assessment");
if (process.platform !== "darwin") throw new Error("Apply to generated Xcode project on macOS");
if (!fs.existsSync(plist)) throw new Error("Generate/sync the iOS project first");
const buddy = "/usr/libexec/PlistBuddy";
let exists = false;
try {
  execFileSync(buddy, ["-c", "Print :ITSAppUsesNonExemptEncryption", plist], {stdio:"pipe"});
  exists = true;
} catch {}
execFileSync(buddy, ["-c", exists
  ? "Set :ITSAppUsesNonExemptEncryption false"
  : "Add :ITSAppUsesNonExemptEncryption bool false", plist]);
execFileSync("/usr/bin/plutil", ["-lint", plist]);
const value = execFileSync(buddy, ["-c", "Print :ITSAppUsesNonExemptEncryption", plist], {encoding:"utf8"}).trim();
if (value !== "false") throw new Error("Export-compliance value did not persist");
console.log("PASS: FIDUNIO Info.plist declares OS-provided encryption (non-exempt=false)");
