import assert from "node:assert/strict";
import fs from "node:fs";
import {awaitBoundedGroupMemberDirectory,cloudGroupIdsMissingFromAuthoritativeSnapshot} from "./group-membership-lifecycle.js";

function ok(name,condition){assert.equal(Boolean(condition),true,name);console.log(`PASS ${name}`);}

const conversations=[
  {id:"direct-1",cloud:true,type:"direct"},
  {id:"group-kept",cloudGroup:true,type:"group"},
  {id:"group-left",cloudGroup:true,type:"group"}
];
assert.deepEqual(
  cloudGroupIdsMissingFromAuthoritativeSnapshot(conversations,[{id:"group-kept"}],{fromCache:false}),
  ["group-left"],
  "a server-backed group snapshot removes only absent cloud groups"
);
assert.deepEqual(
  cloudGroupIdsMissingFromAuthoritativeSnapshot(conversations,[{id:"group-kept"}],{fromCache:true}),
  [],
  "cache-only absence cannot remove a group projection"
);
assert.deepEqual(
  cloudGroupIdsMissingFromAuthoritativeSnapshot(conversations,[{id:"group-kept"}],{fromCache:false,hasPendingWrites:true}),
  [],
  "pending local writes cannot authorize group-list removal"
);

const rows=await awaitBoundedGroupMemberDirectory(Promise.resolve([{uid:"user-2"}]),{timeoutMs:50});
assert.deepEqual(rows,[{uid:"user-2"}],"member directory returns a completed read");
await assert.rejects(
  awaitBoundedGroupMemberDirectory(new Promise(()=>{}),{timeoutMs:1}),
  error=>error?.code==="group-member-directory-timeout"&&/try again/i.test(error.message),
  "member directory wait is bounded with a retryable error"
);

const app=fs.readFileSync("app.js","utf8"),firebase=fs.readFileSync("firebase.js","utf8"),worker=fs.readFileSync("service-worker.js","utf8");
ok("confirmed leave removes the local group projection",/await leaveGroupForApp\(c\.id\);removeCloudGroupProjection\(c\.id\)/.test(app));
ok("group projection removal releases staged messages and attachment URLs",/optimisticOutgoingProjection\.release\(id,message\.id\)/.test(app)&&/releaseAttachmentResult\(runtime\.result\)/.test(app));
ok("server-backed group snapshots reconcile absence",/cloudGroupIdsMissingFromAuthoritativeSnapshot\(state\.conversations,rows,meta\)/.test(app));
ok("group snapshot member reads discard stale async completions",/revision===snapshotRevision\)onRows\(rows,\{fromCache,hasPendingWrites\}\)/.test(firebase));
ok("member projection is filtered by authoritative parent membership",/memberSnap\.docs\.filter\(m=>currentMembers\.has\(m\.id\)\)/.test(firebase));
ok("incomplete authority shell cannot erase subscribed members",/remoteMembers\?\.length\?remoteMembers:Array\.isArray\(existing\?\.members\)\?existing\.members/.test(app));
ok("Add Member has bounded loading and explicit retry",/awaitBoundedGroupMemberDirectory\(listCloudUsers\(\)\)/.test(app)&&/id="modalRetry">Try Again/.test(app));
ok("group lifecycle helper is cached for installed PWAs",worker.includes('"./group-membership-lifecycle.js"'));

console.log("Group membership lifecycle tests pass");
