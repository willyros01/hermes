import fs from "node:fs";
let failed = 0;
const ok = (name, value) => {
  console.log(value ? "PASS" : "FAIL", name);
  if (!value) failed++;
};
const firebaseJson = JSON.parse(fs.readFileSync("firebase.json", "utf8"));
const rules = fs.readFileSync("storage.rules", "utf8");
const workflow = fs.readFileSync(".github/workflows/rebuild-baseline-security.yml", "utf8");
const config = fs.readFileSync("firebase-config.js", "utf8");
ok("firebase.json registers only the reviewed Storage rules file", firebaseJson.storage?.rules === "storage.rules");
ok("reviewed Storage rules retain authenticated membership checks", rules.includes("request.auth != null") && rules.includes("firestore.get("));
ok("reviewed Storage rules retain attachment namespace", rules.includes("match /attachments/{senderUid}/{conversationId}/{messageId}/{attachmentId}/{rest=**}"));
ok("reviewed Storage rules retain client-delete denial", rules.includes("allow delete: if false"));
ok("protected Firebase config retains the expected default bucket", /storageBucket\s*:\s*["']fidunio-fef13\.firebasestorage\.app["']/.test(config));
ok("normal baseline permanently runs this deployment-wiring gate", workflow.includes("npm run test:storage-deployment-wiring"));
console.log("\n" + (6 - failed) + "/6 Firebase Storage deployment-wiring assertions passed.");
if (failed) process.exitCode = 1;
