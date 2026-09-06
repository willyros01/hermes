import {
  readCloudGroupAuthority,
  getCloudAccountE2EEPublicKey,
  createCloudGroupEpochRecord,
  readCloudGroupEpochRecord,
  sendCloudEncryptedGroupMessage,
  subscribeCloudGroupMessages,
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
// This one-shot adapter waits for a server-backed snapshot from the existing
// central Firebase subscription owner and then immediately closes it.
function readRetainedGroupMessages(groupId){
  return new Promise((resolve,reject)=>{
    let unsubscribe=null,pendingStop=false,settled=false;
    const finish=(fn,value)=>{
      if(settled)return;
      settled=true;
      if(unsubscribe)try{unsubscribe();}catch{}
      else pendingStop=true;
      fn(value);
    };
    unsubscribe=subscribeCloudGroupMessages(groupId,(rows,meta={})=>{
      if(meta.fromCache)return;
      finish(resolve,Array.isArray(rows)?rows:[]);
    },err=>finish(reject,err));
    if(pendingStop&&unsubscribe)try{unsubscribe();}catch{}
  });
}

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