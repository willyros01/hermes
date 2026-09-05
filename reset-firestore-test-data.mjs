#!/usr/bin/env node
/**
 * FIDUNIO / Hermes — destructive Firestore TEST-DATA reset
 *
 * PURPOSE
 *   Remove messaging/E2EE TEST data while preserving the actual FIDUNIO
 *   accounts and system configuration.
 *
 * PRESERVES
 *   - Firebase Authentication users (this script never touches Auth)
 *   - users/{uid} profile documents
 *   - system/*
 *   - invitations/*
 *
 * DELETES / CLEARS
 *   - conversations/* recursively, including messages subcollections
 *   - groups/* recursively, including members/messages/key subcollections
 *   - users/{uid}/devices/* recursively
 *   - account-level E2EE compatibility fields on users/{uid}:
 *       e2eePublicJwk, e2eeVersion, e2eeUpdatedAt
 *
 * SAFETY
 *   Dry-run is the default. Nothing is deleted unless BOTH are supplied:
 *      --apply --confirm=RESET-FIDUNIO-TEST-DATA
 *
 * RUN IN GOOGLE CLOUD SHELL
 *   gcloud config set project fidunio-fef13
 *   mkdir -p ~/fidunio-reset && cd ~/fidunio-reset
 *   npm init -y
 *   npm install firebase-admin
 *   # copy this file here, then:
 *   node reset-firestore-test-data.mjs
 *   node reset-firestore-test-data.mjs --apply --confirm=RESET-FIDUNIO-TEST-DATA
 *
 * Authentication uses Application Default Credentials. No service-account
 * key file belongs in the Hermes repo.
 */

import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = 'fidunio-fef13';
const APPLY = process.argv.includes('--apply');
const confirmArg = process.argv.find(x => x.startsWith('--confirm='));
const CONFIRM = confirmArg ? confirmArg.slice('--confirm='.length) : '';
const REQUIRED_CONFIRM = 'RESET-FIDUNIO-TEST-DATA';

initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
const db = getFirestore();

const stats = {
  conversations: 0,
  groups: 0,
  deviceDocs: 0,
  userProfilesCleared: 0,
  nestedDocs: 0,
};

async function countCollection(colRef) {
  const snap = await colRef.get();
  let nested = 0;
  for (const doc of snap.docs) {
    const subs = await doc.ref.listCollections();
    for (const sub of subs) nested += await countCollection(sub);
  }
  return snap.size + nested;
}

async function deleteDocumentTree(docRef) {
  const subcollections = await docRef.listCollections();
  for (const sub of subcollections) {
    const snap = await sub.get();
    for (const child of snap.docs) {
      await deleteDocumentTree(child.ref);
      await child.ref.delete();
      stats.nestedDocs++;
    }
  }
}

async function deleteCollectionTree(collectionName, statKey) {
  const col = db.collection(collectionName);
  const snap = await col.get();
  for (const doc of snap.docs) {
    await deleteDocumentTree(doc.ref);
    await doc.ref.delete();
    stats[statKey]++;
  }
}

async function inspect() {
  const conversations = await db.collection('conversations').get();
  const groups = await db.collection('groups').get();
  const users = await db.collection('users').get();

  let deviceDocs = 0;
  for (const user of users.docs) {
    deviceDocs += await countCollection(user.ref.collection('devices'));
  }

  console.log('\nFIDUNIO Firestore test-data reset — INSPECTION ONLY');
  console.log('Project:', PROJECT_ID);
  console.log('Top-level conversation docs:', conversations.size);
  console.log('Top-level group docs:', groups.size);
  console.log('User profile docs preserved:', users.size);
  console.log('Device-registry docs/subdocs to delete:', deviceDocs);
  console.log('System and invitation collections are untouched.');
  console.log('Firebase Authentication users are untouched.');
}

async function clearUserE2EEAndDevices() {
  const users = await db.collection('users').get();

  for (const user of users.docs) {
    const devices = await user.ref.collection('devices').get();
    for (const device of devices.docs) {
      await deleteDocumentTree(device.ref);
      await device.ref.delete();
      stats.deviceDocs++;
    }

    await user.ref.update({
      e2eePublicJwk: FieldValue.delete(),
      e2eeVersion: FieldValue.delete(),
      e2eeUpdatedAt: FieldValue.delete(),
    });
    stats.userProfilesCleared++;
  }
}

async function applyReset() {
  if (!APPLY || CONFIRM !== REQUIRED_CONFIRM) {
    throw new Error(
      `Destructive reset blocked. Re-run with --apply --confirm=${REQUIRED_CONFIRM}`
    );
  }

  console.log('\n*** APPLYING DESTRUCTIVE TEST-DATA RESET ***');
  console.log('Project:', PROJECT_ID);

  await deleteCollectionTree('conversations', 'conversations');
  await deleteCollectionTree('groups', 'groups');
  await clearUserE2EEAndDevices();

  console.log('\nReset complete.');
  console.log('Deleted conversation docs:', stats.conversations);
  console.log('Deleted group docs:', stats.groups);
  console.log('Deleted nested docs:', stats.nestedDocs);
  console.log('Deleted device docs:', stats.deviceDocs);
  console.log('User profiles preserved / E2EE fields cleared:', stats.userProfilesCleared);
  console.log('\nNext: clear willyros01.github.io website data on each test device,');
  console.log('then sign into FIDUNIO fresh and establish one new stable E2EE identity per device.');
}

try {
  await inspect();
  if (APPLY) await applyReset();
  else {
    console.log(`\nDry run only. To execute:\nnode reset-firestore-test-data.mjs --apply --confirm=${REQUIRED_CONFIRM}`);
  }
} catch (err) {
  console.error('\nRESET FAILED:', err?.stack || err);
  process.exitCode = 1;
}
