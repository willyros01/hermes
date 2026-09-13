from pathlib import Path

def replace_once(path, old, new):
    p=Path(path); text=p.read_text()
    if text.count(old)!=1:
        raise SystemExit(f"{path}: expected one anchor, found {text.count(old)}")
    p.write_text(text.replace(old,new,1))

replace_once("app.js",
'''  composerStateByConversation.set(key,{...prior,replyTo:{messageId:String(message.id),sender:groupSenderDisplayName(message,conversation)||"FIDUNIO member",preview:groupReplyTargetPreview(message)},focused:true});''',
'''  composerStateByConversation.set(key,{...prior,replyTo:{messageId:String(message.id),sender:groupSenderDisplayName(message,conversation)||"FIDUNIO member",isSelf:!!message.mine,preview:groupReplyTargetPreview(message)},focused:true});''')

replace_once("app.js",
'''<strong>Replying to ${esc(existingComposerState.replyTo.sender)}</strong>''',
'''<strong>Replying to ${existingComposerState.replyTo.isSelf?"yourself":esc(existingComposerState.replyTo.sender)}</strong>''')

p=Path("group-reply-policy.test.mjs")
text=p.read_text()
if 'readFileSync' not in text:
    text='import {readFileSync} from "node:fs";\n'+text
if 'Replying to ${existingComposerState.replyTo.isSelf?"yourself"' not in text:
    text += '\nconst appSource=readFileSync(new URL("./app.js",import.meta.url),"utf8");\nassert.match(appSource,/isSelf:!!message\\.mine/);\nassert.match(appSource,/Replying to \\$\\{existingComposerState\\.replyTo\\.isSelf\\?"yourself":esc\\(existingComposerState\\.replyTo\\.sender\\)\\}/);\n'
p.write_text(text)

replace_once("version.js",'version: "1.1.54"','version: "1.1.54a"')
replace_once("service-worker.js",'const SHELL_REVISION="1.1.54-group-message-reply";','const SHELL_REVISION="1.1.54a-self-reply-label";')

replace_once("TODO.md",
'''- Reply target sender + bounded preview are shown above the composer and inside the resulting reply bubble.''',
'''- Reply target sender + bounded preview are shown above the composer and inside the resulting reply bubble. When replying to your own message, the composer says **Replying to yourself** while the durable reply descriptor keeps the real sender identity for recipients.''')

Path('apply-self-reply-label.py').unlink(missing_ok=True)
Path('.github/workflows/apply-self-reply-label.yml').unlink(missing_ok=True)
