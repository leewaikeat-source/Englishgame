// Tooling is intentionally isolated from the lightweight frontend install.
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
const require = createRequire((process.env.HAZE_SECURITY_TOOLS || process.cwd()) + '/package.json');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { doc, setDoc, getDoc, getDocs, collection, query, limit, runTransaction, serverTimestamp, Timestamp } = require('firebase/firestore');
const test = await initializeTestEnvironment({ projectId: 'demo-haze-heroes', firestore: { host: '127.0.0.1', port: 8080, rules: await readFile('firestore.rules', 'utf8') } });
let passed = 0;
const pass = async (label, work) => { await work(); passed++; console.log('PASS:', label); };
const alice = test.authenticatedContext('alice').firestore(), bob = test.authenticatedContext('bob').firestore(), teacher = test.authenticatedContext('teacher', { teacher: true }).firestore(), guest = test.unauthenticatedContext().firestore();
const id1 = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const id2 = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
const row = (id = id1, score = 1100) => ({ uid: 'alice', name: 'Aina Hero', avatar: 'sun', correct: 10, score, answerMs: 150000, attemptId: id });
async function attempt(store, data, publicData = data) {
  await runTransaction(store, async tx => {
    // Production client reads all three documents before creating a new attempt.
    const attemptRef = doc(store, 'attempts', data.attemptId), playerRef = doc(store, 'players', data.uid), bestRef = doc(store, 'leaderboard', data.uid);
    await Promise.all([tx.get(attemptRef), tx.get(playerRef), tx.get(bestRef)]);
    tx.set(attemptRef, { ...data, className: '4 Cemerlang', completedAt: serverTimestamp() });
    tx.set(playerRef, { lastAttemptId: data.attemptId, lastSubmittedAt: serverTimestamp() });
    tx.set(bestRef, publicData);
  });
}
try {
  await test.clearFirestore();
  await pass('anonymous-authenticated student can create atomic valid result', () => assertSucceeds(attempt(alice, row())));
  await pass('student reads own immutable attempt for idempotent retry', () => assertSucceeds(getDoc(doc(alice, 'attempts', id1))));
  await pass('student cannot list participation records', () => assertFails(getDocs(query(collection(alice, 'attempts'), limit(1000)))));
  await pass('different student cannot read private attempt', () => assertFails(getDoc(doc(bob, 'attempts', id1))));
  await pass('different student cannot read rate-limit record', () => assertFails(getDoc(doc(bob, 'players', 'alice'))));
  await pass('teacher can read participation records', () => assertSucceeds(getDocs(query(collection(teacher, 'attempts'), limit(1000)))));
  await pass('unauthenticated request cannot read leaderboard', () => assertFails(getDocs(query(collection(guest, 'leaderboard'), limit(10)))));
  await pass('authenticated student can read top ten', () => assertSucceeds(getDocs(query(collection(bob, 'leaderboard'), limit(10)))));
  await pass('unbounded public list denied', () => assertFails(getDocs(collection(bob, 'leaderboard'))));
  await pass('more than ten public rows denied', () => assertFails(getDocs(query(collection(bob, 'leaderboard'), limit(11)))));
  await pass('attempt updates denied', () => assertFails(setDoc(doc(alice, 'attempts', id1), { ...row(), score: 1200, className: '', completedAt: serverTimestamp() })));
  await pass('new attempt within 60 seconds denied', () => assertFails(attempt(alice, row(id2, 1200))));
  // Advance only fixture metadata through trusted emulator setup to test independent constraints.
  async function agePlayer() { await test.withSecurityRulesDisabled(async ctx => { await setDoc(doc(ctx.firestore(), 'players', 'alice'), { lastAttemptId: id1, lastSubmittedAt: Timestamp.fromMillis(Date.now() - 120000) }); }); }
  await agePlayer();
  await pass('out-of-range points denied', () => assertFails(attempt(alice, row(id2, 1201))));
  await pass('wrong answer points denied', () => assertFails(attempt(alice, { ...row(id2, 1200), correct: 0 })));
  await pass('class field in public leaderboard denied', () => assertFails(attempt(alice, row(id2, 1200), { ...row(id2, 1200), className: 'private class' })));
  await pass('spoofed identity denied', () => assertFails(attempt(bob, row(id2, 1200))));
  await pass('worse best-score replacement denied', () => assertFails(attempt(alice, row(id2, 1000))));
  await pass('matching improved best result allowed after cooldown', () => assertSucceeds(attempt(alice, row(id2, 1200))));
  console.log(`${passed} Firestore security checks passed.`);
} finally { await test.cleanup(); }
