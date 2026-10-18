# Validation

## Unit tests

`npm test` runs the game logic tests. `npm run build` checks TypeScript and builds the site.

## Real-browser smoke tests

Start `npm run dev` in another terminal. Then:

```sh
npx playwright install chromium
npm run test:browser
```

If Chromium is already installed, use its path instead of downloading another copy:

```sh
CHROMIUM_PATH=/usr/bin/chromium npm run test:browser
```

Optional `TEST_URL` sets the URL, including a repository subpath and trailing slash. Tests cover an actual perfect mission and all-wrong mission, refresh recovery, answer locks, paused feedback time, haze, certificate PNG download, teacher fallback, viewport widths 320, 390, 768, 1024 and 1440, and automated axe WCAG A/AA scans of welcome, question, feedback, certificate and teacher fallback. Automated checks complement rather than replace keyboard/screen-reader and device testing. Screenshots/PNG are generated in ignored `test-results/`. This smoke suite assumes **local mode**, without Firebase build variables. It is not a live backend test.

## Firestore security emulator

Optional tooling stays outside the frontend dependencies. Requires Node 22.12+ and Java 21+:

```sh
npm install --prefix /tmp/haze-security firebase-tools @firebase/rules-unit-testing firebase
HAZE_SECURITY_TOOLS=/tmp/haze-security \
  /tmp/haze-security/node_modules/.bin/firebase emulators:exec \
  --only firestore --project demo-haze-heroes 'node tests/security.mjs'
```

On a cloud host with a read-only home, set `XDG_CONFIG_HOME=/tmp/haze-firebase-config` and `FIREBASE_EMULATORS_PATH=/tmp/haze-emulators` on that command; use `--cache /tmp/haze-npm-cache` for npm. The emulator download requires **storage.googleapis.com**. No credentials or production project are needed: `demo-haze-heroes` is deliberately an emulator-only project. The script never deploys rules or changes an external service.

The security tests check atomic valid submissions, private attempts, authorized teacher reads, private player documents, bounded public queries, immutable attempts, cooldowns, score limits, no public classes, identity spoofing and best-score replacement. Test output must say checks passed; the presence of the test script is not proof it executed. In the initial cloud environment the emulator artifact download was blocked with HTTP 403 by the network proxy; the security suite was therefore **not executed**. Run it after allowing the official download domain, and still verify the real project's Auth/App Check/rules/index configuration before using shared records with students.
