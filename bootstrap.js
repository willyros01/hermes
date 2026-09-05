/* FIDUNIO deterministic bootstrap. Account/auth owners run before app.js. */
await import("./new-message-polish.js");
const {startAccountGuard}=await import("./account-guard.js");
await startAccountGuard();
const {runAuthGate}=await import("./auth-ui-clean.js");
await runAuthGate();
await import("./profile-sync.js");
await import("./main-screen-polish.js");
