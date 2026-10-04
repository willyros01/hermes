import {getCloudLegalAcceptance,acceptCloudLegalPolicy} from "./firebase.js";
import {FIDUNIO_LEGAL_POLICY} from "./legal-policy.js";

export function readLegalAcceptance(){return getCloudLegalAcceptance();}
export function acceptLegalPolicy(){return acceptCloudLegalPolicy({termsVersion:FIDUNIO_LEGAL_POLICY.termsVersion,privacyVersion:FIDUNIO_LEGAL_POLICY.privacyVersion});}
