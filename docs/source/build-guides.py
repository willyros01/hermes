"""Build the FIDUNIO documentation from one content source; no app execution or service calls."""
import base64
import html
import json
import re
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Image, Table, TableStyle, KeepTogether
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Polygon
from PIL import Image as PILImage

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "site"
DATA = json.loads((ROOT / "guide-content.json").read_text())
VERSION = DATA["version"]
for sub in ["fidunio/assets/screens", "fidunio/guide", "fidunio/quick-start", "fidunio/help", "guides/fidunio", "program/assets"]:
    (OUT / sub).mkdir(parents=True, exist_ok=True)
for p in (ROOT / "screens").glob("*.png"):
    (OUT / "fidunio/assets/screens" / p.name).write_bytes(p.read_bytes())

CSS = '''
:root{color-scheme:light dark;--bg:#f4f7fa;--paper:#fff;--ink:#142732;--muted:#405763;--accent:#09677f;--line:#c8d6dd;--notice:#e9f4f6}
@media(prefers-color-scheme:dark){:root{--bg:#0e1820;--paper:#162731;--ink:#f5f9fb;--muted:#c5d9e2;--accent:#8edbf0;--line:#506773;--notice:#203b47}}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:2rem}body{margin:0;background:var(--bg);color:var(--ink);font:clamp(22px,2vw,26px)/1.65 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
main{max-width:1120px;margin:auto;padding:32px 22px 80px}header,section{background:var(--paper);border:1px solid var(--line);border-radius:18px;padding:clamp(22px,4vw,44px);margin-bottom:28px}
h1{font-size:clamp(42px,6vw,64px);line-height:1.1;margin:.3em 0}h2{font-size:clamp(32px,4vw,42px);line-height:1.22;margin:.2em 0 .8em}h3{font-size:29px}a{color:var(--accent);text-underline-offset:4px;overflow-wrap:anywhere}a:focus-visible{outline:4px solid var(--accent);outline-offset:4px}nav{display:flex;flex-wrap:wrap;gap:14px 24px;font-weight:700;margin-bottom:22px}.kicker{text-transform:uppercase;letter-spacing:.1em;font-size:18px;font-weight:800;color:var(--accent)}.notice{background:var(--notice);border-left:7px solid var(--accent);padding:18px 22px}.meta,figcaption{font-size:20px;color:var(--muted)}li{margin:14px 0}figure{margin:30px auto;max-width:620px}figure img{display:block;max-width:100%;width:auto;max-height:950px;margin:auto;border:2px solid var(--line);border-radius:12px}figcaption{margin-top:12px}.toc{display:grid;gap:12px}table{border-collapse:collapse;width:100%;font-size:22px}th,td{padding:16px;border:1px solid var(--line);text-align:left;vertical-align:top;overflow-wrap:anywhere}th{background:var(--notice)}.table-wrap{overflow-x:auto}footer{padding:20px}.diagram{max-width:100%;height:auto}.skip{position:absolute;left:-10000px}.skip:focus{left:12px;top:12px;background:var(--paper);padding:12px;z-index:10}code{font-size:.88em;overflow-wrap:anywhere}pre{white-space:pre-wrap}
@media(max-width:600px){main{padding:16px 12px 50px}header,section{padding:22px 18px}table{font-size:20px}th,td{padding:10px}}
@media print{body{background:#fff;color:#142732;font-size:16pt}main{padding:0;max-width:none}header,section{border:0;padding:0;break-before:page}header{break-before:auto}nav,.toc,.download{display:none}a{color:#09677f}figure img{max-height:180mm}h1{font-size:32pt}h2{font-size:25pt}.meta,figcaption{font-size:14pt}}
'''
(OUT / "fidunio/assets/guide.css").write_text(CSS)

