export const FIDUNIO_LEGAL_POLICY=Object.freeze({
  termsVersion:"2026-10-04-v1",
  privacyVersion:"2026-10-04-v1",
  termsUrl:"https://www.cuberoot-systems.com/fidunio/terms/",
  privacyUrl:"https://www.cuberoot-systems.com/fidunio/privacy/",
  supportUrl:"https://www.cuberoot-systems.com/fidunio/support/",
});

export function legalAcceptanceIsCurrent(record){
  return !!record
    && record.termsVersion===FIDUNIO_LEGAL_POLICY.termsVersion
    && record.privacyVersion===FIDUNIO_LEGAL_POLICY.privacyVersion
    && !!record.acceptedAt;
}

export const FIDUNIO_FIRST_USE_NOTICE=Object.freeze({
  title:"Terms and Important Information",
  paragraphs:Object.freeze([
    "FIDUNIO is a private messaging service. No online service can guarantee uninterrupted availability, delivery, or absolute security.",
    "Protect your password, six-digit FIDUNIO PIN, devices, and recovery files. You are responsible for using FIDUNIO lawfully and for the content you send.",
    "FIDUNIO is not an emergency service. Do not rely on it for emergency, medical, safety-critical, or other time-critical communications.",
    "By continuing, you agree to the FIDUNIO Terms of Use and acknowledge the Privacy Policy. If you decline, messaging remains unavailable."
  ])
});
