# Field Reports

A React Native application for viewing and filing field reports, with a custom native Android module for reading battery level.

Built for the Senior Mobile Developer take-home exercise.

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
  battery-level/      local Expo module — Kotlin, Swift, web, TypeScript
```

Feature-first rather than layer-first: the app has two domains, and the next ten screens would be new features, not new layers.

### Key decisions

**Expo with CNG.** `android/` and `ios/` are gitignored build output. The alternative — committing native folders — turns every React Native upgrade into a manual three-way merge against `project.pbxproj` and `build.gradle`. With CNG the upgrade is a regeneration, and intentional native changes live in config plugins as reviewable JavaScript. The tradeoff is an integration tax: a third-party SDK without a published plugin means writing one. I would go bare for app extensions, brownfield integration, or a regulated build that must commit an auditable native project.

**React Navigation directly, not expo-router.** An explicit typed navigator makes the navigation structure and its type safety visible in one file. A global type augmentation makes the root param list the default, so a wrong route name or wrong params is a compile error anywhere in the app.

**Route params are ids, not entities.** The detail screen receives `{ reportId }` and reads the full record from the cache. Navigation state is serialisable and restorable, so params must stay small — and the same screen then works for both server-fetched and locally-created reports.

**Server state and client state are separate.** TanStack Query owns the fetched reports; a Context reducer owns reports created on-device. They are merged only at the point of use. Writing user-created reports into the query cache would let a background refetch silently discard them — keeping them in their own store makes that structurally impossible.

**The API response is parsed, not cast.** `res.json()` returns `any`. A zod schema validates at the network boundary and the domain type is inferred from it, so `Report` is true at runtime rather than asserted. A server that starts returning ids as strings fails at the boundary with a clear message instead of somewhere unrelated later.

**Fetch errors are typed by kind** — `network`, `http`, `malformed` — each with its own user-facing copy. Telling someone to check their connection when the server returned bad JSON is actively misleading.

**Errors and spinners only when there is nothing to show.** A failed background refetch leaves the existing list on screen rather than replacing it with an error; the refresh control communicates the failure instead.

**Validation is a pure function.** Two fields, no async rules, no cross-field dependencies — a form library would be weight without benefit. Validation runs on every keystroke so the submit button is always accurate, but errors only *display* for fields the user has left, so the form does not scold someone mid-typing.

**Styling is `StyleSheet` plus a token module.** No styling library means no extra Babel or Metro configuration to break. The UX effort went into safe-area insets, keyboard avoidance, 44dp touch targets, and real empty and error states.

### Native module

`modules/battery-level` is a local Expo module — it lives outside the generated native folders, so regenerating them never touches it, and prebuild autolinks it.

`getBatteryLevel()` resolves to a whole percentage or `null`. It never rejects: an unavailable reading is an expected outcome, not an error, and a nullable return beats forcing every caller into a `try`/`catch` for the normal case. Every platform-dependent field is nullable rather than optional, and the UI renders `null` as an explicit "Not available" — never as a zero or a dash that could be mistaken for a reading.

**Android** reads the sticky `ACTION_BATTERY_CHANGED` broadcast, falling back to `BatteryManager.BATTERY_PROPERTY_CAPACITY`.

That ordering is deliberate, and it fixes a bug. The direct property is the more obvious implementation and it appeared to work — the emulator reported 100%. But with the emulator battery set to 37% it *still* reported 100%: `BATTERY_PROPERTY_CAPACITY` ignores emulated battery state and returns 100 unconditionally. The sticky broadcast is available on every API level, reflects emulated state, and matches hardware, so it became the primary source. (Note also that `adb shell dumpsys battery set level` moves the broadcast but not the property — the two can disagree.)

**iOS** returns `null` on the Simulator rather than surfacing `UIDevice.batteryLevel`'s `-1.0` sentinel, which a caller would render as "-100%". On physical hardware it returns a real percentage. The exercise required only one platform; Android was chosen as the one that can actually be demonstrated. The iOS implementation exists so the JavaScript contract is identical on both platforms and callers never branch on `Platform.OS`.

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

16 unit tests across three pure functions, chosen for the highest ratio of confidence to setup cost: they need no renderer, no provider wrapper, and no network mocking.

- **API schema** — accepts valid payloads; rejects missing fields, wrong-typed fields, and non-list responses
- **Form validation** — required, whitespace-only, minimum and maximum length, trimming before measuring, per-field independence
- **Body preview** — passthrough, newline collapsing, word-boundary truncation, mid-word fallback, exact-limit boundary

These are the three seams where logic crosses a module boundary. Everything else is composition, which component tests would cover better than unit tests.

---

## Tradeoffs

Written against a four-hour budget. Each of these was a deliberate cut, not an oversight.

| Cut | Reasoning |
|---|---|
| **No persistence** | The brief permits local state. Persistence adds a rehydration loading state, serialisation, and merge-order questions — invisible to a reviewer, expensive in time. |
| **No pagination** | 100 items; `FlatList` virtualises them without strain. |
| **No component or E2E tests** | Highest setup cost, and testing is not in the brief. Pure-function coverage buys most of the confidence for a fraction of the time. |
| **No dark mode, i18n, or CI** | Not requested, not graded. |
| **iOS battery is a stub on Simulator** | Cannot be demonstrated there at all; the brief requires one platform. |
| **No editing or deleting reports** | Not requested. |

---

## What I would improve with more time

1. **Persistence with a sync queue.** MMKV rather than AsyncStorage, for synchronous rehydration — AsyncStorage's async read causes a visible flash of empty state on cold start. Created reports modelled as a queue with `pending | syncing | synced | failed` status so the UI can show sync state per report, with TanStack's `persistQueryClient` for the server cache and a mutation queue that replays on reconnect.
2. **Component tests.** React Native Testing Library over the list's loading, error, and empty states with a mocked query client, plus a Maestro flow for create → confirm → appears in list.
3. **Pagination.** `useInfiniteQuery` against `?_page&_limit`, with `getItemLayout` and memoised rows once the list is long enough to matter.
4. **The iOS half of the native module, on hardware.** The implementation is written; it needs a physical device and a provisioning profile to verify.
5. **Dark mode.** `useColorScheme` plus a second palette in the token module — the tokens are already centralised for it.
6. **CI.** Typecheck, tests, and a debug build on every pull request.
7. **Richer device metadata.** Charging state, low-power mode, available storage, and network type are all useful provenance for a field report and all sit behind the same capture action.