def flow_svg():
    labels = [("1. CHOOSE CONTACTS", "Settings > Safety > HELP"), ("2. HOLD FOR 2 SECONDS", "An open HELP alert is stored"), ("3. HELP IS SENT", "Type messages while waiting"), ("4. SOMEONE IS COMING", "A helper acknowledges HELP"), ("5. I'M OK NOW", "Close HELP and stop reminders")]
    parts=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 930" role="img" aria-labelledby="t d"><title id="t">HELP user flow</title><desc id="d">Choose contacts, hold HELP, alert is sent, helper acknowledges, sender closes HELP.</desc><rect width="920" height="930" fill="#f4f7fa"/>']
    for i,(title,sub) in enumerate(labels):
        y=25+i*180
        fill="#b52327" if i in [1,2] else "#12653f" if i==3 else "#144c60"
        parts += [f'<rect x="40" y="{y}" width="840" height="132" rx="18" fill="{fill}"/>',f'<text x="460" y="{y+49}" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="30" font-weight="700">{html.escape(title)}</text>',f'<text x="460" y="{y+96}" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="27">{html.escape(sub)}</text>']
        if i<4:parts += [f'<path d="M460 {y+140}v29m-13-12 13 14 13-14" stroke="#144c60" stroke-width="5" fill="none"/>']
    return ''.join(parts)+"</svg>"

def architecture_svg():
    boxes=[(45,40,830,120,"SHARED APP / HELP OWNER","One account lifecycle and route owner"),(45,245,395,155,"HELP METADATA","Alerts, contacts, acknowledgements"),(480,245,395,155,"ENCRYPTED CHAT","Messages and location cards"),(45,495,395,155,"HELP SERVER + PUSH","FCM / APNs / Fire ADM"),(480,495,395,155,"MESSAGE SERVICES","Existing E2EE / Outbox / receipts"),(45,755,830,120,"HELPER'S APP","Unlock > HELP screen > I'm coming")]
    p=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 920" role="img" aria-labelledby="t d"><title id="t">HELP resource boundaries</title><desc id="d">The shared HELP owner uses operational alert metadata for notifications, while messages and location use the existing encrypted chat services. Both converge at the helper app.</desc><rect width="920" height="920" fill="#f4f7fa"/>']
    for x,y,w,h,t,s in boxes:
        p += [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="18" fill="#144c60"/>',f'<text x="{x+w/2}" y="{y+48}" text-anchor="middle" font-family="Arial,sans-serif" fill="white" font-size="27" font-weight="700">{html.escape(t)}</text>']
        words=s.split(); chunks=[' '.join(words[:3]),' '.join(words[3:])] if w<500 else [s]
        for j,line in enumerate(chunks):p.append(f'<text x="{x+w/2}" y="{y+88+j*34}" text-anchor="middle" font-family="Arial,sans-serif" fill="white" font-size="24">{html.escape(line)}</text>')
    for path in ["M460 160v40H242v35","M460 200h438v35","M678 200v35","M242 400v85","M678 400v85","M242 650v65h218v30","M678 650v65H460"]:
        if path=="M460 200h438v35":continue
        p.append(f'<path d="{path}" stroke="#144c60" stroke-width="5" fill="none"/>')
    return ''.join(p)+"</svg>"

for name,svg in [("help-flow.svg",flow_svg()),("help-architecture.svg",architecture_svg())]:
    (OUT/"fidunio/assets"/name).write_text(svg)
    (OUT/"program/assets"/name).write_text(svg)

def chapter_html(c,number):
    b=[f'<section id="{c["id"]}"><h2>{number}. {html.escape(c["title"])}</h2>']
    if c.get('steps'):b.append('<ol>'+''.join('<li>'+html.escape(x)+'</li>' for x in c['steps'])+'</ol>')
    b += ['<p>'+html.escape(x)+'</p>' for x in c.get('paragraphs',[])]
    if c.get('bullets'):b.append('<ul>'+''.join('<li>'+html.escape(x)+'</li>' for x in c['bullets'])+'</ul>')
    if c.get('table'):
        rows=c['table'];b.append('<div class="table-wrap"><table><thead><tr>'+''.join('<th scope="col">'+html.escape(x)+'</th>' for x in rows[0])+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+html.escape(x)+'</td>' for x in row)+'</tr>' for row in rows[1:])+'</tbody></table></div>')
    if c.get('screen'):
        src='../assets/screens/'+c['screen'];b.append(f'<figure><a href="{src}" aria-label="View this screen larger"><img src="{src}" alt="{html.escape(c["caption"])}" loading="lazy"></a><figcaption>{html.escape(c["caption"])} <a href="{src}">View larger</a>.</figcaption></figure>')
    b.append('<p><a href="#contents">Back to contents</a></p></section>')
    return ''.join(b)

