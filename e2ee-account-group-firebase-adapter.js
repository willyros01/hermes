import {
  readCloudGroupAuthority,
  getCloudAccountE2EEPublicKey,
  createCloudGroupEpochRecord,
  readCloudGroupEpochRecord,
  sendCloudEncryptedGroupMessage,
  readCloudRetainedGroupMessages,
  renameCloudGroup,
  commitCloudGroupMembershipEpoch,
  beginCloudGroupHistoryGrant,
  writeCloudGroupHistoryGrantCopies,
  activateCloudGroupHistoryGrant,
  readCloudGroupHistoryGrants,
  readCloudGroupHistoryGrantCopies
} from "./firebase.js";

// This adapter is intentionally thin. firebase.js remains the sole Firebase
// SDK owner; e2ee-account-group-runtime.js remains the sole group crypto
// orchestration owner. The adapter only translates their method names.
//
// History-grant source selection must never trust app.js/local projected rows.
// Retained source access is a separate administrator-only server read. It must
// never widen the ordinary join-bounded conversation subscription.
function readRetainedGroupMessages(groupId){return readCloudRetainedGroupMessages(groupId);}

export function createFirebaseAccountGroupE2EETransport(){
  return Object.freeze({
    readGroupAuthority: readCloudGroupAuthority,
    getAccountPublicKey: getCloudAccountE2EEPublicKey,
    createGroupEpochRecord: createCloudGroupEpochRecord,
    readGroupEpochRecord: readCloudGroupEpochRecord,
    sendEncryptedGroupMessage: sendCloudEncryptedGroupMessage,
    readRetainedGroupMessages,
    renameGroup: renameCloudGroup,
    commitGroupMembershipEpoch: commitCloudGroupMembershipEpoch,
    beginGroupHistoryGrant: beginCloudGroupHistoryGrant,
    writeGroupHistoryGrantCopies: writeCloudGroupHistoryGrantCopies,
    activateGroupHistoryGrant: activateCloudGroupHistoryGrant,
    readGroupHistoryGrants: readCloudGroupHistoryGrants,
    readGroupHistoryGrantCopies: readCloudGroupHistoryGrantCopies
  });
}
