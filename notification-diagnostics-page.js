import {readNotificationDiagnostics,clearNotificationDiagnostics,recordNotificationDiagnostic} from "./notification-diagnostics.js";
const report=document.querySelector("#diagnosticReport"),status=document.querySelector("#diagnosticStatus");
async function refresh(){const rows=await readNotificationDiagnostics();const payload={reportVersion:1,fidunioVersion:globalThis.FIDUNIO_RELEASE?.version||"unknown",generatedAt:new Date().toISOString(),entryCount:rows.length,entries:rows};report.value=JSON.stringify(payload,null,2);status.textContent=`${rows.length} diagnostic events recorded.`;}
document.querySelector("#refreshDiagnostics").onclick=refresh;
document.querySelector("#copyDiagnostics").onclick=async()=>{await refresh();await navigator.clipboard.writeText(report.value);status.textContent="Full diagnostic report copied.";};
document.querySelector("#clearDiagnostics").onclick=async()=>{await clearNotificationDiagnostics();await recordNotificationDiagnostic("diagnostic-page","test-cleared",{});await refresh();};
await recordNotificationDiagnostic("diagnostic-page","opened",{controller:navigator.serviceWorker?.controller?.scriptURL||null});await refresh();