def make_html(kind,title,chapters,pdf):
    nav='<nav aria-label="Guide navigation"><a href="../../docs.html?app=fidunio">All FIDUNIO documents</a><a href="../quick-start/">Quick Start</a><a href="../guide/">Full Guide</a><a href="../help/">HELP Guide</a></nav>'
    toc=''.join(f'<a href="#{c["id"]}">{i}. {html.escape(c["title"])}</a>' for i,c in enumerate(chapters,1))
    content=''.join(chapter_html(c,i) for i,c in enumerate(chapters,1))
    overview='<section><h2>HELP at a glance</h2><img class="diagram" src="../assets/help-flow.svg" alt="Choose contacts, hold HELP, send messages, receive an acknowledgement, then close with I am OK now."></section>'
    doc=f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Illustrated large-print FIDUNIO {VERSION} guide, including HELP alerts."><title>FIDUNIO {VERSION} - {title}</title><link rel="stylesheet" href="../assets/guide.css?v={VERSION}-docs-20261128"></head><body><a class="skip" href="#contents">Skip to contents</a><main><header>{nav}<p class="kicker">Cuberoot Systems · Large-print guide</p><h1>FIDUNIO<br>{title}</h1><p class="meta">Version {VERSION} · Updated {DATA["updated"]}</p><p class="notice">{html.escape(DATA["notice"])}</p><p class="download"><a href="../../guides/fidunio/{pdf}">Download this guide as PDF</a></p><div id="contents" class="toc" aria-label="Contents">{toc}</div></header>{overview}{content}<footer><p>Updated {DATA["updated"]}. <a href="../support/">FIDUNIO support</a> · <a href="../privacy/">Privacy</a> · <a href="../terms/">Terms</a></p></footer></main></body></html>'
    (OUT/f'fidunio/{kind}/index.html').write_text(doc)

font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
bold='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
pdfmetrics.registerFont(TTFont('Guide',font));pdfmetrics.registerFont(TTFont('GuideBold',bold))
ST={
 'body':ParagraphStyle('body',fontName='Guide',fontSize=17,leading=24,spaceAfter=13,textColor=colors.HexColor('#142732')),
 'h1':ParagraphStyle('h1',fontName='GuideBold',fontSize=34,leading=40,spaceAfter=22,textColor=colors.HexColor('#144c60')),
 'h2':ParagraphStyle('h2',fontName='GuideBold',fontSize=25,leading=31,spaceAfter=18,keepWithNext=True,textColor=colors.HexColor('#144c60')),
 'h3':ParagraphStyle('h3',fontName='GuideBold',fontSize=19,leading=25,spaceBefore=12,spaceAfter=10,keepWithNext=True),
 'small':ParagraphStyle('small',fontName='Guide',fontSize=13,leading=18,spaceAfter=12,textColor=colors.HexColor('#405763')),
 'cell':ParagraphStyle('cell',fontName='Guide',fontSize=14,leading=20,spaceAfter=4),
}
def P(t,style='body'):return Paragraph(html.escape(t),ST[style])
def footer(canvas,doc):
    canvas.saveState();canvas.setFont('Guide',10);canvas.setFillColor(colors.HexColor('#405763'))
    canvas.drawString(43,25,f'FIDUNIO {VERSION} | 28 November 2026');canvas.drawRightString(A4[0]-43,25,str(doc.page));canvas.restoreState()
def flow_drawing():
    d=Drawing(490,350)
    labels=['Choose HELP contacts and Save','Hold HELP for two seconds','HELP is sent / exchange messages',"A contact answers I'm coming","I'm OK now closes the alert"]
    for i,label in enumerate(labels):
        y=295-i*66;fill=['#144c60','#b52327','#b52327','#12653f','#144c60'][i]
        d.add(Rect(0,y,490,48,rx=10,ry=10,fillColor=colors.HexColor(fill),strokeColor=None));d.add(String(245,y+18,label,textAnchor='middle',fontName='GuideBold',fontSize=16,fillColor=colors.white))
        if i<4:d.add(Line(245,y-3,245,y-16,strokeColor=colors.HexColor('#144c60'),strokeWidth=3))
    return d
