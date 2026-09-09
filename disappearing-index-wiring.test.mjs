import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const firebaseConfig=JSON.parse(readFileSync('firebase.json','utf8'));
const indexes=JSON.parse(readFileSync('firestore.indexes.json','utf8'));
const scheduler=readFileSync('functions/disappearing/disappearing-scheduler-core.mjs','utf8');

assert.equal(firebaseConfig?.firestore?.indexes,'firestore.indexes.json','Firebase deployment must own the reviewed Firestore index file');
const override=(indexes.fieldOverrides||[]).find(row=>row.collectionGroup==='messages'&&row.fieldPath==='disappearingPurgeVersion');
assert.ok(override,'disappearing scheduler collection-group field override is required');
assert.ok((override.indexes||[]).some(index=>index.order==='ASCENDING'&&index.queryScope==='COLLECTION_GROUP'),'disappearingPurgeVersion requires COLLECTION_GROUP ASCENDING index');
assert.match(scheduler,/collectionGroup\('messages'\)\.where\('disappearingPurgeVersion','==',1\)/,'scheduler discovery query must remain covered by the declared collection-group index');

console.log('Disappearing collection-group index wiring gate passed');
