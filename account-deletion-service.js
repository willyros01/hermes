import {
  getFirebaseUser,
  listMyCloudGroupsForAccountDeletion,
  listMyCloudConversationsForAccountDeletion,
  deleteCloudMyMessagesForEveryone,
  markFidunioAccountDeletionCleanupComplete,
} from "./firebase.js";
import {leaveAccountGroup} from "./e2ee-account-group-service.js";

const MAX_DELETE_PAGES=2000;

async function purgeOwnMessages(conversationId,kind,onProgress){
  let pages=0,total=0;
  for(;;){
    if(++pages>MAX_DELETE_PAGES)throw new Error("Account deletion message cleanup exceeded its safety bound.");
    const result=await deleteCloudMyMessagesForEveryone(conversationId,kind);
    total+=Number(result?.deletedCount||0);
    onProgress?.({stage:"messages",conversationId,kind,total});
    if(!result?.hasMore)break;
  }
  return total;
}

export async function inspectSelfAccountDeletion(){
  const user=getFirebaseUser();if(!user?.uid)throw new Error("Sign in first.");
  const [groups,conversations]=await Promise.all([
    listMyCloudGroupsForAccountDeletion(),
    listMyCloudConversationsForAccountDeletion(),
  ]);
  const ownedGroups=groups.filter(group=>String(group.ownerUid||"")===String(user.uid));
  return Object.freeze({
    uid:user.uid,
    groups:Object.freeze(groups),
    conversations:Object.freeze(conversations),
    ownedGroups:Object.freeze(ownedGroups),
  });
}

export async function prepareSelfAccountDeletion({onProgress}={}){
  const before=await inspectSelfAccountDeletion();
  if(before.ownedGroups.length){
    const names=before.ownedGroups.map(group=>String(group.name||"Unnamed group")).slice(0,3).join(", ");
    const error=new Error(`Before deleting your account, permanently delete the group${before.ownedGroups.length===1?"":"s"} you own: ${names}${before.ownedGroups.length>3?"…":""}. FIDUNIO will not silently delete other members' group history.`);
    error.code="ACCOUNT_OWNS_GROUPS";
    error.ownedGroups=before.ownedGroups.map(group=>({id:group.id,name:group.name||"Unnamed group"}));
    throw error;
  }

  let messagesDeleted=0,groupsLeft=0;
  for(const group of before.groups){
    onProgress?.({stage:"group-messages",groupId:group.id,name:group.name||"Group"});
    messagesDeleted+=await purgeOwnMessages(group.id,"group",onProgress);
    onProgress?.({stage:"leave-group",groupId:group.id,name:group.name||"Group"});
    await leaveAccountGroup(group.id);
    groupsLeft++;
  }

  for(const conversation of before.conversations){
    onProgress?.({stage:"direct-messages",conversationId:conversation.id});
    messagesDeleted+=await purgeOwnMessages(conversation.id,"direct",onProgress);
  }

  const afterGroups=await listMyCloudGroupsForAccountDeletion();
  if(afterGroups.length)throw new Error("Account deletion preparation could not remove every group membership. No account credentials were deleted; retry while online.");
  await markFidunioAccountDeletionCleanupComplete();
  onProgress?.({stage:"complete",messagesDeleted,groupsLeft});
  return Object.freeze({prepared:true,messagesDeleted,groupsLeft,directConversations:before.conversations.length});
}

export const ACCOUNT_DELETION_PREPARATION_V1=Object.freeze({
  owner:"shared-client-e2ee-safe-account-deletion-preparation",
  deletesOwnedGroupsAutomatically:false,
  rekeysGroupsOnLeave:true,
  deletesOwnMessagesBeforeGroupLeave:true,
});
