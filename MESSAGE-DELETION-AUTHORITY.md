# FIDUNIO Message Deletion Authority

## Core rule

Message deletion follows **one resource → one owner → one predefined area → one serialized write path**.

## Pending outgoing messages

Queued, Sending and Failed rows are owned by the encrypted local Outbox. `app.js` reserves cancellation against its one serialized Outbox cycle, confirms the UID-scoped encrypted row, and invokes the established physical local purge owner. This removes message, cached history and Outbox traces and prevents future retry. It never calls Firestore deletion.

## Accepted direct messages

Delete for Everyone is a physical server operation owned only by callable `deleteDirectMessageForEveryoneV1`. The callable requires Firebase Authentication, validates bounded IDs, reads the authoritative conversation/message, requires the caller to be both a conversation member and the original sender, removes deterministic attachment-object traces first, then revalidates the immutable sender before physically deleting the Firestore message.

The same callable accepts an explicit group-message discriminator. For a group message it requires current group membership and authoritative original-sender ownership, then removes receipt documents, granted-history copies, related attachment objects, and the source message. Grant counts and first-message metadata are repaired transactionally. Recipients never receive server-wide deletion authority.

Client Firestore delete remains denied. No tombstone, broad client delete authority or service-worker semantic owner is permitted.

## Delete for Me

Accepted sent or received direct/group messages may be removed only from the current installation. The physical local purge owner removes message/history traces, while encrypted local app state retains the hidden message ID for that conversation so later cloud snapshots do not restore it. This path never calls Firestore deletion and never changes another device.

## Current boundary

The 0.9.9.9k client exposes pending outgoing cancellation, local Delete for Me, and sender-owned accepted direct/group Delete for Everyone through the existing long-press action. The callable is deployed under dedicated identity `fidunio-message-delete@fidunio-fef13.iam.gserviceaccount.com`; the updated group path requires deployment and real-device acceptance.

## FIDUNIO 1.1.32 — mass sender-owned deletion

**Delete My Sent Messages** extends the same server deletion owner to one selected direct or group conversation. The client never enumerates deletion authority from its visible cache and never receives Firestore delete permission. Callable `deleteMyMessagesForEveryoneV1` verifies current membership, queries a maximum of 25 authoritative message rows whose `senderUid` equals the authenticated UID, and reuses the single-message sender/member revalidation plus attachment-before-source cleanup for every row. Group rows retain receipt and history-grant cleanup. The client serially requests additional bounded pages, physically purges only the confirmed IDs from its local message/history cache, releases attachment URLs, updates visible progress, and stops explicitly on failure.

The action does not depend on FIDUNIO system-owner or group-admin status: “My” means the authenticated original sender. It cannot delete another sender's message. Pending Queued, Sending or Failed Outbox rows are outside this operation and retain their existing individual cancellation path. Direct Chat Info and Group Info are the only predefined UI entry areas, followed by an irreversible confirmation. The existing single-message callable and client delete-deny Firestore rules remain unchanged.

Repository implementation and permanent focused gates are complete. Live deployment of `deleteMyMessagesForEveryoneV1` plus direct/group iPhone/iPad acceptance remain required before device closeout.

## FIDUNIO 1.1.33 — intermediate-snapshot convergence

The bulk callable is deployed and ACTIVE. The first direct test proved physical deletion on both devices, but one sender row remained until the listener delivered the final snapshot. Because a server page deletes rows sequentially, intermediate snapshots are valid transport observations but must not repaint IDs the callable has already confirmed deleted. One conversation-keyed memory-only projection owner suppresses only those confirmed IDs and releases them only after full server-backed absence. It owns no deletion, Firebase, persistence or timing authority; cache/partial absence cannot release it, and sign-out clears it. The single-message path is unchanged.

## Acceptance

- Pending deletion survives restart and reconnect and never retries.
- Sender-only direct deletion disappears on both devices and does not return.
- A recipient cannot delete another sender's source message.
- Associated attachment objects are removed before the source message.
- Failure remains explicit; no local success is shown unless the callable succeeds.
- A bulk operation removes only authenticated-sender rows, preserves other senders and unsent Outbox rows, displays progress, and converges after restart on direct and group devices.
