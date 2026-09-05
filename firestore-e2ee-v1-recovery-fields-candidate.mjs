import fs from "node:fs";

const rules = fs.readFileSync("firestore.rules", "utf8");
if (!rules.includes('w.recoveryKeyWrappingAlgorithm == "HMAC-SHA256+A256GCM"')) {
  throw new Error("Current firestore.rules is missing validated recovery RUK protection fields.");
}
if (!rules.includes("BEGIN E2EE V1 STAGED HELPERS") || !rules.includes("BEGIN E2EE V1 STAGED PUBLIC MATCH")) {
  throw new Error("Current firestore.rules is missing the validated account E2EE v1 rule block.");
}

// Historical filename retained temporarily so the existing test import stays stable.
// This now exports the exact repository production-rule source with no transformation.
export default rules;
