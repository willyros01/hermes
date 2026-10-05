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


export const FIDUNIO_TERMS_SECTIONS=Object.freeze([
  Object.freeze(["1. Who provides FIDUNIO","FIDUNIO is provided by Cuberoot Systems and the FIDUNIO developer. These terms are an agreement between you and the provider."]),
  Object.freeze(["2. Permitted use","FIDUNIO is an invite-controlled private messaging service. Use it only for lawful communications and only through an account you are authorized to use."]),
  Object.freeze(["3. Prohibited conduct","Do not harass, threaten, exploit, impersonate or intentionally deceive another person; send illegal or abusive material; spam; distribute malware; attempt unauthorized access; interfere with the service; or share another person's private information without authorization."]),
  Object.freeze(["4. Your account and security","You are responsible for protecting your password, six-digit FIDUNIO PIN, devices and recovery files. Notify support if you believe your account has been compromised."]),
  Object.freeze(["5. Service limitations","FIDUNIO depends on devices, networks, Apple services, Firebase/Google Cloud and other technical components. Delivery, availability, notification timing, recovery and data preservation cannot be guaranteed in every circumstance. FIDUNIO is not an emergency service and must not be relied on for emergency, medical, safety-critical, legal-deadline, financial-trading or other time-critical communications."]),
  Object.freeze(["6. No warranty","To the maximum extent permitted by applicable law, FIDUNIO is provided on an “as is” and “as available” basis without warranties that the service will be uninterrupted, error-free, completely secure or suitable for a particular purpose."]),
  Object.freeze(["7. Limitation of liability","To the maximum extent permitted by applicable law, Cuberoot Systems and the FIDUNIO developer are not liable for indirect, incidental, special or consequential loss arising from service interruption, failed delivery, device loss, unauthorized access, data loss or reliance on FIDUNIO for time-critical communications. Nothing in these Terms excludes rights or liabilities that cannot legally be excluded."]),
  Object.freeze(["8. Privacy and account deletion","The FIDUNIO Privacy Policy explains the information used to operate the service. You may initiate permanent account deletion from Settings → Delete My Account."]),
  Object.freeze(["9. Changes","FIDUNIO may update these Terms. A material update may require you to review and accept a new version before continuing."]),
  Object.freeze(["10. Contact","Questions about FIDUNIO or these terms may be sent to willyros01@gmail.com."])
]);
