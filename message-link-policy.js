/*
 * FIDUNIO message links (2026-11-24, FID-LINKS-20261108).
 * Turns http/https web addresses in an already-decrypted message into tappable
 * links. Everything else stays escaped text. Presentation only: nothing is
 * fetched, stored or sent. Links open outside FIDUNIO (system browser).
 */
const URL_PATTERN=/\bhttps?:\/\/[^\s<>"'`]+/gi;
const TRAILING=/[.,;:!?)\]}'"»”’]+$/;
function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
export function safeWebLink(candidate){
  try{const url=new URL(candidate);return (url.protocol==="https:"||url.protocol==="http:")&&url.hostname?url.href:"";}catch{return"";}
}
export function linkifyMessageText(text){
  const source=String(text??"");let html="",last=0;
  for(const match of source.matchAll(URL_PATTERN)){
    let raw=match[0];const start=match.index;
    const trail=raw.match(TRAILING)?.[0]||"";
    if(trail&&!(trail.startsWith(")")&&raw.includes("(")))raw=raw.slice(0,raw.length-trail.length);
    const href=safeWebLink(raw);
    html+=escapeHtml(source.slice(last,start));
    html+=href?`<a class="msg-link" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer nofollow">${escapeHtml(raw)}</a>`:escapeHtml(raw);
    last=start+raw.length;
  }
  return html+escapeHtml(source.slice(last));
}
