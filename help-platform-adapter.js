/*
 * FIDUNIO HELP platform adapter (one module, same name on every device).
 *
 * prepareUrgentAlerts(): Android needs its own urgent notification channel for HELP
 *   (created once; harmless if it exists). iPhone/iPad and web: nothing to prepare.
 *   Answer on every device: true when ready.
 * currentLocation(): one location reading with a short wait; HELP never waits longer.
 *   Same answer shape on every device: {lat,lng,acc} or null.
 */
function platform(){try{return globalThis.Capacitor?.getPlatform?.()||"web";}catch{return "web";}}

export async function prepareUrgentAlerts(){
  if(platform()!=="android")return true;
  try{
    const fm=globalThis.Capacitor?.Plugins?.FirebaseMessaging;
    if(fm?.createChannel){
      await fm.createChannel({id:"fidunio-help",name:"HELP alerts",description:"Urgent HELP from your family",importance:5,visibility:1,vibration:true,lights:true});
      await fm.createChannel({id:"fidunio-help-update",name:"HELP updates",description:"Who is coming, OK now",importance:4,visibility:1});
    }
  }catch{}
  return true;
}

export function currentLocation(){
  return new Promise(resolve=>{
    try{
      if(!navigator.geolocation)return resolve(null);
      navigator.geolocation.getCurrentPosition(
        p=>resolve({lat:p.coords.latitude,lng:p.coords.longitude,acc:p.coords.accuracy}),
        ()=>resolve(null),
        {enableHighAccuracy:true,timeout:8000,maximumAge:60000});
    }catch{resolve(null);}
  });
}
