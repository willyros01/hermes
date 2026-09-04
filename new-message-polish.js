/* FIDUNIO New Message copy cleanup.
 * Presentation-only: keep existing conversation/group handlers intact while
 * removing developer/test terminology from the user-facing screen. */
function setText(el,text){if(el&&el.textContent!==text)el.textContent=text;}
function polishNewMessage(){
  const heading=[...document.querySelectorAll('.content .card h2')].find(h=>/^FIDUNIO ID\s*—/.test(h.textContent.trim()));
  if(heading){
    const card=heading.closest('.card');
    setText(heading,'Start a Conversation');
    const note=card?.querySelector('.small-note');
    if(note){
      const current=note.textContent.trim();
      if(current.includes('Firebase UID')||current.includes('real two-device messaging')){
        setText(note,current.includes('Firebase UID')?'Enter or paste the recipient\'s FIDUNIO ID.':'Sign in to FIDUNIO to start a conversation.');
      }
    }
    const input=card?.querySelector('#peerUid');
    if(input&&input.placeholder!=='Enter or paste recipient ID')input.placeholder='Enter or paste recipient ID';
    const button=card?.querySelector('#cloudDirectBtn');
    if(button&&button.textContent!=='Start Conversation')button.textContent='Start Conversation';
    const warning=card?.querySelector('.warning-note');
    if(warning)setText(warning,'Private one-to-one messages are end-to-end encrypted.');
  }
  const groupCard=[...document.querySelectorAll('.content .big-choice,.content .card')].find(el=>el.textContent?.includes('New Group'));
  if(groupCard){
    const subtitle=[...groupCard.querySelectorAll('span,p')].find(el=>el.textContent?.trim()==='Create a secure group conversation');
    if(subtitle)setText(subtitle,'Create a group and choose its members');
  }
}
let queued=false;
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;polishNewMessage();});}
const root=document.querySelector('#app')||document.body;
new MutationObserver(()=>schedule()).observe(root,{subtree:true,childList:true});
polishNewMessage();
