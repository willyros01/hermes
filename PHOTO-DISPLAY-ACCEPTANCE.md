# FIDUNIO compact photo display acceptance

Current runtime candidate: **1.1.44**.

## Scope

This is a presentation-only change requested after 1.1.43 message-reaction acceptance. Photo attachments should occupy less space in the conversation while preserving the original encrypted attachment and tap-to-open behavior.

- Phone/narrow display: `.message-photo` maximum **55vw**, **42vh**, absolute cap **320px**.
- iPad/tablet at 700px and wider: maximum **45vw**, **42vh**, absolute cap **320px**.
- Reaction chips remain in normal document flow below the photo bubble.
- No attachment bytes, compression, encryption, Firebase Storage, Outbox, direct/group publication, receipt, notification, delete, reaction, PIN, or E2EE authority is changed.

## Device acceptance

Test on iPhone and iPad using existing direct and group conversations:

1. Send/open a landscape photo and a portrait photo.
2. Confirm each photo is visibly smaller than the pre-1.1.44 footprint.
3. Confirm tapping the photo still opens the full attachment normally.
4. Add/remove/replace a reaction on a photo message and confirm chips remain below the photo after loading settles.
5. Confirm Delete for Me and Delete for Everyone still behave exactly as before.
6. Repeat on iPad portrait and landscape.

Do not mark this presentation follow-up device accepted until the real-device checks pass.
