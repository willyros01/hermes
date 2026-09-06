from pathlib import Path
import json

def rep(path, old, new):
 p=Path(path); s=p.read_text()
 if old not in s: raise SystemExit(f'anchor missing in {path}: {old[:80]}')
 p.write_text(s.replace(old,new,1))

rep('app.js','renameGroupForApp,addGroupMemberForApp,removeGroupMemberForApp,leaveGroupForApp }','renameGroupForApp,addGroupMemberForApp,removeGroupMemberForApp,leaveGroupForApp,grantGroupHistoryForApp }')
rep('app.js','${m.historyAccess==="from_join"?\'<span class="history-lock">Earlier history hidden</span>\':m.historyAccess==="all"?\'<span class="history-lock">Earlier history available</span>\':""}','${m.historyAccess==="from_join"?\'<span class="history-lock">Earlier history hidden</span>\':m.historyAccess==="all"?\'<span class="history-lock">Earlier history available</span>\':""}${isAdmin&&m.id!==myUid?`<button class="row-action historyGrantBtn" data-id="${m.id}">Grant earlier history</button>`:""}')
rep('app.js','  const add=document.querySelector("#addMemberBtn");if(add)add.onclick=()=>openAddMemberModal();','  const add=document.querySelector("#addMemberBtn");if(add)add.onclick=()=>openAddMemberModal();\n  document.querySelectorAll(".historyGrantBtn").forEach(btn=>btn.onclick=()=>{const member=c.members.find(m=>String(m.id)===String(btn.dataset.id));if(!member)return;state.modal={type:"history",memberId:member.id,historyChoice:"beginning",historyDate:""};render();});')
old='''        <div class="permission-box">
          ${[
            ["24h","Last 24 hours"],
            ["7d","Last 7 days"],
            ["date","From selected date"],
            ["all","Entire available history"]
          ].map(([v,label])=>`
            <label class="radio-row">
              <input type="radio" name="history" value="${v}" ${modal.historyChoice===v?"checked":""}>
              <span><strong>${label}</strong>${v==="all"?'<div class="small-note">Shares all historical material available to the group.</div>':""}</span>
            </label>`).join("")}
        </div>'''
new='''        <div class="permission-box">
          <label class="radio-row"><input type="radio" name="history" value="beginning" ${modal.historyChoice==="beginning"?"checked":""}><span><strong>From beginning</strong><div class="small-note">Share all retained earlier history that is still available.</div></span></label>
          <label class="radio-row"><input type="radio" name="history" value="date" ${modal.historyChoice==="date"?"checked":""}><span><strong>From selected date</strong><div class="small-note">Only retained messages on or after this date are eligible.</div></span></label>
          <label class="form-label" for="historyDate">Selected date</label><input class="text-input" id="historyDate" type="date" value="${esc(modal.historyDate||"")}" ${modal.historyChoice==="date"?"":"disabled"}>
        </div>'''
rep('app.js',old,new)
old='''    host.querySelectorAll('input[name="history"]').forEach(r=>r.onchange=()=>state.modal.historyChoice=r.value);
    host.querySelector("#modalCancel").onclick=()=>{state.modal=null;host.remove();render()};
    host.querySelector("#modalConfirm").onclick=()=>{
      const granted=state.modal.historyChoice;
      member.historyAccess=granted==="all"?"all":granted;
      state.modal=null;
      host.remove();
      render();
    };'''
new='''    host.querySelectorAll('input[name="history"]').forEach(r=>r.onchange=()=>{state.modal.historyChoice=r.value;const d=host.querySelector("#historyDate");if(d)d.disabled=r.value!=="date";});
    const historyDate=host.querySelector("#historyDate");if(historyDate)historyDate.onchange=()=>state.modal.historyDate=historyDate.value;
    host.querySelector("#modalCancel").onclick=()=>{state.modal=null;host.remove();render()};
    host.querySelector("#modalConfirm").onclick=async()=>{
      const modalNow=state.modal;if(!modalNow||modalNow.type!=="history")return;
      let boundary;if(modalNow.historyChoice==="beginning")boundary={kind:"beginning"};else{if(!modalNow.historyDate)return alert("Choose the first date to share.");const at=new Date(`${modalNow.historyDate}T00:00:00`);if(Number.isNaN(at.getTime()))return alert("Choose a valid date.");boundary={kind:"timestamp",at};}
      const confirmBtn=host.querySelector("#modalConfirm");confirmBtn.disabled=true;
      try{const result=await grantGroupHistoryForApp(c.id,member.id,boundary);state.modal=null;host.remove();alert(`Earlier history granted (${result.totalCopies} message${result.totalCopies===1?"":"s"}).`);render();}
      catch(err){firebaseError=err?.message||String(err);confirmBtn.disabled=false;alert(firebaseError);}
    };'''
