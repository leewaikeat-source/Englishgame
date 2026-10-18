# HAZE HEROES: Mission Clear Sky

A complete, responsive English vocabulary game for Malaysian Form 4 students (CEFR A2–B1). Students learn ten words, clear 10% of a fictional city’s haze per correct answer, and receive a screenshot-ready certificate. Four local SVG teenage heroes, English/Malay feedback, a progressively brighter city, keyboard access and reduced-motion support are included. There are no remote fonts or image services.

**Works immediately in local mode. Firebase is optional. No live leaderboard or deployed public site is claimed by this project.**

## 1. Run on your computer

Install Node.js **22.12+** (Node 24 also supported) from https://nodejs.org. Open a terminal in this folder:

```sh
npm ci
npm run dev
```

Open the address Vite prints. Use `npm test` for the unit tests and `npm run build` for TypeScript checking and a production build. `npm run preview` serves that build for local checking. In a restricted cloud machine, add `--cache /tmp/haze-npm-cache` to npm install/ci if the home cache is not writable.

The empty repository had no existing source to preserve. This project does not need credentials to build or play. Only the two runtime service packages React and Firebase are used; no UI or remote illustration dependencies are needed.

### Play and scoring

1. Enter a trimmed nickname (2–30 characters). Letters in any script, numbers, spaces, periods, hyphens and apostrophes are allowed. Class is optional (40 characters maximum). Do not enter an email, phone number or national ID.
2. Select a hero, review the instructions, then press **Start Mission**.
3. Answer each of the ten questions using the large A/B/C buttons. Buttons work with Tab and Enter/Space. Each question appears exactly once. Its three choices are shuffled once per session and saved with progress.
4. Read the feedback, including the Malay meaning and example, then select **Next Question**. There is no automatic advance.
5. Screenshot the result for Google Classroom, or download its locally rendered PNG. This works without Firebase. A PNG export re-renders all essential result fields on a high-resolution canvas using the bundled avatar, so it does not depend on screenshot libraries, remote fonts or cross-origin images.

A correct answer earns `100 + floor(20 × max(0, 1 − answerMilliseconds / 30000))` points. A wrong answer earns zero. The bonus decreases over 30 seconds, with no deadline, negative marks or bonus for wrong answers. Exactly instantaneous answers earn 120; after 30 seconds they earn 100. Maximum: 1,200. Answer timing uses `performance.now()`; feedback and briefing time are excluded. Time spent away from an unanswered question in a still-open tab is included; time while the app is closed is not. Refresh restores checkpoints (up to approximately one second of elapsed answer time can be lost during a forced crash). Times display as minutes:seconds; ranking uses integer milliseconds.

Haze remaining is `100 − 10 × correctCount`. A non-perfect result never shows a fully clear sky or the perfect-score message. Ranking compares correct count, then points, then shorter answer time. Exact ties have equal performance; their order is unspecified. The best attempt is retained per Firebase UID, **not per name or student**. One student can have multiple browser identities; shared browsers may share one identity. Clearing storage or changing devices creates another anonymous identity. Do not use this unverified leaderboard for high-stakes grading.

## 2. Publish a shareable URL with GitHub Pages (teacher actions)

The code is prepared for publishing, but no external deployment is performed by Codex.

1. Commit these files, including `package-lock.json`, to `leewaikeat-source/Englishgame` on branch **main**, and push them to GitHub. Do not commit `.env.local`, admin SDK keys or passwords. The repository began empty; create `main` if it does not exist.
2. On GitHub open **Settings → Pages → Build and deployment → Source**, and select **GitHub Actions**.
3. Open **Actions → Deploy GitHub Pages**. Pushing to `main` runs it automatically, or choose **Run workflow**. The workflow installs locked dependencies, runs tests, checks TypeScript, builds, uploads `dist`, and publishes through the official Pages actions.
4. When the workflow succeeds, copy the public URL shown in **Settings → Pages**. It will normally resemble `https://leewaikeat-source.github.io/Englishgame/`; confirm the actual URL in GitHub. Share it through Google Classroom.
5. Test the published page on a phone. Play a complete game, refresh mid-question, download the PNG, and verify the final haze matches your correct count. The GitHub-hosted deployment itself cannot be verified before you publish it.

