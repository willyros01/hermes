# FIDUNIO Firestore Group E2EE v1 Rules Gate

Status: normative repository gate for `ACCOUNT-E2EE-GROUP-MESSAGE-FORMAT.md`.

The currently deployed/staged group rules intentionally deny all group message writes. This document defines the exact rule invariants required before that deny can be replaced. It does not weaken the current rules by itself.

## Group document

A group remains readable only by registered active UIDs in `memberUids`.

Creation remains `keyEpoch == 0`. No encrypted group message may exist at epoch 0.

Any membership-set change MUST be an administrator-authorized update and MUST change `keyEpoch` from `N` to exactly `N + 1`. A name-only or role-only update MUST keep `keyEpoch` unchanged. The owner cannot be removed. `historyPolicy` remains exactly `fromJoin`.

The client must create the matching epoch-key record for the incremented epoch before sending a message under that epoch. Rules must not allow a message whose epoch differs from the current group document.

## Epoch keys

Path: `/groups/{groupId}/epochs/{epochId}` where `epochId` is the decimal representation of `keyEpoch`.

Read: active group members only.

Create: group administrator only, for the current positive `group.keyEpoch`, and only once. Update/delete: denied.

Exact required fields:

- `format == "fidunio-group-key-v1"`
- `groupId == groupId`
- `keyEpoch` integer and `keyEpoch == group.keyEpoch` and `keyEpoch > 0`
- `createdByUid == request.auth.uid`
- `createdByKeyId == e2eePublicKeys[request.auth.uid].keyId`
- `memberKeyIds` map
- `envelopes` map
- `createdAt == request.time`

`memberKeyIds` and `envelopes` MUST contain exactly the current `memberUids` and no other UID. Each member keyId MUST equal that UID's durable public account keyId. Each envelope MUST contain only `senderKeyId`, `recipientKeyId`, `ciphertext`, `iv`; senderKeyId must equal `createdByKeyId`; recipientKeyId must equal the member's current durable account keyId. Ciphertext and IV are base64url strings with bounded sizes.

## Encrypted group messages

Path: `/groups/{groupId}/messages/{messageId}`.

Read: active group members only. This grants Firestore visibility to ciphertext; cryptographic history separation is enforced by epoch-key availability.

Create only when all are true:

- requester is an active group member;
- current `group.keyEpoch > 0`;
- matching immutable epoch document exists;
- `e2ee == 4`;
- `groupFormat == "fidunio-group-message-v1"`;
- `keyEpoch == group.keyEpoch`;
- `senderUid == request.auth.uid`;
- `senderKeyId == e2eePublicKeys[request.auth.uid].keyId`;
- `ciphertext` is non-empty bounded base64url;
- `iv` is a 12-byte AES-GCM IV encoded as 16 base64url characters;
- `state == "sent"`;
- `createdAt == request.time`;
- optional `timeLabel` is a bounded string;
- no plaintext `text`, device ID, device envelope map, or direct-message recipient key fields are present.

Message update/delete: denied. Group delivery/read state is not a mutable message field.

## Per-account receipts

Path: `/groups/{groupId}/messages/{messageId}/receipts/{uid}`.

Read: active group members only.

Create/update only by `request.auth.uid == uid`, only if UID is a member represented by the message epoch, and only for an existing encrypted group message. Exact fields are `uid`, `state`, `updatedAt`, where `state` is `delivered` or `read`, and `updatedAt == request.time`. State may advance `delivered -> read`; it may never regress. Delete denied.

The sender MUST NOT create or update another member's receipt. Sender UI derives aggregate Sent/Delivered/Read from recipient receipt documents.

## History grants

No history-grant write path is authorized by this gate. New members therefore receive only the new epoch produced by their membership change. Administrator sharing of older history requires a separate normative schema and rules gate before implementation.

## Fail-closed migration

The existing rule `allow create, update, delete: if false` for group messages stays in place until all of these exist together:

1. repository rules implementing this document;
2. emulator tests proving member/nonmember/admin/epoch/receipt boundaries;
3. opaque Firebase transport APIs;
4. sole-owner group E2EE runtime;
5. Outbox epoch revalidation;
6. UI integration without plaintext or legacy-device fallback.

No intermediate commit may enable plaintext group messaging.

## Group administration hardening — 2026-09-06

Membership-changing group updates now require `keyEpoch + 1` and a matching post-state epoch document in the same atomic write. Epoch `memberKeyIds` and `envelopes` must have exactly the post-change member UID keys. Admins may add/remove non-owner members. A non-owner member may leave only by removing the signed-in UID, with the same atomic epoch replacement. Owner removal/leave remains denied.

## Group history-grant rules — 0.9.6.7
- `historyGrants/{grantId}` is a separate explicit authority path; it never changes `historyPolicy: fromJoin` and never exposes old epoch keys.
- Create requires current group admin, current target membership, target != grantor, and exact authoritative account keyIds.
- The first shared message and every copy are bound to an existing retained `e2ee:4` source message and its authoritative `createdAt`.
- Timestamp boundaries reject any source copy earlier than `boundaryAt`; Beginning of conversation uses `boundaryAt:null`.
- Grants are created as `building`; targets cannot read metadata/copies until the grantor activates the grant. Activation rechecks admin and target membership.
- Other members/outsiders cannot read target grants. Current admins may inspect ciphertext metadata for administration but cannot decrypt a target envelope without that target private identity.
- Update/delete remain closed except the single `building -> active` activation transition. Purge deletion authority is intentionally deferred to the disappearing-content owner rather than opened prematurely.
- These repository rules are NOT automatically deployed to live Firebase.

## 0.9.6.7 repository validation
Cleaned-branch Rebuild Baseline Security Gate run `34047570212` passed the expanded group E2EE/history-grant rule matrix. The changed repository rules remain undeployed to live Firebase pending the controlled Firebase handoff.
