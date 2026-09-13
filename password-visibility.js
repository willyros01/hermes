/*
 * FIDUNIO password visibility UI owner.
 *
 * Scope: presentation only. This module never reads, stores, logs, submits, or
 * transforms password values. It only toggles the DOM input type for the exact
 * non-PIN password fields listed below. PIN inputs remain outside this owner.
 */
const PASSWORD_IDS=new Set([
  "loginPassword",
  "joinPassword",
  "sessionPassword",
  "profileCurrentPassword",
  "passwordCurrentPassword",
  "newPassword",
  "newPassword2",
  "accountE2EEPassword",
  "recoveryPassword",
  "signedInRecoveryPassword"
]);

function mountControl(input){
  if(!input||!PASSWORD_IDS.has(input.id)||input.dataset.passwordVisibilityMounted==="1")return;
  input.dataset.passwordVisibilityMounted="1";
  const label=document.createElement("label");
  label.className="fidunio-password-visibility";
  label.setAttribute("for",`${input.id}-show-password`);
  const checkbox=document.createElement("input");
  checkbox.id=`${input.id}-show-password`;
  checkbox.type="checkbox";
  checkbox.className="fidunio-password-visibility-checkbox";
  checkbox.setAttribute("aria-controls",input.id);
  const text=document.createElement("span");
  text.textContent="Show password";
  label.append(checkbox,text);
  input.insertAdjacentElement("afterend",label);
  checkbox.addEventListener("change",()=>{
    input.type=checkbox.checked?"text":"password";
    text.textContent=checkbox.checked?"Hide password":"Show password";
  });
}

function mountKnownPasswordInputs(root=document){
  for(const id of PASSWORD_IDS)mountControl(root.querySelector?.(`#${CSS.escape(id)}`));
}

mountKnownPasswordInputs();
document.addEventListener("focusin",event=>{
  const input=event.target;
  if(input instanceof HTMLInputElement&&PASSWORD_IDS.has(input.id))mountControl(input);
},true);

export {mountKnownPasswordInputs};