Vite uses relative asset paths so repository subpaths work. The teacher route on static GitHub Pages is **`<game URL>#/teacher`**. `/teacher` is also recognized on hosts configured to rewrite paths to `index.html`; GitHub Pages does not provide that rewrite. Use the hash URL there. Changing Firebase build variables requires a new Actions build.

## 3. Optional shared Firebase scores (teacher actions)

The game remains playable if these steps are skipped. The UI explicitly says **Online scores not configured** rather than showing fictional records.

### Create the services

1. Create a Firebase project at https://console.firebase.google.com and register a **Web app**. Analytics is unnecessary. Choose a suitable Firestore region and review your institution’s data/location policy and service costs.
2. Under **Authentication → Sign-in method**, enable **Anonymous** for students and **Email/Password** for teacher accounts. Students are never asked for email or passwords. Anonymous sign-in creates an opaque browser identity in the background, and play starts without waiting for it.
3. Under **Authentication → Settings → Authorized domains**, add your GitHub Pages hostname (for example `leewaikeat-source.github.io`), your custom domain if any, and `localhost` for development if needed. Enter hostnames, not full URL paths.
4. Create **Cloud Firestore in production mode**. Deploy this repository’s rules and index **before enabling the app**. Never use test-mode/allow-all rules.
5. Copy `.env.example` to `.env.local` for local development. Fill the four `VITE_FIREBASE_*` web configuration entries from Firebase’s Web app settings. They are public project identifiers, not admin credentials. Restrict the web API key to the required Firebase APIs and appropriate website referrers where compatible with your Auth setup. Security comes from Auth, rules and App Check, not hiding a web API key.
6. For Pages, open **GitHub → Settings → Secrets and variables → Actions → Variables**, and create `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, and `VITE_FIREBASE_APP_ID` with the same public values. Re-run the deployment workflow. Do not put a service-account key in any `VITE_` variable: Vite embeds these values in public JavaScript.

### Deploy rules and indexes yourself

Install the Firebase CLI using its official instructions (https://firebase.google.com/docs/cli), then from this folder run:

```sh
firebase login
firebase use --add
# Select your real project carefully.
firebase deploy --only firestore:rules,firestore:indexes
```

Wait for the composite leaderboard index to finish building in the Firebase console. It orders correct answers descending, score descending and answer time ascending. Test once with a fresh student browser and once with an explicitly authorized teacher. An enabled Firebase config does not prove the backend is reachable or correctly configured. Network errors and index/rule errors are shown as unavailable states, and results can be retried.

### Give a teacher an explicit role

1. Create a teacher account under **Firebase Authentication → Users → Add user** with an email and strong password. Keep that password private.
2. An administrator must assign the custom claim **`teacher: true`** using the Firebase **Admin SDK** from a trusted local terminal, Cloud Shell, or your existing admin service. Students cannot grant this role. For example, in an administrator-only Node.js project with `firebase-admin` installed and Application Default Credentials configured, run:

```js
// Run only in a trusted administrator environment, never in this web app.
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
initializeApp({ credential: applicationDefault(), projectId: 'YOUR_PROJECT_ID' });
const uid = 'TEACHER_UID_FROM_FIREBASE_AUTH';
const user = await getAuth().getUser(uid);
await getAuth().setCustomUserClaims(uid, { ...user.customClaims, teacher: true });
```

Run the snippet inside an async function or a Node REPL supporting top-level await. Use your organization’s supported admin authentication; do not paste credentials into chat or commit them. Only existing custom claims are preserved; review the target UID carefully. See https://firebase.google.com/docs/auth/admin/custom-claims.

3. Visit **Teacher HQ** (`#/teacher`) and sign in. Sign out/in after changing claims. The UI checks the claim and Firestore rules independently enforce it. A student who opens the route cannot fetch the participation list.
4. The dashboard loads stored attempts in authorized pages of **1,000 per query**, searchable by name/class/UID and sortable by time, name or score, with CSV export of the filtered rows. Statistics describe the complete records loaded at the last refresh: Firebase identity count, attempt count, mean points and perfect attempt count. Large databases require more reads; use sensible retention policies. A UID is not proof of a unique student. Timestamps are stored as Firestore server timestamps and displayed/exported in **Asia/Kuala_Lumpur**; the certificate displays the device’s completion time in that zone. CSV cells are quoted and dangerous formula prefixes escaped.

