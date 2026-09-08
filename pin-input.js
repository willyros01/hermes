// Reusable six-digit FIDUNIO PIN input. The caller owns the surrounding screen;
// this module owns only the six input slots inside the supplied host.
export function mountSixDigitPinInput(host,{label="FIDUNIO PIN",onComplete=()=>{}}={}){
  if(!host)throw new Error("PIN input host is required.");
  host.innerHTML=`<div class="pin-code" role="group" aria-label="${label}">${Array.from({length:6},(_,i)=>`<input class="pin-code-slot" type="password" inputmode="numeric" autocomplete="${i===0?"one-time-code":"off"}" maxlength="1" pattern="[0-9]*" aria-label="PIN digit ${i+1}">`).join("")}</div>`;
  const slots=[...host.querySelectorAll(".pin-code-slot")];
  const value=()=>slots.map(slot=>slot.value).join("");
  const distribute=(digits,start=0)=>{
    const clean=String(digits||"").replace(/\D/g,"").slice(0,6-start);
    clean.split("").forEach((digit,index)=>{slots[start+index].value=digit;});
    slots[Math.min(start+clean.length,5)]?.focus();
    if(value().length===6)onComplete(value());
  };
  slots.forEach((slot,index)=>{
    slot.addEventListener("input",()=>{const digits=slot.value.replace(/\D/g,"");slot.value="";distribute(digits,index);});
    slot.addEventListener("keydown",event=>{
      if(event.key==="Backspace"&&!slot.value&&index>0){event.preventDefault();slots[index-1].value="";slots[index-1].focus();}
      if(event.key==="ArrowLeft"&&index>0){event.preventDefault();slots[index-1].focus();}
      if(event.key==="ArrowRight"&&index<5){event.preventDefault();slots[index+1].focus();}
      if(event.key==="Enter"&&value().length===6)onComplete(value());
    });
    slot.addEventListener("paste",event=>{event.preventDefault();distribute(event.clipboardData?.getData("text")||"",index);});
  });
  return Object.freeze({value,focus:()=>slots[0]?.focus(),clear:()=>{slots.forEach(slot=>slot.value="");slots[0]?.focus();},setDisabled:disabled=>slots.forEach(slot=>slot.disabled=!!disabled)});
}
