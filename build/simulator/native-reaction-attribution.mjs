// R10: Real UI tap and named cross-account group reactions on disposable native app.
// Firebase Auth/Firestore are the REAL SDKs talking only to localhost demo emulators.
// This is not a physical device, APNs/ADM, nor independent peer-app-render proof.
import {initializeApp,deleteApp} from 'firebase/app';
import {getAuth,connectAuthEmulator,signInWithEmailAndPassword,signOut} from 'firebase/auth';
import {getFirestore,connectFirestoreEmulator,doc,runTransaction} from 'firebase/firestore';

export async function runNativeReactionAttribution({d,expr,present,wait,shot,readDoc,readCollection,me,test,ready,log,fixture}){
  return test('R10','Real native group emoji chip opens correct authors after a second authenticated account reacts',async()=>{
    if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8080'||process.env.FIREBASE_AUTH_EMULATOR_HOST!=='127.0.0.1:9099'||fixture?.project!=='demo-fidunio-simulator-tests')
      throw Error('R10 REFUSES any nonlocal Firebase backend');
    const bob=fixture.peers.find(x=>x.label==='Bob');
    if(!bob?.uid||!bob.email||bob.uid===me)throw Error('Independent Bob actor required');
    const group=(await readCollection('groups')).find(g=>g.name==='Native Simulator Group');
    if(!group?.memberUids?.includes(bob.uid)||!group.memberUids.includes(me))
      throw Error('R10 requires real group membership for sender and independent reactor');
    for(let n=0;n<5&&!await present('#newBtn');n++){
      if(!await present('#backBtn'))throw Error('R10 cannot return to Messages');
      await d.press('#backBtn');
    }
    await wait(()=>present('.conversation-open[data-id="'+group.id+'"]'),'native group row');
    await d.press('.conversation-open[data-id="'+group.id+'"]');
    await wait(()=>present('#messageBox'),'native group composer',40000);
    const old=new Set((await readCollection('groups/'+group.id+'/messages')).map(m=>m.id));
    await d.fill('#messageBox','NATIVE_REACTION_AUTHOR_R10_'+Date.now());
    await d.press('#sendBtn');
    let message=null;
    await wait(async()=>{
      message=(await readCollection('groups/'+group.id+'/messages')).find(m=>m.senderUid===me&&!old.has(m.id));
      if(!message)return false;
      const state=await readDoc('groups/'+group.id+'/messages/'+message.id);
      const meta=await expr('document.querySelector('+JSON.stringify('.pending-message-action[data-message-id="'+message.id+'"] .msg-meta')+')?.innerText||""');
      return state?.state==='sent'&&/(Sent|Delivered|Read)/i.test(String(meta));
    },'R10 source message authoritative Sent and painted on native app',100000);
    const mid=message.id,row='.pending-message-action[data-message-id="'+mid+'"]';
    const app=initializeApp({projectId:fixture.project,apiKey:'demo-only',authDomain:'demo-fidunio-simulator-tests.firebaseapp.com'},'fidunio-r10-'+Date.now());
    const auth=getAuth(app);
    connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});
    const db=getFirestore(app);
    connectFirestoreEmulator(db,'127.0.0.1',8080);
    const msgRef=doc(db,'groups',group.id,'messages',mid);
    const put=async emoji=>{
      await runTransaction(db,async transaction=>{
        const snapshot=await transaction.get(msgRef);
        if(!snapshot.exists())throw Error('Source message disappeared');
        const reactions={...(snapshot.data().reactions||{})};
        if(emoji)reactions[bob.uid]=emoji;
        else delete reactions[bob.uid];
        transaction.update(msgRef,{reactions});
      });
    };
    const assertNames=async(emoji,expected)=>{
      const selector=row+' .message-reaction-chip[data-reaction="'+emoji+'"]';
      await wait(()=>present(selector),'native group reaction chip '+emoji,70000);
      const target=await expr('document.querySelector('+JSON.stringify(selector)+')?.tagName');
      if(target!=='BUTTON')throw Error('Reaction chip must be an interactive button, got '+target);
      await d.press(selector);
      await wait(()=>present('#reactionDetailsTitle'),'native reaction authors dialog',40000);
      const names=await expr('Array.from(document.querySelectorAll(".reaction-authors-list li")).map(x=>x.textContent)');
      if(!Array.isArray(names)||expected.some(name=>!names.includes(name))||names.length!==expected.length)
        throw Error('Reaction authors mismatch: expected '+JSON.stringify(expected)+' got '+JSON.stringify(names));
      if(names.some(name=>name.includes(bob.uid)))throw Error('Account UID leaked into reaction modal');
      await shot('native-reaction-authors-'+expected.length+'-'+emoji);
      await d.press('#modalCancel');
      await wait(async()=>!await present('#reactionDetailsTitle'),'authors dialog closed');
    };
    try{
      const actor=await signInWithEmailAndPassword(auth,bob.email,fixture.alice.password);
      if(actor.user.uid!==bob.uid)throw Error('Second authenticated reactor UID mismatch');
      await put('🙏');
      await wait(async()=>((await readDoc('groups/'+group.id+'/messages/'+mid))?.reactions||{})[bob.uid]==='🙏','Bob authoritative reaction');
      await assertNames('🙏',['Simulator Bob']);
      // The native account is the source sender and adds the same emoji independently.
      const opened=await expr('(() => {const x=document.querySelector('+JSON.stringify(row)+');if(!x)return false;x.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true,cancelable:true}));return true})()');
      if(!opened)throw Error('Cannot open native reaction picker');
      await wait(()=>present('#pendingMessageTitle'),'native reaction picker');
      await d.press('.message-reaction-btn[data-reaction="🙏"]');
      await wait(async()=>{
        const reactions=(await readDoc('groups/'+group.id+'/messages/'+mid))?.reactions||{};
        return reactions[me]==='🙏'&&reactions[bob.uid]==='🙏';
      },'two authoritative reactions preserved',60000);
      await assertNames('🙏',['You','Simulator Bob']);
      await put('❤️');
      await wait(async()=>((await readDoc('groups/'+group.id+'/messages/'+mid))?.reactions||{})[bob.uid]==='❤️','Bob changed reaction');
      await assertNames('❤️',['Simulator Bob']);
      await put(null);
      await wait(async()=>!((await readDoc('groups/'+group.id+'/messages/'+mid))?.reactions||{})[bob.uid],'Bob removed own reaction');
      await wait(async()=>!await present(row+' .message-reaction-chip[data-reaction="❤️"]'),'Bob reaction removed from native UI',60000);
      const remaining=(await readDoc('groups/'+group.id+'/messages/'+mid))?.reactions||{};
      if(remaining[me]!=='🙏')throw Error('Bob remove damaged sender reaction');
      log('R10 PASS: exact cross-account Firestore writer Bob, native chip/button, real modal names, multi-author, change, remove, no UID exposure');
      return 'Native owner message + signed-in Bob peer transaction + real UI chip names. Multi-author, change, remove, owner reaction retained; no ID leak.';
    }finally{
      await signOut(auth).catch(()=>{});
      await deleteApp(app).catch(()=>{});
    }
  },{requires:ready});
}
