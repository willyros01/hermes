// Isolated native transport fixture. No Firebase account, request or write.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {encryptAttachmentBytes} from '../e2ee-account-attachment-crypto.js';

function wavTone(){
  const sampleRate=8000,durationSeconds=.25,samples=Math.floor(sampleRate*durationSeconds),dataBytes=samples*2;
  const b=Buffer.alloc(44+dataBytes);
  b.write('RIFF',0);b.writeUInt32LE(36+dataBytes,4);b.write('WAVE',8);
  b.write('fmt ',12);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);
  b.writeUInt32LE(sampleRate,24);b.writeUInt32LE(sampleRate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);
  b.write('data',36);b.writeUInt32LE(dataBytes,40);
  for(let i=0;i<samples;i++)b.writeInt16LE(Math.round(Math.sin(2*Math.PI*440*i/sampleRate)*5000),44+i*2);
  return b;
}

const task=process.argv[2],app=process.argv[3];
const photoBytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNgWHAHAAIgAX0PAfYKAAAAAElFTkSuQmCC','base64');
const audioBytes=wavTone();
const photoEncrypted=await encryptAttachmentBytes({attachmentId:'native-photo-fixture',bytes:photoBytes,meta:{name:'fixture.png',type:'image/png'}});
const audioEncrypted=await encryptAttachmentBytes({attachmentId:'native-audio-fixture',bytes:audioBytes,meta:{name:'fixture.wav',type:'audio/wav'}});

const objects=new Map();
function register(prefix,encrypted){
  objects.set(prefix+'/manifest',encrypted.manifest);
  encrypted.chunks.forEach((chunk,i)=>objects.set(prefix+'/chunk-'+i,chunk));
}
register('photo',photoEncrypted);register('audio',audioEncrypted);

const server=http.createServer((req,res)=>{
 const key=decodeURIComponent(req.url.slice(1));
 const row=objects.get(key);
 if(req.method!=='GET'||!row){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',key.endsWith('/manifest')?'application/json':'application/octet-stream');
 res.end(JSON.stringify(row));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
const photoDescriptor={fidunioAttachment:1,attachmentId:'native-photo-fixture',key:photoEncrypted.key,kind:'photo',name:'fixture.png',type:'image/png',storagePaths:{manifest:'photo/manifest',chunks:photoEncrypted.chunks.map((_,i)=>`photo/chunk-${i}`)}};
const audioDescriptor={fidunioAttachment:1,attachmentId:'native-audio-fixture',key:audioEncrypted.key,kind:'audio',name:'fixture.wav',type:'audio/wav',storagePaths:{manifest:'audio/manifest',chunks:audioEncrypted.chunks.map((_,i)=>`audio/chunk-${i}`)}};

const html=`<!doctype html><meta name="viewport" content="width=device-width"><body style="margin:0;padding:140px 24px 24px;font:32px system-ui;background:white;color:black">CHECKING ATTACHMENTS<script type="module">
import {downloadPlatformAttachmentBytes} from './attachment-download-platform-adapter.js';
import {createAttachmentReceiveService} from './attachment-receive-service.js';
try{
 const http=window.Capacitor.Plugins.CapacitorHttp;
 const bridge={Plugins:{CapacitorHttp:{request:options=>http.request({...options,url:${JSON.stringify(base)}+'/'+new URL(options.url).pathname.split('/o/')[1]})}}};
 const read=async key=>JSON.parse(new TextDecoder().decode(await downloadPlatformAttachmentBytes('https://firebasestorage.googleapis.com/v0/b/fidunio-fef13.firebasestorage.app/o/'+key+'?alt=media&token=isolated-fixture',{storageBucket:'fidunio-fef13.firebasestorage.app',capacitor:bridge})));
 const receiver=createAttachmentReceiveService({downloadEncryptedAttachment:async p=>({manifest:await read(p.manifest),chunks:await Promise.all(p.chunks.map(read))})});
 const photo=await receiver.receive(${JSON.stringify(photoDescriptor)});
 const image=new Image();image.src=photo.url;
 await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('Image decode failed'));});
 if(image.naturalWidth!==1||photo.size!==${photoBytes.length})throw Error('Photo mismatch');
 const audio=await receiver.receive(${JSON.stringify(audioDescriptor)});
 const player=document.createElement('audio');player.src=audio.url;player.preload='metadata';player.controls=true;
 document.body.appendChild(player);
 await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(Error('Audio decode timed out')),8000);
   player.addEventListener('loadedmetadata',()=>{clearTimeout(timer);resolve();},{once:true});
   player.addEventListener('error',()=>{clearTimeout(timer);reject(Error('Audio decode failed'));},{once:true});
   player.load();
 });
 if(audio.type!=='audio/wav'||audio.size!==${audioBytes.length})throw Error('Audio mismatch');
 document.body.textContent='PASS PHOTO AUDIO';document.body.appendChild(image,player);
}catch(error){document.body.textContent='FAIL ATTACHMENT '+error.message;}
</script>`;
await fs.writeFile(path.join(app,'public','index.html'),html);
await fs.writeFile(path.join(task,'fixture-ready'),'ready');
console.log('Isolated encrypted photo+audio server ready');