rep('app.js',old,new)
old='''      if(!meta.fromCache){
        const rawStateById=new Map(rows.map(r=>[r.id,r.state||"sent"]));
        let receiptChanged=false;
        for(const local of existing){if(!local?.mine)continue;const next=rawStateById.get(local.id);if(next&&next!==local.state){local.state=next;receiptChanged=true;}}
        if(receiptChanged&&state.route==="chat"&&String(state.selectedId)===String(conversationId))render();
        if(state.route==="chat"&&String(state.selectedId)===String(conversationId)){
          const unreadRows=rows.filter(r=>r.senderUid!==firebaseUser.uid&&(r.state||"sent")!=="read");
          if(unreadRows.length)await Promise.allSettled(unreadRows.map(r=>updateCloudMessageState(conversationId,r.id,"read")));
        }
      }
'''
rep('app.js',old,'')
Path('disappearing-text-e2e-closeout.test.mjs').write_text('''import assert from "node:assert/strict";\nimport {normalizeDisappearSelection} from "./disappearing-content-policy.js";import {planLocalDisappearingConvergence} from "./disappearing-local-convergence.js";import {planPhysicalLocalMessagePurge} from "./disappearing-local-storage-plan.js";import {planAuthoritativeMessageProjection} from "./disappearing-authoritative-projection.js";import {planReconnectOutboxConvergence} from "./disappearing-reconnect-recovery.js";\nassert.equal(normalizeDisappearSelection(300),300);const local=[{id:"gone",disappearAfterSeconds:300,serverBacked:true,mine:true,state:"sent"},{id:"keep",disappearAfterSeconds:null,serverBacked:true}];const c=planLocalDisappearingConvergence({localMessages:local,authoritativeRemoteIds:["keep"],outboxMessageIds:["gone"]});assert.deepEqual([...c.purgeMessageIds],["gone"]);assert.deepEqual([...c.purgeOutboxMessageIds],["gone"]);const p=planPhysicalLocalMessagePurge({messagesByConversation:{x:local},historyRecords:[{conversationId:"x",messages:local}],outboxRecords:[{id:"gone",payload:{messageId:"gone"}}],purgeMessageIds:["gone"]});assert.equal(p.messagesByConversation.x.some(x=>x.id==="gone"),false);assert.deepEqual([...p.outboxDeleteIds],["gone"]);const a=planAuthoritativeMessageProjection({existingRows:local,remoteRows:[{id:"keep"}],snapshotMeta:{fromCache:false},outboxMessageIds:["gone"]});assert.deepEqual([...a.purgeMessageIds],["gone"]);const cache=planAuthoritativeMessageProjection({existingRows:local,remoteRows:[],snapshotMeta:{fromCache:true},outboxMessageIds:["gone"]});assert.equal(cache.purgeMessageIds.length,0);const replay=planReconnectOutboxConvergence({outboxRows:[{id:"gone",payload:{messageId:"gone",disappearAfterSeconds:300,serverBacked:true,sendAttempted:true}}],serverMessageIds:[]});assert.equal(replay.replayRows.length,0);console.log("Disappearing text end-to-end closeout matrix passed");\n''')
Path('group-history-admin-ui.test.mjs').write_text('''import fs from "node:fs";import assert from "node:assert/strict";const s=fs.readFileSync("app.js","utf8");assert.match(s,/grantGroupHistoryForApp/);assert.match(s,/historyGrantBtn/);assert.match(s,/kind:\\"beginning\\"/);assert.match(s,/kind:\\"timestamp\\",at/);assert.match(s,/type=\\"date\\"/);assert.doesNotMatch(s,/member\\.historyAccess=granted/);console.log("Group earlier-history admin UI wiring passed");\n''')
Path('receipt-lifecycle-stabilization.test.mjs').write_text('''import fs from "node:fs";import assert from "node:assert/strict";const app=fs.readFileSync("app.js","utf8"),group=fs.readFileSync("e2ee-account-group-conversation.js","utf8");const directWrites=(app.match(/updateCloudMessageState\\(conversationId,m\\.id,\\"read\\"\\)/g)||[]).length;assert.equal(directWrites,1,"direct subscription must have one deterministic read-write path");assert.match(app,/visibilitychange/);assert.match(app,/pageshow/);assert.match(app,/ensureActiveCloudMessageSubscription\\(true\\)/);assert.match(group,/subscribeCloudGroupReceipts/);assert.match(group,/delivery=delivery\\.then\\(emit,emit\\)/);assert.match(group,/isOpen\\(\\)\\?\\"read\\":\\"delivered\\"/);console.log("Receipt and lifecycle stabilization anchors passed");\n''')
pkg=json.loads(Path('package.json').read_text());pkg['scripts']['test:disappearing-text-closeout']='node disappearing-text-e2e-closeout.test.mjs';pkg['scripts']['test:group-history-admin-ui']='node group-history-admin-ui.test.mjs';pkg['scripts']['test:receipt-lifecycle-stabilization']='node receipt-lifecycle-stabilization.test.mjs';Path('package.json').write_text(json.dumps(pkg,separators=(',',':'))+'\n')
Path('version.js').write_text('globalThis.FIDUNIO_RELEASE = Object.freeze({ version: "0.9.6.30" });\n')
