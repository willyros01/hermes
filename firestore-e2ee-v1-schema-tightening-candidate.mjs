import fs from "node:fs";

const base = fs.readFileSync("firestore.rules", "utf8");

const replacements = [
  [
    'w.keys().hasOnly(["version","ciphertext","iv","wrappedRecoveryKey","wrappingAlgorithm","recoveryAuthorityVersion","recoveryKeyIv","recoveryKeyWrappingAlgorithm","metadata"])',
    'w.keys().hasOnly(["version","ciphertext","iv","wrappedRecoveryKey","wrappingAlgorithm","recoveryAuthorityVersion","recoveryKeyIv","recoveryKeyWrappingAlgorithm"])'
  ],
  [
    '        && w.recoveryAuthorityVersion == 1\n        && (!("metadata" in w) || w.metadata is map);',
    '        && w.recoveryAuthorityVersion == 1;'
  ],
  [
    'd.publicJwk.keys().hasOnly(["kty","crv","x","y","ext","key_ops"])',
    'd.publicJwk.keys().hasOnly(["kty","crv","x","y"])'
  ]
];

let candidate = base;
for (const [from, to] of replacements) {
  if (!candidate.includes(from)) throw new Error(`Schema-tightening anchor missing: ${from}`);
  candidate = candidate.replace(from, to);
}
if (candidate === base) throw new Error("Schema-tightening candidate did not change rules.");

export default candidate;
