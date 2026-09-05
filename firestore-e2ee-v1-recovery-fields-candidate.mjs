import fs from "node:fs";

const base = fs.readFileSync("firestore.rules", "utf8");
const oldRequired = 'w.keys().hasAll(["version","ciphertext","iv","wrappedRecoveryKey","wrappingAlgorithm","recoveryAuthorityVersion"])';
const newRequired = 'w.keys().hasAll(["version","ciphertext","iv","wrappedRecoveryKey","wrappingAlgorithm","recoveryAuthorityVersion","recoveryKeyIv","recoveryKeyWrappingAlgorithm"])';
const oldOnly = 'w.keys().hasOnly(["version","ciphertext","iv","wrappedRecoveryKey","wrappingAlgorithm","recoveryAuthorityVersion","metadata"])';
const newOnly = 'w.keys().hasOnly(["version","ciphertext","iv","wrappedRecoveryKey","wrappingAlgorithm","recoveryAuthorityVersion","recoveryKeyIv","recoveryKeyWrappingAlgorithm","metadata"])';
const oldWrapped = '&& w.wrappedRecoveryKey is string && w.wrappedRecoveryKey.size() > 0 && w.wrappedRecoveryKey.size() <= 8192';
const newWrapped = `${oldWrapped}\n        && w.recoveryKeyIv is string && w.recoveryKeyIv.size() > 0 && w.recoveryKeyIv.size() <= 128\n        && w.recoveryKeyWrappingAlgorithm == "HMAC-SHA256+A256GCM"`;

let candidate = base;
if (candidate.includes(oldRequired)) candidate = candidate.replace(oldRequired, newRequired);
if (candidate.includes(oldOnly)) candidate = candidate.replace(oldOnly, newOnly);
if (candidate.includes(oldWrapped) && !candidate.includes('w.recoveryKeyIv is string')) candidate = candidate.replace(oldWrapped, newWrapped);

if (!candidate.includes('w.recoveryKeyWrappingAlgorithm == "HMAC-SHA256+A256GCM"')) {
  throw new Error("Recovery RUK protection rule candidate could not be materialized.");
}

export default candidate;
