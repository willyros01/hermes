# Hermes UX Prototype 0.2

Prototype 0.2 is the first version intended for the initial GitHub upload.

## Added in 0.2
- New Message screen
- New Group flow
- Select group members
- Name and create a group
- Group conversation UX
- Sender names on incoming group messages
- Group Info screen
- Member list and owner/admin role display
- Add-member simulation
- Group history-access controls
- New-member privacy rule: a new member sees messages only from the time they join
- Admin may explicitly grant prior-history access
- Group security/history notes in the interface

## Carried forward from 0.1
- Simulated unlock screen
- Conversation list and search
- Individual chat screen
- Quick Compose chips
- Expandable tool tray
- Message state simulation
- Offline queue behavior using browser online/offline events
- Settings and large-text mode

## Important prototype limitations
This is still a UX prototype. It does NOT yet include:
- Firebase
- Real authentication
- Real WebAuthn/passkeys
- Real end-to-end encryption
- Real group key rotation/distribution
- Real push notifications
- Real attachments
- Persistent IndexedDB storage
- Production-grade offline service-worker queueing

The group-history permission screen demonstrates the intended policy only. Production enforcement must be cryptographic and server-rule aware; it must not rely on hiding old messages in the interface.

## Group history policy
Default:
- A new group member can access conversation content only from the time they join.
- Earlier history is not automatically exposed.

Admin override:
- An admin can explicitly grant selected prior-history access.
- Prototype choices shown: last 24 hours, last 7 days, from a selected date, or entire available history.

Planned production design:
- New member receives current group encryption material, not historical keys by default.
- If prior history is explicitly granted, only the authorized history/key material is securely shared.

## Run it
Serve the folder over HTTP/HTTPS rather than opening index.html directly.

Examples:
- Python: `python3 -m http.server 8080`
- VS Code: Live Server
- GitHub Pages: publish the repository and open its HTTPS URL

## Suggested UX test
1. Unlock the prototype.
2. Tap + on Messages.
3. Choose New Group.
4. Select at least 2 people.
5. Name the group and create it.
6. Open Group Info.
7. Add a member and confirm that the UI marks earlier history hidden.
8. Tap History beside a member and test the admin history-access choices.
9. Disable network connectivity, send a message, and verify it shows Queued.
10. Restore connectivity and verify the message progresses through delivery states.

Prototype 0.2 remains intentionally Firebase-free so the UX can be reviewed before backend and cryptographic implementation.

## Initial GitHub upload

Recommended repository name: `hermes`

Recommended description: `Hermes secure messaging PWA`

For the simplest GitHub Pages workflow on GitHub Free, use a **Public** repository.

When creating the repository:
1. Choose **New repository**.
2. Repository name: `hermes`
3. Description: `Hermes secure messaging PWA`
4. Visibility: **Public**
5. Do **not** pre-create a README, `.gitignore`, or license for this first upload, because this package already includes `README.md`.
6. Create the repository.
7. Use **Add file → Upload files**.
8. Upload the extracted files from this package, not the ZIP itself:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `manifest.json`
   - `README.md`
9. Commit message: `Initial Hermes UX Prototype 0.2`

### GitHub Pages
After the files are uploaded:
1. Open the repository **Settings**.
2. Open **Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Branch: `main`
5. Folder: `/ (root)`
6. Save.
7. Wait for GitHub Pages to publish the HTTPS site.

Do not commit private keys, service-account JSON, passwords, encryption keys, server credentials, or other secrets to the repository.
