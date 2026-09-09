from pathlib import Path

p=Path('app.js')
s=p.read_text()
old='''          const type=recorder.mimeType||mime||"audio/mp4";\n          const ext=type.includes("mp4")?"m4a":type.includes("ogg")?"ogg":"webm";\n          const blob=new Blob(chunks,{type});\n          const file=new File([blob],`fidunio-audio-${Date.now()}.${ext}`,{type,lastModified:Date.now()});'''
new='''          const reportedType=recorder.mimeType||mime||chunks[0]?.type||"audio/mp4";\n          const type=String(reportedType).split(";",1)[0].trim().toLowerCase();\n          const ext=type.includes("mp4")?"m4a":type.includes("ogg")?"ogg":"webm";\n          const blob=new Blob(chunks,{type});\n          const file=new File([blob],`fidunio-audio-${Date.now()}.${ext}`,{type,lastModified:Date.now()});'''
assert s.count(old)==1, 'audio recorder MIME anchor changed'
s=s.replace(old,new,1)
p.write_text(s)

q=Path('audio-source-recorder.test.mjs')
t=q.read_text()
anchor='assert.match(app,/sendSelectedAttachmentFile\\("audio",file\\)/);\n'
addition='assert.match(app,/const reportedType=recorder\\.mimeType\\|\\|mime\\|\\|chunks\\[0\\]\\?\\.type\\|\\|"audio\\/mp4"/);\nassert.match(app,/String\\(reportedType\\)\\.split\\(";",1\\)\\[0\\]\\.trim\\(\\)\\.toLowerCase\\(\\)/);\nassert.match(app,/sendSelectedAttachmentFile\\("audio",file\\)/);\n'
assert t.count(anchor)==1, 'audio regression test anchor changed'
t=t.replace(anchor,addition,1)
q.write_text(t)

# release bookkeeping
v=Path('version.js'); x=v.read_text(); assert '0.9.9.10' in x; v.write_text(x.replace('0.9.9.10','0.9.9.11',1))
sw=Path('service-worker.js'); x=sw.read_text(); assert '0.9.9.10-audio-recorder-source' in x; sw.write_text(x.replace('0.9.9.10-audio-recorder-source','0.9.9.11-audio-mime-normalization',1))
for name in ['outbox-reconciliation-boundary.test.mjs','direct-message-basic-path.test.mjs']:
    r=Path(name); x=r.read_text(); x=x.replace('0\\.9\\.9\\.10-audio-recorder-source','0\\.9\\.9\\.11-audio-mime-normalization'); r.write_text(x)

def prepend(path,title,section):
    r=Path(path); x=r.read_text()
    if section.splitlines()[0] not in x:
        assert x.startswith(title)
        r.write_text(title+'\n\n'+section+'\n\n'+x[len(title):].lstrip())

section='''## 0.9.9.11 iOS recorded-audio MIME normalization\n\n**Status: DEVICE CANDIDATE.**\n\nReal-device 0.9.9.10 evidence: Audio chooser passed, microphone recorder opened correctly, and the camera did not open; after **Stop & Send**, the recorded clip was rejected before send as `Unsupported attachment type`. Source review showed the recorder was passing `MediaRecorder.mimeType` verbatim into the attachment validator. Browser recorder MIME values may include codec parameters (for example `audio/mp4;codecs=...`), while FIDUNIO's attachment authority deliberately validates canonical media types. 0.9.9.11 normalizes only the recorded-audio MIME to the lower-case base media type before constructing the File. It does not accept video MIME as audio and does not change encryption, Storage, Outbox, limits, or recipient handling.'''
prepend('CURRENT-REBUILD.md','# FIDUNIO Current Rebuild — Recovery Entry Point',section)
prepend('BUG-LIST.md','# FIDUNIO / Hermes Bug List',section)
prepend('README.md','# FIDUNIO / Hermes',section)

dev='''## Audio recorder send — MIME normalization\n\n**Status: DEVICE CANDIDATE on FIDUNIO 0.9.9.11 — 2026-09-08.**\n\n0.9.9.10 device result: chooser **good**; recorder **good**; camera did not open **yes**; send **no**. The failure occurred after finishing the recording, with `Audio could not be selected: Unsupported attachment type`. 0.9.9.11 canonicalizes codec-parameterized recorder MIME values before validation. Acceptance: repeat Record Audio for 5–10 seconds, Stop & Send, confirm no unsupported-type alert, confirm sender bubble appears and recipient receives the audio, then reopen and confirm accessibility.'''
prepend('DEVICE-ACCEPTANCE-BUGS.md','# FIDUNIO Device Acceptance — Current Evidence',dev)

check='''### iOS recorded-audio MIME normalization — 0.9.9.11\n\n- [x] Preserve the accepted Audio chooser and microphone-only recorder.\n- [x] Normalize only recorded-audio MIME parameters to a canonical base media type before validation.\n- [x] Do not classify `video/*` as audio.\n- [x] Preserve the 25 MiB audio limit and existing attachment send authority.\n- [x] Extend the permanent audio regression gate.\n- [ ] Device-confirm Record Audio → Stop & Send succeeds on iPhone.\n- [ ] Confirm sender and recipient can access the audio after reopen.'''
prepend('FIDUNIO-BUILD-CHECKLIST.md','# FIDUNIO Complete Rebuild — Authoritative Build Checklist',check)

m=Path('hermes-memory.txt'); x=m.read_text(); note='''\n\n2026-09-08 — Audio 0.9.9.11 candidate: 0.9.9.10 device test proved chooser and microphone recorder correct but recorded audio failed pre-send validation. Source boundary was MediaRecorder MIME passed verbatim; codec-parameterized audio MIME is now canonicalized to its base type before File creation/validation. No video MIME coercion, transport, encryption, Storage, Outbox, or size-limit changes. Device acceptance pending.\n''';
if 'Audio 0.9.9.11 candidate' not in x: m.write_text(x.rstrip()+note)
