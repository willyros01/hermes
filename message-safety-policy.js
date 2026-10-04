/*
 * FIDUNIO local message safety policy.
 *
 * Shared web/iOS owner. This runs before encryption and never sends message
 * plaintext to Firebase or a moderation service. The first policy version is
 * intentionally narrow: it blocks only high-confidence abusive/threatening
 * phrases and known child-sexual-abuse terminology to reduce false positives.
 */
const RULES=Object.freeze([
  {code:"targeted-violent-threat",re:/\b(?:i\s*(?:am|'m)?\s*going\s+to|i\s+will|i['’]?ll)\s+(?:kill|murder|rape|hurt)\s+(?:you|u)\b/i},
  {code:"targeted-self-harm-abuse",re:/\b(?:kill|hurt)\s+(?:yourself|urself)\b/i},
  {code:"child-sexual-abuse-material",re:/\b(?:csam|child\s+(?:porn(?:ography)?|sexual\s+abuse\s+material))\b/i},
  {code:"sexual-extortion",re:/\b(?:send|give)\s+(?:me\s+)?(?:nudes?|naked\s+(?:photo|picture)s?)\s+or\s+(?:else|i['’]?ll)\b/i},
]);

function normalize(value){
  return String(value??"").normalize("NFKC").replace(/[\u200B-\u200D\uFEFF]/g,"").replace(/\s+/g," ").trim();
}

export function evaluateMessageSafety(text){
  const value=normalize(text);
  if(!value)return Object.freeze({allowed:true,code:null,policyVersion:1});
  for(const rule of RULES)if(rule.re.test(value))return Object.freeze({allowed:false,code:rule.code,policyVersion:1});
  return Object.freeze({allowed:true,code:null,policyVersion:1});
}

export function assertMessageSafety(text){
  const result=evaluateMessageSafety(text);
  if(!result.allowed){
    const error=new Error("This message was stopped by FIDUNIO's on-device safety filter because it appears to contain prohibited abusive content.");
    error.code="MESSAGE_SAFETY_BLOCKED";
    error.safetyCode=result.code;
    throw error;
  }
  return result;
}

export const MESSAGE_SAFETY_POLICY=Object.freeze({
  owner:"shared-pre-encryption-message-policy",
  policyVersion:1,
  plaintextLeavesDevice:false,
  userDisableAllowed:false,
});
