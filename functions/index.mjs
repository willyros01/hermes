import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getMessaging } from "firebase-admin/messaging";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import { createRecoveryCallableCore } from "./recovery/e2ee-recovery-callable-core.mjs";
import { createRecoveryFirestoreAdminRepositories } from "./recovery/e2ee-recovery-firestore-admin-adapter.mjs";
import { createAdminRecoveryAuthorizationCore } from "./recovery/admin-recovery-authorization-core.mjs";
import { createAdminRecoveryAuthorizationFirestoreRepository } from "./recovery/admin-recovery-authorization-firestore.mjs";
import { createMessageDeleteCallableCore } from "./message-delete/message-delete-callable-core.mjs";
import { createMessageDeleteAdminRepositories } from "./message-delete/message-delete-firestore-admin-adapter.mjs";
import { createConversationDeleteCallableCore } from "./conversation-delete/conversation-delete-callable-core.mjs";
import { createConversationDeleteAdminRepositories } from "./conversation-delete/conversation-delete-firestore-admin-adapter.mjs";
import { createDisappearingPurgeExecutor } from "./disappearing/disappearing-purge-executor.js";
import { createDisappearingPurgeFirestoreAdminRepository } from "./disappearing/disappearing-purge-firestore-admin-adapter.mjs";
import { runDisappearingPurgeSweep } from "./disappearing/disappearing-scheduler-core.mjs";
import { createDirectMessageNotificationCore } from "./notification/direct-message-notification-core.mjs";
import { createGroupMessageNotificationCore } from "./notification/group-message-notification-core.mjs";
import { createNotificationAdminRepositories } from "./notification/direct-message-notification-firestore-admin-adapter.mjs";

if (!getApps().length) initializeApp();

const RECOVERY_MASTER = defineSecret("FIDUNIO_RECOVERY_MASTER_V1");
const RECOVERY_SERVICE_ACCOUNT = "fidunio-recovery@fidunio-fef13.iam.gserviceaccount.com";
const MESSAGE_DELETE_SERVICE_ACCOUNT = "fidunio-message-delete@fidunio-fef13.iam.gserviceaccount.com";
const DISAPPEARING_PURGE_SERVICE_ACCOUNT = "fidunio-disappearing-purge@fidunio-fef13.iam.gserviceaccount.com";
const NOTIFICATION_SERVICE_ACCOUNT = "fidunio-notification@fidunio-fef13.iam.gserviceaccount.com";
const ATTACHMENT_BUCKET = "fidunio-fef13.firebasestorage.app";
const db = getFirestore();
const attachmentBucket=getStorage().bucket(ATTACHMENT_BUCKET);
const { identityRepo, sessionRepo } = createRecoveryFirestoreAdminRepositories({ db });
const {profileRepo:adminRecoveryProfileRepo,authorizationRepo:adminRecoveryAuthorizationRepo}=createAdminRecoveryAuthorizationFirestoreRepository({db});
const {messageRepo,attachmentRepo}=createMessageDeleteAdminRepositories({db,bucket:attachmentBucket});
const {conversationRepo,attachmentRepo:conversationAttachmentRepo}=createConversationDeleteAdminRepositories({db,bucket:attachmentBucket});
const disappearingPurgeRepository=createDisappearingPurgeFirestoreAdminRepository({db,bucket:attachmentBucket,requireStorage:true});
const disappearingPurgeExecutor=createDisappearingPurgeExecutor({repository:disappearingPurgeRepository,serverNow:()=>new Date()});
const {conversationRepo:notificationConversationRepo,groupRepo:notificationGroupRepo,profileRepo:notificationProfileRepo,deviceRepo:notificationDeviceRepo}=createNotificationAdminRepositories({db});
const directNotificationCore=createDirectMessageNotificationCore({conversationRepo:notificationConversationRepo,profileRepo:notificationProfileRepo,deviceRepo:notificationDeviceRepo,messaging:getMessaging()});
const groupNotificationCore=createGroupMessageNotificationCore({groupRepo:notificationGroupRepo,profileRepo:notificationProfileRepo,deviceRepo:notificationDeviceRepo,messaging:getMessaging()});

function decodeMasterSecret() {
  const raw = String(RECOVERY_MASTER.value() || "");
  if (!/^[A-Za-z0-9_-]+$/.test(raw)) throw new Error("Recovery master secret format is invalid.");
  const bytes = Buffer.from(raw, "base64url");
  if (bytes.length !== 32) throw new Error("Recovery master secret must decode to exactly 32 bytes.");
  return bytes;
}

// App Check is deliberately NOT enforced during the current staging period.
// Authentication, UID binding, the six-digit account-E2EE PIN, server-owned
// recovery session, keyId/revision binding, retry limits, IAM and Secret Manager
// remain mandatory. Production App Check enforcement is a later code/config
// change after legitimate Safari/PWA traffic has been verified.
const REQUIRE_APP_CHECK = false;

const core = createRecoveryCallableCore({
  masterSecretProvider: async () => decodeMasterSecret(),
  identityRepo,
  sessionRepo,
  requireAppCheck: REQUIRE_APP_CHECK
});
const adminRecoveryCore=createAdminRecoveryAuthorizationCore({profileRepo:adminRecoveryProfileRepo,authorizationRepo:adminRecoveryAuthorizationRepo,recoveryCore:core});
const messageDeleteCore=createMessageDeleteCallableCore({messageRepo,attachmentRepo});
const conversationDeleteCore=createConversationDeleteCallableCore({conversationRepo,attachmentRepo:conversationAttachmentRepo});

