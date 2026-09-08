/* FIDUNIO deterministic bootstrap. Account/auth owners run before app.js. */
document.addEventListener("click",event=>{
  const button=event.target.closest?.("button");
  if(!button||button.disabled)return;
  queueMicrotask(()=>{
    if(!button.disabled||!button.isConnected)return;
    button.classList.add("is-busy");
    button.setAttribute("aria-busy","true");
    const watch=()=>{
      if(button.isConnected&&button.disabled){requestAnimationFrame(watch);return;}
      button.classList.remove("is-busy");
      button.removeAttribute("aria-busy");
    };
    requestAnimationFrame(watch);
  });
},true);
const {startAccountGuard}=await import("./account-guard.js");
await startAccountGuard();
const {runAuthGate}=await import("./auth-ui-clean.js");
await runAuthGate();
