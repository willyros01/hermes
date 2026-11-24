/* FIDUNIO HELP alerts — its own Functions codebase ("help"), deployed alone with
 *   firebase deploy --only functions:help
 * so it can never change or remove the existing message, recovery or
 * notification functions. */
import {initializeApp,getApps} from "firebase-admin/app";
import {getFirestore,FieldValue} from "firebase-admin/firestore";
import {getMessaging} from "firebase-admin/messaging";
import {onDocumentCreated,onDocumentUpdated} from "firebase-functions/v2/firestore";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {defineSecret} from "firebase-functions/params";
import {createHelpCore} from "./help-core.mjs";
import {createHelpPush} from "./help-push.mjs";
import {createHelpFirestoreRepo} from "./help-firestore-admin.mjs";

if(!getApps().length)initializeApp();
const ADM_CLIENT_ID=defineSecret("FIDUNIO_ADM_CLIENT_ID");
const ADM_CLIENT_SECRET=defineSecret("FIDUNIO_ADM_CLIENT_SECRET");
const SERVICE_ACCOUNT="fidunio-notification@fidunio-fef13.iam.gserviceaccount.com";
const db=getFirestore();
const push=createHelpPush({messaging:getMessaging(),getAdmCredentials:()=>({clientId:ADM_CLIENT_ID.value(),clientSecret:ADM_CLIENT_SECRET.value()})});
const core=createHelpCore({repo:createHelpFirestoreRepo({db,FieldValue}),push});
const opts={region:"us-central1",serviceAccount:SERVICE_ACCOUNT,timeoutSeconds:60,memory:"256MiB",maxInstances:10,secrets:[ADM_CLIENT_ID,ADM_CLIENT_SECRET]};

export const helpAlertCreatedV1=onDocumentCreated({...opts,document:"helpAlerts/{alertId}",retry:false},
  e=>core.alertCreated({alertId:e.params.alertId,alert:e.data?.data()}));
export const helpAlertUpdatedV1=onDocumentUpdated({...opts,document:"helpAlerts/{alertId}",retry:false},
  e=>core.alertUpdated({alertId:e.params.alertId,before:e.data?.before?.data(),after:e.data?.after?.data()}));
export const helpAlertSweepV1=onSchedule({...opts,schedule:"every 1 minutes",timeZone:"UTC"},()=>core.sweep());
