# Field Reports

A React Native application for viewing and filing field reports, with a custom native Android module for reading battery level.

Built for the Senior Mobile Developer take-home exercise, against a four-hour budget. That budget is the context for the tradeoffs below: what is missing is missing on purpose, and each cut is named.

---

## What it does

| Screen | Behaviour |
|---|---|
| **Report list** | Fetches reports from `jsonplaceholder.typicode.com/posts`. Shows ID, title, and a body preview. Loading, error (with retry), and empty states. Pull to refresh. Reports created on-device appear at the top, badged. |
| **Report detail** | Full title, full body, report ID. Shows attached device information when the report has any. |
| **Create report** | Title and description with live validation. Submit disabled until valid. Optional **Attach Device Information**. Confirmation on submit. |

**Native module:** battery level is read by a hand-written Kotlin module (`modules/battery-level`), not a third-party library. OS, OS version, and device model come from `expo-device`.

---

## Setup

**Requirements**

- Node 20+ (developed on 22.20)
- JDK 17
- Android SDK **36** with build-tools 36, and `ANDROID_HOME` set
- An Android emulator or a device with USB debugging enabled

Toolchain setup is OS-specific and better covered upstream than restated here —
Expo's [Set up your environment](https://docs.expo.dev/get-started/set-up-your-environment/)
guide is the canonical version.

Worth confirming before the first build, since every failure below is a slow one:

```bash
node -v            # 20+
java -version      # 17 — the Gradle 9.3.1 wrapper requires 17 or newer
echo $ANDROID_HOME # must be set, and the SDK must have platform 36 installed
```

Then install dependencies:

```bash
npm install
```

## Build and run

This project uses Expo with **Continuous Native Generation** — `android/` and `ios/` are generated build output and are not committed. The first run generates them.

```bash
npm run android      # expo run:android — prebuilds, compiles, installs, starts Metro
```

The first build takes 5–10 minutes (Gradle downloads dependencies). Subsequent builds are seconds. After the first build, `npm start` alone is enough for JavaScript changes; only native changes require a rebuild.

> **Expo Go will not work.** It cannot load a custom native module. `expo run:android` produces a development build that includes the Kotlin module while keeping Metro hot reload.

**iOS**

```bash
npm run ios
```

