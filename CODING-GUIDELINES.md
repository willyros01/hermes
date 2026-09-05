# FIDUNIO / Hermes Mandatory Coding Guidelines

**STATUS: MANDATORY — READ BEFORE WRITING, EDITING, MOVING, OR DELETING ANY APPLICATION CODE**

These rules are part of the project architecture. They are not optional style preferences. Every future code change must be checked against this document before implementation.

## 1. Core rule

**ONE RESOURCE → ONE OWNER → ONE PREDEFINED AREA → ONE SERIALIZED WRITE PATH**

A resource may be DOM structure, application state, IndexedDB data, Firebase/auth lifecycle, E2EE identity, Outbox, message state, account-local data, local-security configuration, or another mutable shared object.

Before code is written, identify:

1. Who owns the resource?
2. What exact area/key/object is owned?
3. What event or lifecycle step is allowed to change it?
4. What serialized write path protects it?
5. Which existing modules already depend on it?

If these answers are not clear, do not write the change yet. Investigate first.

## 2. No bolt-on architecture

Do not solve a feature by attaching code wherever it happens to work.

Forbidden patterns include:

- Appending feature UI to a shared parent without a designated host.
- Re-parenting another module's DOM after render.
- Using a broad MutationObserver to rediscover and repair UI after another renderer overwrites it.
- Depending on orientation changes, redraws, timing, delayed Firebase callbacks, or incidental DOM mutations to make controls appear or handlers become active.
- Creating a second lifecycle for a resource that already has an owner.
- Adding independent Firebase/auth initialization inside feature modules when a central service already exists.
- Writing to the same IndexedDB record/key from multiple modules without one serialized owner.
- Fire-and-forget writes to shared mutable state.
- Using global busy flags as a substitute for a real mutex/queue.
- Adding global functions or global mutable state merely because they are convenient.

## 3. DOM ownership

Every major screen has one structural renderer/controller.

The structural owner creates all permanent child hosts. Feature modules receive only their own host/container and may write only inside that host.

Example for Settings:

- Settings screen owner creates General, Privacy & Access, Profile, User Administration, Invitations, Data, and About hosts.
- Profile code receives only the Profile host.
- User Administration code receives only the User Administration host.
- Invitations code receives only the Invitations host.
- Child modules must not query `.content.settings`, `#app`, or `document.body` to place normal screen content.
- Child modules must not move sibling modules' content.
- Re-rendering the parent must explicitly remount/reconnect child owners through the defined lifecycle.

True application-wide overlays/modals may attach to `document.body` only through an explicitly owned modal/overlay service or other approved single owner.

## 4. Render lifecycle rule

If a parent renderer replaces DOM using `innerHTML`, every dynamic child that lives inside that parent must be part of the explicit render/mount lifecycle.

Do not rely on MutationObservers to notice that a child disappeared and recreate it afterward.

The correct sequence is:

1. Parent renders the screen and all designated hosts.
2. Parent/controller explicitly invokes each child owner with its assigned host.
3. Child owner initializes content and handlers inside that host.
4. A later parent render repeats the same deterministic mount sequence.

## 5. State ownership

Each mutable state domain must have one authoritative owner.

Examples:

- App lock state: `app.js state.unlocked` is authoritative.
- Local-security configuration: one local-security owner must serialize all changes to the same persisted config.
- Firebase/auth lifecycle: one central owner should establish account state and distribute it to dependents.
- Message/receipt state: preserve the established messaging owner and do not create alternate update paths.
- Account-local storage: one account/storage owner determines which UID is active before local account data is restored or written.

Feature modules may read state through approved APIs/events, but must not create competing authorities.

## 6. Concurrency and semaphores

Shared mutable resources must use owned serialization.

A semaphore/mutex protects a specific named resource. When acquired, no other writer may modify that resource until the owner releases it.

Rules:

- Queue work; do not silently drop requested work because `busy` is true.
- Use `try/finally` release.
- Avoid nested locks where possible.
- Define a lock order before nested access becomes necessary.
- Never use unrelated global flags such as `window.busy` to coordinate critical writes.
- Do not perform fire-and-forget writes to a shared persisted record.

