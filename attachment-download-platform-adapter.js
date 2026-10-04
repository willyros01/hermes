/* Transport only. Firebase owns URL lookup; the shared receive owner verifies
 * and decrypts bytes. No auth, plaintext, persistence, or UI ownership here. */
import {isNativeIOSRuntime} from "./platform-runtime.js";

export const ATTACHMENT_OBJECT_MAX_BYTES=1048576;
function failure(message,code){return Object.assign(new Error(message),{code});}
function nativeStorageUrl(value,bucket){
  const url=new URL(value);
  const prefix=`/v0/b/${encodeURIComponent(bucket)}/o/`;
  if(!bucket||url.protocol!=="https:"||url.hostname!=="firebasestorage.googleapis.com"||url.port||url.username||url.password||!url.pathname.startsWith(prefix)||url.searchParams.get("alt")!=="media")throw failure("Unexpected attachment download URL","storage/invalid-download-url");
  return url.href;
}
export async function downloadPlatformAttachmentBytes(url,{
  storageBucket,
  platformOptions,
  capacitor=globalThis.Capacitor,
  fetchImpl=globalThis.fetch,
  signal,
  timeoutMs=15000,
  maxBytes=ATTACHMENT_OBJECT_MAX_BYTES,
}={}){
  let buffer;
  if(isNativeIOSRuntime(platformOptions)){
    const safeUrl=nativeStorageUrl(url,storageBucket);
    const http=capacitor?.Plugins?.CapacitorHttp;
    if(typeof http?.request!=="function")throw failure("Native attachment download transport is unavailable","storage/native-transport-unavailable");
    // Call the built-in bridge directly; do not patch global fetch/XHR or route
    // Firebase Auth/Firestore traffic through another networking authority.
    let timer;
    try{
      const response=await Promise.race([
        http.request({url:safeUrl,method:"GET",responseType:"text",connectTimeout:timeoutMs,readTimeout:timeoutMs,disableRedirects:true,shouldEncodeUrlParams:false}),
        new Promise((_,reject)=>{timer=setTimeout(()=>reject(failure("Attachment download timed out","storage/fetch-timeout")),timeoutMs);}),
      ]);
      if(!Number.isInteger(response?.status)||response.status<200||response.status>=300)throw failure(`HTTP ${response?.status||"unknown"}`,`storage/http-${response?.status||"unknown"}`);
      // Capacitor parses application/json even when text was requested. Chunks
      // are application/octet-stream and therefore arrive as JSON text.
      const data=response.data;
      if(typeof data!=="string"&&(!data||typeof data!=="object"||Array.isArray(data)))throw failure("Invalid stored data","attachment/invalid-json");
      buffer=new TextEncoder().encode(typeof data==="string"?data:JSON.stringify(data)).buffer;
    }finally{clearTimeout(timer);}
  }else{
    const response=await fetchImpl(url,{cache:"no-store",signal});
    if(!response.ok)throw failure(`HTTP ${response.status}`,`storage/http-${response.status}`);
    buffer=await response.arrayBuffer();
  }
  if(buffer.byteLength>maxBytes)throw failure("stored object exceeds limit","storage/object-too-large");
  return buffer;
}