def architecture_drawing():
    d=Drawing(490,480)
    boxes=[(0,405,490,65,'SHARED APP / HELP OWNER','One account lifecycle and route'),(0,270,232,88,'HELP METADATA','Contacts / alerts / answers'),(258,270,232,88,'ENCRYPTED CHAT','Text / location cards'),(0,135,232,88,'HELP SERVER + PUSH','FCM / APNs / Fire ADM'),(258,135,232,88,'MESSAGE SERVICES','E2EE / Outbox / receipts'),(0,0,490,65,"HELPER'S APP","Unlock / HELP / I'm coming")]
    for x,y,w,h,title,sub in boxes:
        d.add(Rect(x,y,w,h,rx=10,ry=10,fillColor=colors.HexColor('#144c60'),strokeColor=None))
        d.add(String(x+w/2,y+h-27,title,textAnchor='middle',fontName='GuideBold',fontSize=13,fillColor=colors.white))
        d.add(String(x+w/2,y+20,sub,textAnchor='middle',fontName='Guide',fontSize=12,fillColor=colors.white))
    for x in [116,374]:
        d.add(Line(x,358,x,395,strokeColor=colors.HexColor('#144c60'),strokeWidth=3))
        d.add(Line(x,223,x,270,strokeColor=colors.HexColor('#144c60'),strokeWidth=3))
        d.add(Line(x,65,x,135,strokeColor=colors.HexColor('#144c60'),strokeWidth=3))
    return d
def table_pdf(rows):
    tbl=Table([[P(x,'cell') for x in row] for row in rows],colWidths=[160,330],repeatRows=1,hAlign='LEFT')
    tbl.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e9f4f6')),('GRID',(0,0),(-1,-1),.5,colors.HexColor('#c8d6dd')),('LEFTPADDING',(0,0),(-1,-1),10),('RIGHTPADDING',(0,0),(-1,-1),10),('TOPPADDING',(0,0),(-1,-1),10),('BOTTOMPADDING',(0,0),(-1,-1),10)]))
    return tbl
def make_pdf(title,chapters,name):
    story=[P('FIDUNIO','h1'),P(title,'h1'),P('Version '+VERSION+' | '+DATA['updated'],'h3'),P('Illustrated large-print edition'),P(DATA['notice'],'small'),Spacer(1,18),flow_drawing(),PageBreak(),P('Contents','h2')]
    for i,c in enumerate(chapters,1):story.append(P(f'{i}. {c["title"]}'))
    for i,c in enumerate(chapters,1):
        story += [PageBreak(),P(f'{i}. {c["title"]}','h2')]
        for n,t in enumerate(c.get('steps',[]),1):story.append(P(f'{n}. {t}'))
        for t in c.get('paragraphs',[]):story.append(P(t))
        for t in c.get('bullets',[]):story.append(P('• '+t))
        if c.get('table'):story.append(table_pdf(c['table']))
        if c.get('screen'):
            path=ROOT/'screens'/c['screen'];im=PILImage.open(path);w,h=im.size
            scale=min(360/w,570/h)
            story += [Spacer(1,15),KeepTogether([Image(str(path),width=w*scale,height=h*scale),Spacer(1,8),P(c['caption'],'small')])]
    path=OUT/'guides/fidunio'/name
    SimpleDocTemplate(str(path),pagesize=A4,rightMargin=50,leftMargin=50,topMargin=44,bottomMargin=45,title=f'FIDUNIO {VERSION} - {title}',author='Cuberoot Systems').build(story,onFirstPage=footer,onLaterPages=footer)
    return path

