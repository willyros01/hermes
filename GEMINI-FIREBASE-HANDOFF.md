# FIDUNIO Google/Firebase Handoff via Gemini

**STATUS: PREPARED ONLY — DO NOT EXECUTE UNTIL CHATGPT EXPLICITLY RELEASES THE NEXT PROMPT**

This file is a controlled operator handoff for the user to copy/paste into Gemini while ChatGPT remains the FIDUNIO architecture/security authority. Gemini is an execution/console-navigation assistant, not an independent designer for this project.

## Operator rules

1. Execute only one numbered prompt at a time.
2. After Gemini responds, return the result/screenshot to ChatGPT before using the next prompt.
3. Gemini must not redesign Firestore schema, recovery cryptography, IAM model, App Check policy, callable names, Secret Manager format, or repository architecture.
4. No production deploy occurs unless the prompt explicitly says to deploy.
5. Never paste passwords, Firebase private keys, PINs, Recovery Unlock Keys, service-account keys, or the value of `FIDUNIO_RECOVERY_MASTER_V1` into Gemini or ChatGPT.
6. If Gemini sees a different project, unexpected billing state, unexpected region, missing permission, or a screen that does not match the prompt, it must stop and report instead of improvising.

## Prompt 1 — READ-ONLY project inventory

Use only after ChatGPT says repository-side preparation is ready for Google/Firebase inspection.

```text
You are assisting with the Google/Firebase console for a security-sensitive private messaging project named FIDUNIO.

For this step, make NO changes. Do not enable APIs, do not change billing, do not deploy anything, do not create secrets, do not alter IAM, do not change App Check, and do not modify Firestore rules.

I need a READ-ONLY inventory of the currently selected Firebase/Google Cloud project. Please help me identify and report:

1. Firebase project display name and exact Google Cloud project ID.
2. Whether the project is on Spark or Blaze billing.
3. Firestore database location/region and whether the database already exists.
4. Whether Cloud Functions is already enabled/used and which generation/regions are currently present, if any.
5. Whether Secret Manager API is enabled.
6. Whether App Check is configured for the FIDUNIO web app, and if so which provider/enforcement states are currently shown.
7. The registered Firebase Web App name and its app ID (do not reveal any private key; Firebase web config values are not needed in this report unless explicitly requested later).
8. Any existing deployed functions whose names contain recovery, e2ee, fidunio, or hermes.
9. Any existing secrets whose NAMES contain FIDUNIO or HERMES. Report names only, never secret values.
10. Any obvious warning/banner requiring project-owner action.

Do not propose architecture changes. Do not execute fixes. Give me a concise report that I can screenshot and return to my technical lead.
```

## Prompt 2 — billing/API readiness, NO DEPLOY

**LOCKED until ChatGPT reviews Prompt 1 result.** ChatGPT may modify this prompt based on the actual project inventory.

```text
Work only in the exact FIDUNIO Google Cloud/Firebase project ID that I will provide from the previously verified inventory.

Do not deploy Cloud Functions or Firestore rules. Do not create or reveal any secret value. Do not change IAM beyond what I explicitly request.

Check whether the project is ready to deploy Firebase Functions v2 using Node.js 22 and Secret Manager. Report which required Google APIs are already enabled and which are not. If an API is missing, STOP and list it rather than enabling it automatically.

Also report whether the current billing plan supports Cloud Functions v2 and Secret Manager. Make no changes.
```

## Prompt 3 — create recovery master secret safely

**LOCKED until ChatGPT approves project ID, billing/API readiness, region, and secret format.**

The repository expects the secret name:

```text
FIDUNIO_RECOVERY_MASTER_V1
```

The application expects exactly 32 random bytes represented as base64url without padding when read by the function. The secret VALUE must be generated/entered directly in Google's protected environment and must never be copied into either AI chat.

ChatGPT will provide the exact final Prompt 3 after confirming the safest current Google Console/CLI route for the verified project.

## Prompt 4 — App Check

**LOCKED until Cloud Functions scaffold and project app registration are verified.**

Repository intent:
- callable functions enforce App Check;
- `completeE2EERecoveryV1` is the sensitive endpoint intended for limited-use App Check token consumption/replay protection;
- App Check supplements Firebase Auth + recovery authorization and never replaces them.

ChatGPT will provide the exact Prompt 4 based on the project's current web-app/App Check provider state.

## Prompt 5 — IAM least privilege

**LOCKED until exact deployed function service account(s) are known.**

The intended security boundary is least privilege. Do not grant broad project Editor/Owner access merely to make deployment succeed. Only the recovery functions that require the master secret should receive the required Secret Manager access.

ChatGPT will produce the exact role/member request after project/function service-account discovery.

## Prompt 6 — first deployment rehearsal / dry checks

**LOCKED.**

Before any real deployment, ChatGPT will verify:
- repository branch/commit to deploy;
- final region;
- Functions source `functions/` and codebase `recovery`;
- callable names `enrollRecoveryV1`, `startE2EERecoveryV1`, `completeE2EERecoveryV1`;
- fail-closed supplemental verifier state;
- exact Firestore rules source and gate result;
- App Check state;
- secret binding/IAM;
- rollback plan.

No deployment prompt is pre-authorized by this document.

## Prompt 7 — production deployment

**NOT AUTHORIZED YET.**

The user must return to ChatGPT immediately before this step. ChatGPT will generate the exact command/request only after all prior checks are green.

## Security reminder

The following must never appear in screenshots or chats:
- Firebase account password;
- FIDUNIO six-digit PIN;
- plaintext account private key / PKCS#8;
- plaintext Recovery Unlock Key (RUK);
- `FIDUNIO_RECOVERY_MASTER_V1` secret value;
- derived recovery wrapping key;
- service-account private key JSON.

Secret names, project IDs, Firebase app IDs, function names, regions, and non-secret configuration status may be reported when needed for configuration verification.
