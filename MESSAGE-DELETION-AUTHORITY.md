# FIDUNIO Message Deletion Authority

## Core rule

Message deletion follows **one resource → one owner → one predefined area → one serialized write path**.

## Pending outgoing messages

Queued, Sending and Failed rows are owned by the encrypted local Outbox. `app.js` reserves cancellation against its one serialized Outbox cycle, confirms the UID-scoped encrypted row, and invokes the established physical local purge owner. This removes message, cached history and Outbox traces and prevents future retry. It never calls Firestore deletion.

## Accepted direct messages

Delete for Everyone is a physical server operation owned only by callable `deleteDirectMessageForEveryoneV1`. The callable requires Firebase Authentication, validates bounded IDs, reads the authoritative conversation/message, requires the caller to be both a conversation member and the original sender, removes deterministic attachment-object traces first, then revalidates the immutable sender before physically deleting the Firestore message.

Client Firestore delete remains denied. No tombstone, broad client delete authority or service-worker semantic owner is permitted.

## Current boundary

The repository candidate covers pending outgoing deletion and sender-owned accepted **direct** messages. Delete for Me and accepted group-message deletion are not represented as working. The callable requires the dedicated `fidunio-message-delete@fidunio-fef13.iam.gserviceaccount.com` identity with narrowly reviewed Firestore/Storage permissions and must be deployed before the client action is released for device acceptance.

## Acceptance

- Pending deletion survives restart and reconnect and never retries.
- Sender-only direct deletion disappears on both devices and does not return.
- A recipient cannot delete another sender's source message.
- Associated attachment objects are removed before the source message.
- Failure remains explicit; no local success is shown unless the callable succeeds.