chapters=DATA['chapters']
quick=[
 {'id':'start','title':'Get set up','steps':['Install FIDUNIO from the App Store on iPhone/iPad, or the Cuberoot signed Android download. The web app is also available.','Open your personal invitation. Enter your profile name, email, password and six-digit PIN. Existing members use Sign In.','In Settings choose A, A+ or A++ text and Auto, Light or Dark appearance. Enable notifications on this device.','Create a Recovery File in Settings > Data and save it outside the app. Keep your password and PIN private.'],'paragraphs':['Check Settings > About. This guide describes 1.1.88; the App Store and testing channels may differ.']},
 {'id':'chat','title':'Send an everyday message','steps':['Open Messages and select a chat, or use + to start a direct conversation or group.','Type your message and tap Send. Queued/Sending is still waiting; Sent confirms server acceptance.','Use the attachment control for photos, videos, audio or files. Press and hold a message for Copy, Select Text, reactions or eligible Reply/delete actions.','Tappable web links ask Open this link? before leaving the app. Read deletion confirmations carefully.'],'paragraphs':['The full guide covers groups, disappearing messages, recovery, administration and troubleshooting.']},
 {'id':'send-help','title':'Choose contacts and send HELP','steps':['Settings > Safety > HELP > Choose HELP contacts. Select up to five trusted FIDUNIO members, then Save.','Ask those people to open FIDUNIO and turn on notifications. Resolve any contact can\'t hear HELP yet warning.','On Messages, tap HELP. Hold the large button for two seconds until the ring completes.','Allow location if wanted. Check for HELP is sent; type extra information on the same screen. If HELP did not go out, check the connection and hold again.'], 'paragraphs':['HELP alerts your contacts; it does not call emergency services. Location is a point, not continuous tracking. Delivery and sound depend on connectivity and device settings.']},
 {'id':'respond','title':'Respond and close HELP','steps':['A helper taps the notification and unlocks if asked. The red screen shows who needs HELP.','Use Open in Maps when location arrives. Tap I\'m coming when you can respond, then exchange messages on the same screen.','The sender sees the responding contact\'s name on a green screen. When safe, the sender taps I\'m OK now to close the alert.','The HELP conversation is also the ordinary chat. After closure, ordinary message notifications open that chat.'],'paragraphs':['If notifications are off, use Turn on or Open Settings. Apple Critical Alerts approval is pending; HELP is not guaranteed to bypass silent mode or Focus. Read the illustrated HELP Guide for all steps.']}
]
selections=[('guide','Complete User Guide',chapters,'fidunio-user-guide.pdf'),('quick-start','Quick Start Guide',quick,'fidunio-quick-start.pdf'),('help','HELP Guide',[c for c in chapters if c.get('help')],'fidunio-help-guide.pdf')]
for kind,title,items,pdf in selections:
    make_html(kind,title,items,pdf);p=make_pdf(title,items,pdf);print(f'{p.name}: {p.stat().st_size} bytes')

def user_md():
    b=[f'# FIDUNIO {VERSION} — Complete User Guide',f'Updated {DATA["updated"]}.',DATA['notice'],'[Illustrated online guide](https://www.cuberoot-systems.com/fidunio/guide/) · [HELP guide](https://www.cuberoot-systems.com/fidunio/help/)']
    for c in chapters:
        b+=['## '+c['title']]
        b += [f'{i}. {x}' for i,x in enumerate(c.get('steps',[]),1)]
        b += c.get('paragraphs',[])
        b += ['- '+x for x in c.get('bullets',[])]
        if c.get('table'):
            b+=['| '+' | '.join(c['table'][0])+' |','|---|---|']+['| '+' | '.join(row)+' |' for row in c['table'][1:]]
    return '\n\n'.join(b)+'\n'
(OUT/'user-guide.md').write_text(user_md())
(OUT/'program/HELP-PROGRAM-DOCUMENTATION.md').write_text((ROOT/'program.md').read_text())

# Program PDF: retain code names as plain text, including the precise acceptance limits.
md=(ROOT/'program.md').read_text();story=[];table=[]
for line in md.splitlines():
    if line.startswith('|'):
        if re.match(r'^\|[ :|-]+\|$',line):continue
        table.append([x.strip().replace('`','') for x in line.strip('|').split('|')]);continue
    if table:
        # Wide module tables use stacked rows to keep large type readable.
        headings=table[0]
        for row in table[1:]:
            story.append(P(row[0],'h3'))
            for h,v in zip(headings[1:],row[1:]):story.append(P(h+': '+v))
        table=[]
    if not line:continue
    if line.startswith('# '):story.append(P(line[2:],'h1'))
    elif line.startswith('## '):story += [Spacer(1,15),P(line[3:],'h2')]
    elif line.startswith('!['):story += [flow_drawing()] if 'flow.svg' in line else [architecture_drawing()]
    else:story.append(P(re.sub(r'[`*]','',line)))
program_pdf=OUT/'program/fidunio-help-program-guide.pdf'
SimpleDocTemplate(str(program_pdf),pagesize=A4,rightMargin=50,leftMargin=50,topMargin=44,bottomMargin=45,title='FIDUNIO HELP - Program Documentation 1.1.88',author='Cuberoot Systems').build(story,onFirstPage=footer,onLaterPages=footer)
print(f'{program_pdf.name}: {program_pdf.stat().st_size} bytes')
