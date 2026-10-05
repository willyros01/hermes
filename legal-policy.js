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
  Object.freeze(["1. Who provides FIDUNIO","FIDUNIO is provided by Wilfredo Rosales, an individual developer (“we”, “us”). These terms are an agreement between you and us."]),
  Object.freeze(["2. A private messaging app","FIDUNIO is an invite-controlled private messaging app. You may use it only for lawful communications and through an account you are authorized to use."]),
  Object.freeze(["3. Provided “as is”","FIDUNIO is provided “as is” and “as available”, without any warranty or condition of any kind, express or implied, including any warranty of merchantability, fitness for a particular purpose, accuracy or non-infringement. We do not promise that it will be free of errors, will always work, will always deliver a message or notification, or will never lose data."]),
  Object.freeze(["4. Messaging and security are not guarantees","FIDUNIO uses encryption and security controls, but no online service, device, network or notification system can guarantee absolute security, uninterrupted availability, delivery or recovery. FIDUNIO is not an emergency service. Do not rely on it for emergency, medical, safety-critical, legal-deadline, financial-trading or other time-critical communications."]),
  Object.freeze(["5. Your account and your communications","Your account and service data are kept with Google Firebase as our Privacy Policy explains. You are responsible for protecting your password, six-digit FIDUNIO PIN, devices and recovery files, and for the content you send. We may suspend or remove accounts that violate these terms, abuse other users, or threaten the service."]),
  Object.freeze(["6. No liability","To the fullest extent permitted by law, we accept no liability of any kind for any loss, damage, claim, cost, expense or consequence arising from, relating to, or resulting from your use of FIDUNIO or your inability to use it. This expressly includes lost or corrupted data, failed, delayed, duplicated or misdirected messages or notifications, unauthorized access, security incidents, device loss, recovery failure, reliance on FIDUNIO, disputes between users, and any direct, indirect, incidental, special, exemplary, punitive or consequential damages, even if we were advised that such loss or damage was possible. FIDUNIO is not an emergency service and must not be relied on for emergency, medical, safety-critical, legal-deadline, financial-trading or other time-critical communications. You assume all risk from using FIDUNIO and use it entirely at your own risk."] ),
  Object.freeze(["7. Your rights under the law","Some places do not allow certain warranties or liabilities to be excluded. Where that is the case, the exclusions in these terms apply only as far as the law allows. Nothing in these terms takes away rights you have by law that cannot be given up."]),
  Object.freeze(["8. Apple","These terms are between you and us, not Apple. Apple is not responsible for FIDUNIO or its content, has no obligation to provide maintenance or support for it, and is not responsible for any claim relating to it. Apple and its subsidiaries are third-party beneficiaries of these terms and may enforce them. Apple’s Licensed Application End User License Agreement also applies to your use of FIDUNIO."]),
  Object.freeze(["9. Changes to these terms","We may change these terms in a later version. If we do, FIDUNIO will show you the new terms and ask you to accept them before you can continue."]),
  Object.freeze(["10. Governing law","These terms are governed by the laws of the Province of Ontario and the federal laws of Canada that apply there, except where the law of the place you live requires otherwise."]),
  Object.freeze(["11. Contact","Questions about FIDUNIO or these terms: willyros01@gmail.com"])
]);

