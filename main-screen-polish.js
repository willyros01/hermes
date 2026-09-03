/* FIDUNIO main-screen account control and live peer display-name overlay. */
const SDK_VERSION="12.18.0";
let signOutFn=null;
let names={};

async function getSignOut(){
  if(signOutFn)return signOutFn;
  const [appSdk,authSdk]=await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-auth.js`)
  ]);
  const auth=authSdk.getAuth(appSdk.getApp());
  signOutFn=()=>authSdk.signOut(auth);
  return signOutFn;
}
function setTextIfChanged(el,value){if(el&&el.textContent!==value)el.textContent=value;}
function applyPeerNames(){
  document.querySelectorAll(".conversation,.tablet-conversation").forEach(row=>{
    const id=String(row.dataset.id||"");
    if(!/^dm_(.+)_(.+)$/.test(id))return;
    const current=Object.entries(names).find(([uid])=>id.includes(uid));if(!current)return;
    setTextIfChanged(row.querySelector(".name"),current[1]);
  });
  const title=document.querySelector(".chat-header-title strong");
  if(title){
    const selected=document.querySelector(".tablet-conversation.active")?.dataset.id;
    const current=selected&&Object.entries(names).find(([uid])=>selected.includes(uid));
    if(current)setTextIfChanged(title,current[1]);
  }
}
function addMainSignOut(){
  const route=document.body.dataset.route;
  if(route!=="messages"&&route!=="chat")return;
  if(document.querySelector("#fidunioMainSignOutBtn"))return;
  const header=document.querySelector(".tablet-brand-actions")||document.querySelector(".topbar");if(!header)return;
  const btn=document.createElement("button");btn.id="fidunioMainSignOutBtn";btn.className="secondary";btn.type="button";btn.textContent="Sign Out";btn.setAttribute("aria-label","Sign Out");
  btn.style.width="auto";btn.style.margin="0 6px";btn.style.padding="8px 12px";
  btn.onclick=async()=>{btn.disabled=true;btn.textContent="Signing Out…";try{const fn=await getSignOut();await fn();location.reload();}catch(err){btn.disabled=false;btn.textContent="Sign Out";alert(err?.message||String(err));}};
  header.appendChild(btn);
}
function polish(){addMainSignOut();applyPeerNames();}
globalThis.addEventListener("fidunio-profile-names",e=>{names=e.detail?.names||{};polish();});
let scheduled=false;
const observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;polish();});});
observer.observe(document.documentElement,{subtree:true,childList:true});
polish();
