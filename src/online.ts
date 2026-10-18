import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAuth, signInAnonymously, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { getFirestore, collection, doc, getDocs, query, orderBy, limit, runTransaction, serverTimestamp, startAfter, type QueryDocumentSnapshot } from 'firebase/firestore';
import { compareResults, stats, type Session, type AvatarId } from './game';
const env = import.meta.env;
// A broken or partial web configuration must never prevent local gameplay.
function connect() {
  if (!(env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_AUTH_DOMAIN && env.VITE_FIREBASE_PROJECT_ID && env.VITE_FIREBASE_APP_ID)) return null;
  try {
    const app = initializeApp({ apiKey: env.VITE_FIREBASE_API_KEY, authDomain: env.VITE_FIREBASE_AUTH_DOMAIN, projectId: env.VITE_FIREBASE_PROJECT_ID, appId: env.VITE_FIREBASE_APP_ID });
    const auth = getAuth(app), db = getFirestore(app);
    if (env.VITE_FIREBASE_APPCHECK_SITE_KEY) initializeAppCheck(app, { provider: new ReCaptchaV3Provider(env.VITE_FIREBASE_APPCHECK_SITE_KEY), isTokenAutoRefreshEnabled: true });
    return { auth, db };
  } catch { return null; }
}
const connection = connect();
export const configured = Boolean(connection);
export const auth = connection?.auth ?? null;
const db = connection?.db ?? null;
export interface ScoreRow { uid: string; name: string; avatar: AvatarId; correct: number; score: number; answerMs: number; attemptId: string }
export interface Attempt extends ScoreRow { className: string; completedAt: { toDate: () => Date } }
let pendingIdentity: Promise<User> | null = null;
export async function identity() {
  if (!auth) throw new Error('Online scores not configured');
  if (auth.currentUser) return auth.currentUser;
  if (!pendingIdentity) pendingIdentity = (async () => { await auth.authStateReady(); return auth.currentUser ?? (await signInAnonymously(auth)).user; })().finally(() => { pendingIdentity = null; });
  return pendingIdentity;
}
export async function leaderboard(): Promise<ScoreRow[]> {
  if (!db) return [];
  await identity();
  const snapshot = await getDocs(query(collection(db, 'leaderboard'), orderBy('correct', 'desc'), orderBy('score', 'desc'), orderBy('answerMs', 'asc'), limit(10)));
  return snapshot.docs.map(d => d.data() as ScoreRow);
}
export async function submit(session: Session) {
  if (!db || session.phase !== 'result') throw new Error('Online scores not configured');
  const user = await identity();
  if (session.ownerUid && session.ownerUid !== user.uid) throw new Error('This attempt belongs to a different browser identity. Keep your screenshot; start a new mission to submit with this account.');
  const result = stats(session);
  const row: ScoreRow = { uid: user.uid, name: session.name, avatar: session.avatar, correct: result.correct, score: result.score, answerMs: result.answerMs, attemptId: session.id };
  const store = db;
  await runTransaction(store, async tx => {
    const attemptRef = doc(store, 'attempts', session.id);
    const bestRef = doc(store, 'leaderboard', user.uid);
    const playerRef = doc(store, 'players', user.uid);
    const [existing, best, player] = await Promise.all([tx.get(attemptRef), tx.get(bestRef), tx.get(playerRef)]);
    if (existing.exists()) {
      if (existing.data().uid !== user.uid) throw new Error('Attempt identity mismatch.');
      return; // Same immutable attempt: retry is idempotent.
    }
    if (player.exists() && Date.now() - player.data().lastSubmittedAt.toMillis() < 60000) throw new Error('Please wait one minute between online submissions, then retry.');
    const completedAt = serverTimestamp();
    tx.set(attemptRef, { ...row, className: session.className, completedAt });
    tx.set(playerRef, { lastAttemptId: session.id, lastSubmittedAt: completedAt });
    if (!best.exists() || compareResults(row, best.data() as ScoreRow) < 0) tx.set(bestRef, row);
  });
}
export async function teacherLogin(email: string, password: string) {
  if (!auth) throw new Error('Online scores not configured');
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  if ((await user.getIdTokenResult(true)).claims.teacher !== true) { await signOut(auth); throw new Error('This account has not been authorized as a teacher.'); }
}
export async function teacherAttempts(): Promise<Attempt[]> {
  if (!db || !auth?.currentUser || (await auth.currentUser.getIdTokenResult()).claims.teacher !== true) throw new Error('An authorized teacher account is required.');
  // Authorized teachers read every page; statistics are never silently capped.
  const rows: Attempt[] = [];
  let cursor: QueryDocumentSnapshot | undefined;
  for (;;) {
    const constraints = [orderBy('completedAt', 'desc'), limit(1000), ...(cursor ? [startAfter(cursor)] : [])];
    const snapshot = await getDocs(query(collection(db, 'attempts'), ...constraints));
    rows.push(...snapshot.docs.map(d => d.data() as Attempt));
    if (snapshot.size < 1000) return rows;
    cursor = snapshot.docs.at(-1);
  }
}
export async function logoutTeacher() { if (auth) await signOut(auth); }

// Show only a bounded error code and helpful guidance, never raw request data.
export function leaderboardError(error: unknown): string {
  const rawCode = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  const code = /^[a-z0-9/.-]{1,80}$/.test(rawCode) ? rawCode : 'connection-error';
  const hints: Record<string, string> = {
    'auth/operation-not-allowed': 'Anonymous sign-in needs to be enabled in Firebase Authentication.',
    'auth/admin-restricted-operation': 'Check that Anonymous sign-in is enabled in Firebase Authentication.',
    'auth/invalid-api-key': 'Check the Firebase web API key in the GitHub repository variables, then rebuild the website.',
    'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'Check the Firebase web API key in the GitHub repository variables, then rebuild the website.',
    'auth/unauthorized-domain': 'Add this website hostname to Firebase Authentication’s authorized domains.',
    'auth/configuration-not-found': 'Check that Firebase Authentication is initialized in the project matching the website configuration.',
    'permission-denied': 'Check the published Firestore rules and any enforced App Check settings.',
    'failed-precondition': 'Check that the lowercase leaderboard index is enabled with the required field order.',
    'auth/network-request-failed': 'Check your connection and whether Firebase requests are being blocked.',
    'unavailable': 'Firebase is temporarily unreachable. Please retry shortly.',
    'resource-exhausted': 'Firebase usage limits have been reached. The teacher can check the project’s quotas.',
  };
  return `Online scores unavailable (${code}). ${hints[code] ?? 'Please share this error code with your teacher to check the Firebase configuration.'} Your mission still works.`;
}