The app builds and runs on iOS, but battery level reports as unavailable there — see [Native module](#native-module) below.

**Other commands**

```bash
npm test         # unit tests
npm run typecheck
npm run lint     # eslint-config-expo; warnings fail the run
npm run lint:fix
```

**If the Android build fails**

Two failure modes are worth knowing, both encountered while building this project:

- `Could not add entry ... to cache executionHistory.bin` — the disk is full. Gradle cannot write its cache.
- `Cannot lock execution history cache ... already locked by this process` — a stale Gradle daemon. Fix with `cd android && ./gradlew --stop && rm -rf .gradle`.

---

## Architecture

```
src/
  features/
    reports/          api, hooks, components, screens, store, types, validation
    device/           hooks, components, types
  shared/             theme, query client, Screen, TextField, Button, state views
  navigation/         typed root stack
modules/
  battery-level/      local Expo module — Kotlin, Swift, TypeScript
```

Feature-first rather than layer-first: the app has two domains, and the next ten screens would be new features, not new layers.

### Key decisions

**Hooks are the seam between data and view.** No screen fetches, merges, or caches anything itself. Each feature keeps three separate layers:

| Layer | Owns | Example |
|---|---|---|
| `api/`, `store/` | Talking to the network, holding client state | `fetchReports`, `localReportsStore` |
| `hooks/` | Turning those sources into exactly what a screen needs | `useReportList`, `useReport`, `useDeviceSnapshot` |
| `screens/`, `components/` | Layout, styling, and navigation only | `ReportListScreen`, `ReportCard` |

`ReportListScreen` calls `useReportList()` and gets back `{ reports, isPending, isError, refetch, isRefetching }`. It does not know that two stores exist, that one is a query cache and the other a reducer, or in what order they merge — that lives in the hook. When persistence lands, the merge gains a third source and the screen does not change.

The same split makes the awkward cases cheap. `useReport(id)` reuses the merged list rather than re-deriving it, so the detail screen can take an id as its route param instead of a whole entity. `useDeviceSnapshot` hides two very different sources — `expo-device` and a Kotlin native module — behind one `capture()` call, and turns a native-bridge rejection into `error` state; the component renders three fields and a button.

It also decides what is testable. Data logic that ends up in a hook can be pulled one step further into a plain function — schema parsing, form validation, body preview — and tested with no renderer, no providers, and no network mocks. That is why 30 tests cost almost no setup.

Deliberately *not* a formal container/presentational split. Screens still hold their own navigation callbacks and their own loading and error branching, because that is presentation logic — which spinner to show is a view decision, not a data one.

**Expo with CNG.** `android/` and `ios/` are gitignored build output. The alternative — committing native folders — turns every React Native upgrade into a manual three-way merge against `project.pbxproj` and `build.gradle`. With CNG the upgrade is a regeneration, and intentional native changes live in config plugins as reviewable JavaScript. The tradeoff is an integration tax: a third-party SDK without a published plugin means writing one. I would go bare for app extensions, brownfield integration, or a regulated build that must commit an auditable native project.

**React Navigation directly, not expo-router.** An explicit typed navigator makes the navigation structure and its type safety visible in one file. A global type augmentation makes the root param list the default, so a wrong route name or wrong params is a compile error anywhere in the app.

**Route params are ids, not entities.** The detail screen receives `{ reportId }` and reads the full record from the cache. Navigation state is serialisable and restorable, so params must stay small — and the same screen then works for both server-fetched and locally-created reports.

**Server state and client state are separate.** TanStack Query owns the fetched reports; a Context reducer owns reports created on-device. They are merged only at the point of use. Writing user-created reports into the query cache would let a background refetch silently discard them — keeping them in their own store makes that structurally impossible.

**Neither Redux nor MobX.** Both are built for client state that many parts of an app read and write in complicated ways. Here the client state is one list that one screen appends to — a reducer behind Context covers it without a store, action types, or selectors. The genuinely hard problem in this app is not client state at all; it is caching remote data, which is a different problem with a different tool. TanStack Query supplies request deduplication, staleness, background refetch, retry, cancellation on unmount, and the `isPending`/`isError`/`isRefetching` distinction the list screen depends on to avoid blanking out under the user. Hand-rolling that is a few hundred lines of subtle state machine whose bugs are quiet ones — a stale render, a refetch racing an unmount. For a single endpoint it is arguably more machinery than strictly needed; what earns its place is that the loading and error behaviour the brief asks for is exactly the part it gets right. The known limit of the Context half is that one provider re-renders every consumer on write — invisible at one list and one writer, and fixed by splitting the context or moving to a selector-based store when it isn't.

**The API response is parsed, not cast.** `res.json()` returns `any`. A zod schema validates at the network boundary and the domain type is inferred from it, so `Report` is true at runtime rather than asserted. A server that starts returning ids as strings fails at the boundary with a clear message instead of somewhere unrelated later.

**Fetch errors are typed by kind** — `network`, `http`, `malformed` — each with its own user-facing copy. Telling someone to check their connection when the server returned bad JSON is actively misleading.

**Errors and spinners only when there is nothing to show.** A failed background refetch leaves the existing list on screen rather than replacing it with an error, so a refresh that fails offline never costs the user the reports they were reading. The missing half is a non-blocking surface for that failure — a banner or toast — without which a failed refresh is currently indistinguishable from a successful one. That is the next thing I would add here.

**Validation is a pure function.** Two fields, no async rules, no cross-field dependencies — a form library would be weight without benefit. Validation runs on every keystroke so the submit button is always accurate, but errors only *display* for fields the user has left, so the form does not scold someone mid-typing.

**Styling is `StyleSheet` plus a token module.** No styling library means no extra Babel or Metro configuration to break. The UX effort went into safe-area insets, keyboard avoidance, 44dp touch targets, and real empty and error states.

### Native module

`modules/battery-level` is a local Expo module — it lives outside the generated native folders, so regenerating them never touches it, and prebuild autolinks it.

`getBatteryLevel()` resolves to a whole percentage or `null`. An unavailable reading is an expected outcome, not an error, so it resolves to `null` rather than rejecting — a nullable return beats forcing every caller into a `try`/`catch` for the normal case. It rejects in exactly one case: the native module is missing the function entirely, which means the JavaScript and native definitions have drifted. That is a programming error, and failing loudly is what keeps it from degrading into a permanent, silent "Not available". Every platform-dependent field is nullable rather than optional, and the UI renders `null` as an explicit "Not available" — never as a zero or a dash that could be mistaken for a reading.

**Android** reads the sticky `ACTION_BATTERY_CHANGED` broadcast, falling back to `BatteryManager.BATTERY_PROPERTY_CAPACITY`.

That ordering is deliberate, and it fixes a bug. The direct property is the more obvious implementation and it appeared to work — the emulator reported 100%. But with the emulator battery set to 37% it *still* reported 100%: `BATTERY_PROPERTY_CAPACITY` ignores emulated battery state and returns 100 unconditionally. The sticky broadcast is available on every API level, reflects emulated state, and matches hardware, so it became the primary source. (Note also that `adb shell dumpsys battery set level` moves the broadcast but not the property — the two can disagree.)

**iOS** returns `null` on the Simulator rather than surfacing `UIDevice.batteryLevel`'s `-1.0` sentinel, which a caller would render as "-100%". On physical hardware it returns a real percentage. Verified: the project builds for iOS (`pod install` + `xcodebuild`, Swift compiles for both architectures) and the Simulator renders battery as "Not available" while OS, version, and model populate normally. The exercise required only one platform; Android was chosen as the one that can actually be demonstrated. The iOS implementation exists so the JavaScript contract is identical on both platforms and callers never branch on `Platform.OS`.

### Where "Attach Device Information" lives

The brief says to display device information "with the report" without specifying a screen. I read this as **provenance captured at filing time**, so the button is on the create form and the display is on the detail screen.

The domain is field reports: device metadata is meaningful as a record of the conditions a report was filed under — which handset, running what, with how much battery left. Attaching *today's* battery level to a report authored by someone else is not information about anything.

This is encoded in the type system: `device` is optional and exists only on the local branch of the `Report` union, so a server-authored report can never carry one.

**Consequence worth flagging:** to see the feature you must create a report first — the button does not appear on the 100 fetched reports.

---

## Testing

```bash
npm test
```

30 tests across 4 suites, chosen for the highest ratio of confidence to setup cost — no renderer, no provider wrapper, no network mocking.

**Pure functions at module boundaries**

- **API schema** — accepts valid payloads; rejects missing fields, wrong-typed fields, and non-list responses
- **Form validation** — required, whitespace-only, minimum and maximum length, trimming before measuring, per-field independence
- **Body preview** — passthrough, newline collapsing, word-boundary truncation, mid-word fallback, exact-limit boundary

**Native module contract** (`modules/battery-level/contract.test.ts`)

The module name and function names are plain strings duplicated across TypeScript, Kotlin, and Swift, with no compiler checking that they agree. A mismatch is a runtime failure on one platform only — the kind that ships because the other platform still works.

Jest cannot exercise the real bridge, since `requireNativeModule` needs a native runtime. So this test reads the Kotlin and Swift sources off disk and asserts every implementation declares the same contract as the TypeScript side, plus that the autolinking config still points at the right classes. It runs in CI with no device attached.

Verified to fail, not just to pass: renaming the function in Kotlin, renaming it in Swift, and changing the name passed to `requireNativeModule` each break a distinct assertion.

**Native module behaviour** (`modules/battery-level/index.test.ts`)

With the native module mocked, covers the distinction that matters: an *unavailable reading* is a normal outcome and returns `null`, while a *broken bridge* is a programming error and throws. Collapsing those two is what would let a renamed native function degrade silently to a permanent "Not available".

---

## Tradeoffs

Written against a four-hour budget. Each of these was a deliberate cut, not an oversight.

| Cut | Reasoning |
|---|---|
| **No persistence** | The brief permits local state. Persistence adds a rehydration loading state, serialisation, and merge-order questions — real cost against a four-hour budget, for behaviour the exercise does not ask for. |
| **No pagination** | 100 items; `FlatList` virtualises them without strain. |
| **No component or E2E tests** | Highest setup cost, and testing is not in the brief. Pure-function coverage buys most of the confidence for a fraction of the time. |
| **No dark mode, i18n, or CI** | Not requested; cut for budget. |
| **iOS battery is a stub on Simulator** | Cannot be demonstrated there at all; the brief requires one platform. |
| **No editing or deleting reports** | Not requested. |

---

## What I would improve with more time

1. **Persistence with a sync queue.** MMKV rather than AsyncStorage, for synchronous rehydration — AsyncStorage's async read causes a visible flash of empty state on cold start. Created reports modelled as a queue with `pending | syncing | synced | failed` status so the UI can show sync state per report, with TanStack's `persistQueryClient` for the server cache and a mutation queue that replays on reconnect.

   Two details that decide whether a queue like that is correct rather than merely present. **An idempotency key minted on the client** — a UUID per report at creation, deduped server-side — because a POST can succeed and still time out, and the retry then files the report twice. And a **client-id to server-id remap**: the queue creates #1001 locally, the server assigns #5738, and every reference to the old id — navigation state, queued edits, attachments — has to move with it. Retries also need to distinguish what is retryable: backoff with jitter on network errors and 5xx, stop and mark `failed` on a 4xx, since retrying a validation error forever is a battery drain wearing a resilience costume.
2. **Observability — an error boundary, crash reporting, and structured logs.** Today an unhandled render throw takes the whole tree down: React unmounts on error, so the user gets a blank screen and I get nothing. Two boundaries with different jobs fix that. Per-screen — folded into `Screen`, or via the navigator's `screenLayout` — so a failed screen falls back to a retry inside the content area with the header, the back button, and every other screen still alive. Then a root boundary above the navigator as a last-resort net, since a throw in the navigator or the providers themselves is invisible to any boundary below it. Global-only would be the weaker choice: it discards all navigation state and every working screen for a fault in one, and "restart the app" is not a retry. Sentry's React Native SDK then captures both the JavaScript throw and native crashes out of the Kotlin module, symbolicated as long as source maps are uploaded against a matching release and dist.

   The part worth being precise about is that the error taxonomy is already the right shape for this. `ReportsError` distinguishes `network`, `http`, and `malformed`, so those become telemetry dimensions rather than one undifferentiated "fetch failed" count — and a spike in `malformed` means the server contract changed, which is a completely different page from a spike in `network`. The discipline that goes with it: report bodies and attached device snapshots are user content, so breadcrumbs carry ids and error kinds, never payloads.
3. **Component tests.** React Native Testing Library over the list's loading, error, and empty states with a mocked query client, plus a Maestro flow for create → confirm → appears in list.
4. **Pagination.** `useInfiniteQuery` against `?_page&_limit`, with `getItemLayout` and memoised rows once the list is long enough to matter — or FlashList, which recycles cells instead of virtualising them, if profiling shows `FlatList` dropping frames.
5. **The iOS half of the native module, on hardware.** The implementation is written; it needs a physical device and a provisioning profile to verify.
6. **Dark mode.** `useColorScheme` plus a second palette in the token module — the tokens are already centralised for it.
7. **CI.** Typecheck, tests, and a debug build on every pull request.
8. **Environment-specific configuration.** The API base URL is currently a constant in `fetchReports.ts`. That is honest for a single public endpoint, and wrong the moment there is a dev/staging/production split: `.env` files read by Expo CLI, with per-profile `env` blocks in `eas.json` so a build's target is a property of the build rather than of whoever ran it. The part worth being precise about is that `EXPO_PUBLIC_` variables are *inlined into the JavaScript bundle at build time* — they are configuration, not secrets, and are readable by anyone who unzips the app. Anything genuinely sensitive stays server-side or in Keychain/Keystore and is never bundled. (The older pattern of populating `extra` in `app.config.js` and reading it back through `expo-constants` is legacy as of current SDKs.)
9. **Richer device metadata.** Charging state, low-power mode, available storage, and network type are all useful provenance for a field report and all sit behind the same capture action.
10. **OTA updates with EAS Update.** JavaScript-only fixes ship over the air in minutes, skipping store review. Native changes — like the battery module — still require a full release, so the module's contract test suite is what makes OTA safe: it catches JS/native drift before an update pushes it to every device.
11. **Accessibility audit.** Dynamic Type support (the fixed `fontSize` tokens currently ignore the user's text-size setting), a VoiceOver/TalkBack pass, and contrast checks.