### App Check and abuse resistance

Register your web app with Firebase **App Check → reCAPTCHA v3**, register all production and development hostnames, and add its **public site key** as `VITE_FIREBASE_APPCHECK_SITE_KEY` locally and in GitHub Actions Variables. Rebuild and monitor App Check metrics before enforcing it for Firestore (and Authentication where supported by your project). Never put a reCAPTCHA secret or debug token in client code. App Check debug tokens, if needed in development, belong only in the console and a temporary development configuration; this app does not enable debug tokens automatically.

Rules allow immutable attempts only for the authenticated UID; the attempt and private rate-limit record are written atomically. There is at most **one new submission per UID per 60 seconds**, based on server time. Retrying a successful attempt uses its existing session UUID and does not create another record. Leaderboard updates must match a stored attempt and improve the existing best result. Public records expose only nickname, avatar, UID, attempt UUID and performance; **class is never public**. Player rate-limit records are private. Only a teacher role can list attempts. Client-side submission has an additional single-flight lock.

**These controls do not verify gameplay.** A modified client can fabricate a plausible score, and an attacker can create new anonymous identities. App Check reduces some abuse but does not make client scores trusted. There is no secure server-side question/timing verification backend in this version. For trusted competitions, implement a callable Cloud Function/other trusted service that issues one-time session tokens, validates answers and server-side timing, enforces anti-replay and project-wide rate limits, and is the sole writer of leaderboard records; then deny all direct client score writes. Do not describe these scores as verified. Keep quotas, budget alerts, teacher access and retention policies under review.

### Privacy, retention and fallbacks

- Explain to students that nicknames and scores may be public. Optional classes and attempts are visible only to authorized teachers; avoid unnecessary personal data. This is an educational activity, not a current air quality report or medical advice.
- The current/pending session is stored as `haze-heroes-session-v1` in this browser’s local storage. It includes the nickname, optional class, answers and completion data. Browser storage can fail; the UI then warns that refresh recovery is unavailable.
- With an unavailable database, a completed result remains local. **Retry submission** resends that same immutable UUID. Automatic submission occurs on completion/restoring a result when configured. It never claims success without a confirmed Firestore transaction. Play Again discards the local previous result, so screenshot/download or retry first. There is only one saved session; this is not an unlimited submission queue.
- An existing attempt’s owner UID must match before resubmission. If a teacher signs into the same browser identity, an old student attempt cannot be resubmitted as that teacher. Separate teacher/student browser profiles are recommended.
- The app works without backend connectivity after it is loaded. It is **not a service worker/PWA** and does not guarantee a first visit or reload without an internet connection.
- Teachers/admins should delete old attempt, leaderboard and private player documents through a trusted admin process or the Firebase console according to school policy. Client deletes are denied, including to teacher accounts. Removing a public best may require recomputing it from remaining attempts in a trusted service. Set budget alerts and monitor anonymous Auth usage.

## 4. Checks and project structure

```sh
npm test            # scoring, question uniqueness, randomized choices, state guards,
                    # haze boundaries, finish conditions, restore and ranking ties
npm run build       # strict TypeScript check + production Vite build
npm run preview     # manually inspect the production build
```

- `src/game.ts`: pure vocabulary, session validation, scoring and ranking.
- `src/App.tsx`, `src/Scene.tsx`, `src/styles.css`: responsive game, inline SVG city, saved progress, accessible controls and reduced motion.
- `public/avatars/*.svg`: four original bundled superhero illustrations (two boys, two girls); choice has no scoring effect.
- `src/certificate.ts`: reliable local canvas PNG export.
- `src/online.ts`, `src/Teacher.tsx`: anonymous Auth, atomic submissions, best-per-UID leaderboard, role-protected teacher view.
- `firestore.rules`, `firestore.indexes.json`, `firebase.json`: restricted database configuration.
- `.github/workflows/pages.yml`: test, build and GitHub Pages publication after you push.

Firestore emulator checks, when available, are documented in `tests/README.md`. A deployment still needs a real-project end-to-end check with your domains, teacher role and App Check settings. No real Firebase credentials, external project configuration or external deployment is included.
