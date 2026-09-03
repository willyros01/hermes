/* FIDUNIO authentication-to-local-unlock bridge.
 * A successful account Sign In or invitation account creation is already an
 * authentication event, so do not immediately ask for PIN/biometric again.
 * This is one-shot: later local re-locks still require the normal unlock flow.
 */
let authJustSubmitted=false;
let queued=false;

document.addEventListener("click",event=>{
  const button=event.target?.closest?.("#loginBtn,#redeemBtn");
  if(button)authJustSubmitted=true;
},true);

function bypassImmediateLocalLock(){
  if(!authJustSubmitted)return;
  const unlock=document.querySelector("#unlockBtn");
  if(!unlock)return;
  authJustSubmitted=false;
  unlock.click();
}
function schedule(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{
    queued=false;
    bypassImmediateLocalLock();
  });
}
const observer=new MutationObserver(schedule);
observer.observe(document.documentElement,{subtree:true,childList:true});
bypassImmediateLocalLock();