Suggested resource order when needed:

`ACCOUNT → LOCAL_STORAGE → E2EE_IDENTITY → MESSAGE_STATE → UI`

## 7. Authentication/account lifecycle

Account-sensitive startup must remain ordered and explicit:

`Authentication → determine UID → activate UID-local storage → restore account state → restore Outbox/history → establish E2EE identity`

Only after those ownership decisions are complete may independent reads/subscriptions run concurrently, and only when they do not mutate the same resource.

No storage module may independently initialize Firebase/auth, reload the application, or mutate structural UI.

## 8. Firebase access

Prefer the central Firebase service layer. Feature modules should not independently import Firebase SDKs and call `getApp()`, `getAuth()`, or `getFirestore()` unless that ownership is explicitly reviewed and approved.

Multiple auth listeners must not independently make competing lifecycle decisions.

## 9. IndexedDB/local storage

For every object store/key, document one writer/owner.

Before modifying local persistence:

- Identify the exact database, object store, and key.
- Identify every current reader and writer.
- Determine whether the data is installation-wide or UID/account-scoped.
- Serialize changes to the same logical record.
- Preserve Safari/iOS IndexedDB transaction constraints already learned in this project.
- Never allow one authenticated account to inherit another account's local state.

## 10. MutationObserver policy

A new broad/global MutationObserver is prohibited unless there is no reasonable explicit lifecycle alternative and the need is documented and approved before implementation.

Existing observers are technical debt and should be removed gradually only after their hidden lifecycle function is understood and replaced explicitly.

Never remove an observer merely because it looks ugly; first determine what other feature is silently depending on it.

## 11. Change discipline

Before every implementation:

1. Read this document.
2. Identify the protected validated baseline.
3. Map ownership of every resource the change will touch.
4. Inspect current lifecycle and dependencies.
5. State which files/resources will change and which protected areas will not change.
6. Make the smallest coherent architectural change.
7. Give the test build a distinct visible version.
8. Test the changed feature first.
9. Re-test protected neighboring behavior.
10. If the build fails, do not patch randomly. Diagnose the ownership/lifecycle failure and roll back when appropriate.

## 12. No unrelated cleanup during a feature fix

Do not refactor unrelated working systems while fixing one issue.

Validated messaging, E2EE, receipts, Outbox, responsive layouts, accessibility behavior, PIN/local unlock, or other protected behavior must remain untouched unless the current task specifically requires them.

Architectural cleanup is performed one owned resource at a time.

## 13. Settings lesson — mandatory precedent

Profile, User Administration, and Invitations were late additions outside the authoritative `app.js` Settings render lifecycle. They survived because broad MutationObservers recreated/rearranged them after `renderSettings()` rebuilt the DOM.

This is the precedent for why these rules exist.

Future Settings repair must preserve the authoritative screen renderer while explicitly recreating permanent hosts and remounting the three account-dependent feature owners after every Settings render. No observer-based rediscovery or cross-module re-parenting.

## 14. Protected project rules still apply

- Hermes is the internal project/repository/release name; FIDUNIO is the public product name.
- Keep repository/release files flat unless explicitly approved otherwise.
- Keep exactly one cumulative `hermes-memory.txt` and one reusable `hermes-setup.txt`.
- Never regenerate, overwrite, or package `firebase-config.js` or `config-firestore.js`.
- `version.js` is the authoritative visible version source.
- Preserve established iPhone/iPad responsive behavior and accessibility requirements.
- Preserve validated 0.9.4.11 behavior unless a deliberate tested change supersedes it.

## 15. Mandatory pre-code declaration

Before writing application code in this project, the developer/assistant must internally verify:

**"I have read CODING-GUIDELINES.md. I know the owner, scope, lifecycle trigger, and serialized write path for every mutable resource this change touches."**

If that statement cannot be made truthfully, implementation must stop and investigation must continue.
