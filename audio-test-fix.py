from pathlib import Path
p=Path('attachment-ui-wiring.test.mjs')
s=p.read_text()
old='s.includes("document.body.appendChild(input);attachmentPickerActive=true;input.click()")&&s.includes("state.unlocked&&!attachmentPickerActive")&&s.includes("input.oncancel=closePicker")&&s.includes("closePicker();if(!file)return")'
new='s.includes("document.body.appendChild(input);attachmentPickerActive=true;input.click()")&&s.includes("state.unlocked&&!attachmentPickerActive")&&s.includes("input.oncancel=closePicker")&&s.includes("closePicker();if(file)await sendSelectedAttachmentFile(kind,file)")&&s.includes(\'if(capture)input.setAttribute("capture","environment")\')'
assert old in s, 'camera picker regression assertion changed'
p.write_text(s.replace(old,new,1))
