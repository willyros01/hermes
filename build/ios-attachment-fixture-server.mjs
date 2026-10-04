// Isolated native transport fixture. No Firebase account, request or write.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {encryptAttachmentBytes} from '../e2ee-account-attachment-crypto.js';
const task=process.argv[2],app=process.argv[3];
const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNgWHAHAAIgAX0PAfYKAAAAAElFTkSuQmCC','base64');
const encrypted=await encryptAttachmentBytes({attachmentId:'native-photo-fixture',bytes,meta:{name:'fixture.png',type:'image/png'}});
const rows=[encrypted.manifest,...encrypted.chunks];
const server=http.createServer((req,res)=>{
 const index=Number(req.url.slice(1));
 if(req.method!=='GET'||!Number.isInteger(index)||!rows[index]){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',index===0?'application/json':'application/octet-stream');
 res.end(JSON.stringify(rows[index]));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
const descriptor={fidunioAttachment:1,attachmentId:'native-photo-fixture',key:encrypted.key,kind:'photo',type:'image/png',storagePaths:{manifest:'0',chunks:encrypted.chunks.map((_,i)=>String(i+1))}};
const html=`<!doctype html><meta name="viewport" content="width=device-width"><body style="font:32px system-ui;background:white;color:black">CHECKING PHOTO<script type="module">
import {downloadPlatformAttachmentBytes} from './attachment-download-platform-adapter.js';
import {createAttachmentReceiveService} from './attachment-receive-service.js';
try{
 const http=window.Capacitor.Plugins.CapacitorHttp;
 const bridge={Plugins:{CapacitorHttp:{request:options=>http.request({...options,url:${JSON.stringify(base)}+'/'+new URL(options.url).pathname.split('/o/')[1]})}}};
 const read=async index=>JSON.parse(new TextDecoder().decode(await downloadPlatformAttachmentBytes('https://firebasestorage.googleapis.com/v0/b/fidunio-fef13.firebasestorage.app/o/'+index+'?alt=media&token=isolated-fixture',{storageBucket:'fidunio-fef13.firebasestorage.app',capacitor:bridge})));
 const receiver=createAttachmentReceiveService({downloadEncryptedAttachment:async p=>({manifest:await read(p.manifest),chunks:await Promise.all(p.chunks.map(read))})});
 const photo=await receiver.receive(${JSON.stringify(descriptor)});
 const image=new Image();image.src=photo.url;
 await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('Image decode failed'));});
 if(image.naturalWidth!==1||photo.size!==${bytes.length})throw Error('Photo mismatch');
 document.body.textContent='PASS PHOTO';document.body.appendChild(image);
}catch(error){document.body.textContent='FAIL PHOTO '+error.message;}
</script>`;
await fs.writeFile(path.join(app,'public','index.html'),html);
await fs.writeFile(path.join(task,'fixture-ready'),'ready');
console.log('Isolated encrypted-photo server ready');
