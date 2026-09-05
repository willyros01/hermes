import fs from "node:fs";

const base = fs.readFileSync("firestore.rules", "utf8");
const exactRecovery = 'w.keys().hasOnly(["version","ciphertext","iv","wrappedRecoveryKey","wrappingAlgorithm","recoveryAuthorityVersion","recoveryKeyIv","recoveryKeyWrappingAlgorithm"])';
const exactPublic = 'd.publicJwk.keys().hasOnly(["kty","crv","x","y"])';

if (base.includes(exactRecovery) && base.includes(exactPublic) && !base.includes('|| w.metadata is map')) {
  // Exact schema is already materialized. Test the repository rule source verbatim.
  exportDefault(base);
} else {
  const replacements = [
    [
      'w.keys().hasOnly(["version","ciphertext","iv","wrappedRecoveryKey","wrappingAlgorithm","recoveryAuthorityVersion","recoveryKeyIv","recoveryKeyWrappingAlgorithm","metadata"])',
      exactRecovery
    ],
    [
      '        && w.recoveryAuthorityVersion == 1\n        && (!("metadata" in w) || w.metadata is map);',
      '        && w.recoveryAuthorityVersion == 1;'
    ],
    [
      'd.publicJwk.keys().hasOnly(["kty","crv","x","y","ext","key_ops"])',
      exactPublic
    ]
  ];
  let candidate = base;
  for (const [from, to] of replacements) {
    if (!candidate.includes(from)) throw new Error(`Schema-tightening anchor missing: ${from}`);
    candidate = candidate.replace(from, to);
  }
  if (candidate === base) throw new Error("Schema-tightening candidate did not change rules.");
  exportDefault(candidate);
}

function exportDefault(value) {
  globalThis.__FIDUNIO_SCHEMA_TIGHTENING_RULES__ = value;
}

const candidate = globalThis.__FIDUNIO_SCHEMA_TIGHTENING_RULES__;
export default candidate;
