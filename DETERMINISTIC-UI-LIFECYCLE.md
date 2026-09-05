# FIDUNIO Deterministic UI Lifecycle

**STATUS: BINDING UI ARCHITECTURE DIRECTION — SEPTEMBER 5, 2026**

**ONE WORD: DETERMINISTIC.**

Every user action and every system event must produce the expected result through a defined owner, state transition, and render path. The UI must not depend on timing, mutation races, orientation changes, cache warming, repeated observers, or one module repairing another module's DOM after the fact.

## Why this document exists

The current UI often appears visually complete, but the underlying lifecycle has accumulated too many moving parts that can collide:

- `app.js` rendering and navigation;
- feature modules;
- authentication callbacks;
- Settings lifecycle code;
- Firestore live events;
- receipt/message updates;
- service-worker-injected runtime behavior;
- responsive iPhone/iPad/two-pane transitions;
- historically, DOM repair/re-parenting and observer-driven recovery.

This creates a dangerous condition where a feature can work, another asynchronous path runs, and something apparently unrelated disappears, rebuilds, or changes ownership.

A screen that looks correct is not considered architecturally complete if multiple independent writers can still alter it.

## Core invariant

```
ONE RESOURCE -> ONE OWNER -> ONE PREDEFINED AREA -> ONE SERIALIZED WRITE PATH
```

For UI, this means:

```
authoritative application state
          |
          v
central UI lifecycle / router
          |
   +------+------+------+
   |             |      |
Messages      Settings  New Message
 owner          owner      owner
   |             |          |
owned DOM      owned DOM   owned DOM
 region         region      region
```

Each major screen/region has one structural owner. Other modules may request state changes or publish events, but they must not independently rebuild, move, delete, or repair another owner's DOM.

## Deterministic action rule

For every action or system event, the implementation must be able to answer all of these before code is written:

1. What exact event occurred?
2. What authoritative state is allowed to change?
3. Which owner changes it?
4. Through what serialized write path?
5. Which UI owner observes/projects that state?
6. What exact DOM region may that owner change?
7. What is the expected final screen state?
8. What happens if the same event fires twice?
9. What happens if another event arrives concurrently?
10. What happens on iPhone, iPad portrait, iPad landscape, Safari, PWA, refresh, reconnect, and account switch?

If the result depends on who wins a timing race, the design is not acceptable.

## State before DOM

The application state is authoritative. The DOM is a projection of that state.

Firestore, E2EE, receipts, authentication, local cache synchronization, orientation changes, and background events should update state or dispatch owned events. They should not manipulate arbitrary UI directly.

Examples:

- Firestore receives a new message -> messaging state updates -> Messages owner renders the relevant conversation/message region.
- Receipt changes from Sent to Read -> receipt/message state updates -> Messages owner updates that owned message projection.
- Authentication changes -> account/auth state updates -> central lifecycle activates the correct screen owners. Auth code does not independently reconstruct Settings or Messages DOM.
- iPad rotates -> layout state changes -> layout owner projects the existing application state into the appropriate one-pane/two-pane layout. Unrelated features do not re-parent or rediscover their DOM.

## No repair-after-the-fact architecture

The following patterns are prohibited as normal architecture:

- a module noticing another module removed its DOM and recreating it;
- broad `MutationObserver` logic used to rediscover/re-parent features;
- repeated timeout/interval "settling" to make panels appear;
- orientation change used as a rescue path;
- cache/service-worker timing required for correct screen assembly;
- one feature moving/removing another feature's nodes;
- multiple independent Firebase/auth initializers that each try to mount UI;
- modules that use `location.reload()` as synchronization;
- global DOM scans to repair screen ownership.

A repair path may exist only for explicit fault recovery and must never be the expected lifecycle.

## Structural ownership

At minimum, the rebuilt UI should define explicit owners for:

- application shell/navigation;
- authentication/sign-in/out projection;
- Messages list;
- active conversation/chat pane;
- New Message screen;
- Settings shell;
- Profile panel;
- User Administration panel;
- Invitations panel;
- Group Info / group management;
- local security/PIN presentation;
- responsive one-pane/two-pane layout.

The exact module boundaries may differ, but ownership must be unambiguous.

An owner may delegate rendering to child owners inside predefined hosts. It may not allow sibling modules to compete for the same structural region.

## Settings precedent

The 0.9.5.1 Settings repair is an important precedent.

Profile, User Administration, and Invitations had been late bolt-ons outside the authoritative Settings lifecycle. Observer-based rediscovery/re-parenting caused panels to disappear or require orientation/timing rescue. The improved direction was to give Settings an authoritative lifecycle and owned panel hosts.

That principle now applies to the whole app.

## Layout and responsive behavior

Responsive behavior must be a deterministic projection, not a second application lifecycle.

The same authoritative state should drive:

- iPhone single-pane;
- iPad portrait;
- iPad landscape/two-pane;
- browser resize/orientation changes.

A layout transition must not destroy feature state or require the feature to independently rediscover itself.

The iPad two-pane behavior is protected user-facing functionality, but its implementation must eventually obey the same one-owner deterministic lifecycle.

## Async and synchronization rule

The goal is not to become increasingly clever at synchronizing many independent writers. The goal is to eliminate unnecessary writers.

Use serialization only where shared mutable state truly exists. Prefer capability/ownership isolation so most modules cannot write each other's resources at all.

If two asynchronous paths can modify the same state or DOM region, either:

- one must become the sole owner and the other must send it an event/request; or
- the shared resource must have a single serialized mutation queue/mutex with explicit ordering.

No loose busy flags.

## Acceptance criteria for a deterministic UI

A screen/feature is not considered complete merely because it works once. It must produce the same expected result under repeated and adverse lifecycle conditions.

Required validation includes:

- cold load;
- warm load;
- refresh;
- sign out/sign in;
- account switch;
- Firestore reconnect;
- new incoming message while screen is open;
- receipt update while conversation is open;
- rapid navigation between screens;
- iPhone single-pane;
- iPad portrait;
- iPad landscape/two-pane;
- orientation change while a secondary screen is active;
- empty account/zero conversations;
- local cache rebuild;
- PWA reopen.

The expected result must be defined before testing. "It eventually appears" is not a pass condition.

## UI completion estimate note — September 5, 2026

The visual/user-facing UI is substantially built and much of it is reusable, but the underlying UI architecture should not be considered ~90% complete merely because screens look finished.

Current architectural confidence is closer to roughly 60-65% until competing lifecycle writers are consolidated. Roughly 85-90% of desired screen design/functionality may still be reusable. The task is primarily lifecycle/ownership consolidation rather than wholesale visual redesign.

Do not redesign established screens unless explicitly approved. Preserve the visual work while making the underlying execution deterministic.

## Relationship to other binding documents

This document complements:

- `CODING-GUIDELINES.md` — ownership and serialized write contract;
- `RUNTIME-CONSOLIDATION-PLAN.md` — removal of hidden dual-code/service-worker runtime;
- `ACCOUNT-E2EE-FIRESTORE-AUTHORITY.md` — account/Firestore authority;
- `RUNTIME-TRANSFORM-INVENTORY.md` — current hidden injected behavior;
- `architecture-ownership.txt` — broader resource ownership reference;
- `BUG-LIST.md` — known defects.

The target is one deterministic application: one authoritative runtime, one authoritative data model, and one predictable UI lifecycle.

## Permanent handoff statement

Future Hermes/FIDUNIO work must remember the user's explicit requirement:

> **Deterministic. All actions' results should be as expected.**

Do not solve UI instability by adding more moving parts. Reduce competing authorities until the expected result follows from the architecture itself.