function mapError(error) {
  const code = String(error?.code || "");
  if (code === "INVALID_INPUT") return new HttpsError("invalid-argument", "Recovery request is invalid.");
  if (code === "APP_CHECK_REQUIRED") return new HttpsError("failed-precondition", "Recovery authorization failed.");
  if (code === "AUTH_REQUIRED") return new HttpsError("unauthenticated", "Sign in before deleting a message.");
  if (code === "DELETE_DENIED") return new HttpsError("permission-denied", "This deletion cannot be performed by this account.");
  if (["RECOVERY_ADMIN_DENIED","RECOVERY_AUTH_DENIED","RECOVERY_AUTH_CONFLICT","SESSION_EXPIRED","SESSION_LOCKED","SESSION_CONSUMED","SESSION_CONFLICT","SESSION_MISSING","RECOVERY_STALE","RECOVERY_DENIED","ACCOUNT_HOLD","ACCOUNT_CONFLICT","IDENTITY_MISSING"].includes(code)) return new HttpsError("permission-denied", "Recovery authorization failed.");
  console.error("FIDUNIO recovery callable failed", { code: code || "INTERNAL" });
  return new HttpsError("internal", "Recovery service is unavailable.");
}

async function invoke(handler, request) {
  try {
    return await handler({authUid: request.auth?.uid || "",appCheckValid: !!request.app,data: request.data || {}});
  } catch (error) { throw mapError(error); }
}

const common = Object.freeze({region: "us-central1",serviceAccount: RECOVERY_SERVICE_ACCOUNT,enforceAppCheck: REQUIRE_APP_CHECK,timeoutSeconds: 30,memory: "256MiB",maxInstances: 10});

export const enrollRecoveryV1 = onCall({ ...common, secrets: [RECOVERY_MASTER] },request => invoke(core.enrollRecoveryV1, request));
export const startE2EERecoveryV1 = onCall(common,request => invoke(core.startE2EERecoveryV1, request));
export const completeE2EERecoveryV1 = onCall({ ...common, secrets: [RECOVERY_MASTER] },request => invoke(core.completeE2EERecoveryV1, request));

export const createAdminRecoveryAuthorizationV1=onCall(common,request=>invoke(adminRecoveryCore.createAdminRecoveryAuthorizationV1,request));
export const listAdminRecoveryAuthorizationsV1=onCall(common,request=>invoke(adminRecoveryCore.listAdminRecoveryAuthorizationsV1,request));
export const revokeAdminRecoveryAuthorizationV1=onCall(common,request=>invoke(adminRecoveryCore.revokeAdminRecoveryAuthorizationV1,request));
export const startAdminAuthorizedRecoveryV1=onCall(common,request=>invoke(adminRecoveryCore.startAdminAuthorizedRecoveryV1,request));
export const completeAdminAuthorizedRecoveryV1=onCall({...common,secrets:[RECOVERY_MASTER]},request=>invoke(adminRecoveryCore.completeAdminAuthorizedRecoveryV1,request));

export const deleteDirectMessageForEveryoneV1 = onCall({region:"us-central1",serviceAccount:MESSAGE_DELETE_SERVICE_ACCOUNT,enforceAppCheck:REQUIRE_APP_CHECK,timeoutSeconds:30,memory:"256MiB",maxInstances:10},request=>invoke(messageDeleteCore.deleteDirectMessageForEveryoneV1,request));
export const deleteMyMessagesForEveryoneV1 = onCall({region:"us-central1",serviceAccount:MESSAGE_DELETE_SERVICE_ACCOUNT,enforceAppCheck:REQUIRE_APP_CHECK,timeoutSeconds:60,memory:"256MiB",maxInstances:10},request=>invoke(messageDeleteCore.deleteMyMessagesForEveryoneV1,request));
export const deleteConversationForEveryoneV1 = onCall({region:"us-central1",serviceAccount:MESSAGE_DELETE_SERVICE_ACCOUNT,enforceAppCheck:REQUIRE_APP_CHECK,timeoutSeconds:300,memory:"512MiB",maxInstances:5},request=>invoke(conversationDeleteCore.deleteConversationForEveryoneV1,request));

export const notifyDirectMessageCreatedV1 = onDocumentCreated({document:"conversations/{conversationId}/messages/{messageId}",region:"us-central1",serviceAccount:NOTIFICATION_SERVICE_ACCOUNT,timeoutSeconds:30,memory:"256MiB",maxInstances:20,retry:false},async event=>{const message=event.data?.data?.();if(!message)return null;return directNotificationCore.handleCreatedMessage({conversationId:event.params.conversationId,messageId:event.params.messageId,message});});
export const notifyGroupMessageCreatedV1 = onDocumentCreated({document:"groups/{groupId}/messages/{messageId}",region:"us-central1",serviceAccount:NOTIFICATION_SERVICE_ACCOUNT,timeoutSeconds:30,memory:"256MiB",maxInstances:20,retry:false},async event=>{const message=event.data?.data?.();if(!message)return null;return groupNotificationCore.handleCreatedMessage({groupId:event.params.groupId,messageId:event.params.messageId,message});});
export const purgeDisappearingMessagesV1 = onSchedule({region:"us-central1",schedule:"every 1 minutes",timeZone:"UTC",serviceAccount:DISAPPEARING_PURGE_SERVICE_ACCOUNT,timeoutSeconds:120,memory:"256MiB"},async()=>runDisappearingPurgeSweep({db,executor:disappearingPurgeExecutor,limit:200}));
