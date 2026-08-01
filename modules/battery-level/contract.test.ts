import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Cross-language contract test for the BatteryLevel native module.
 *
 * The module name and each function name are plain strings duplicated across
 * TypeScript, Kotlin, and Swift. No compiler checks that they agree, and a
 * mismatch is a runtime failure on one platform only — the kind of bug that
 * ships because the other platform still works.
 *
 * A unit test cannot exercise the real bridge: `requireNativeModule` needs a
 * native runtime that Jest does not have. What it *can* do is read the source
 * of all four implementations and assert they declare the same contract, which
 * is where the drift actually happens. This runs in CI with no device.
 *
 * The constants below are the contract. Changing one platform without changing
 * this list fails the build.
 */

const MODULE_NAME = 'BatteryLevel';
const FUNCTION_NAMES = ['getBatteryLevel'] as const;

const moduleRoot = __dirname;

const read = (...segments: string[]) =>
  readFileSync(join(moduleRoot, ...segments), 'utf8');

const sources = {
  kotlin: read(
    'android/src/main/java/expo/modules/batterylevel/BatteryLevelModule.kt',
  ),
  swift: read('ios/BatteryLevelModule.swift'),
  typescript: read('src/BatteryLevelModule.ts'),
  web: read('src/BatteryLevelModule.web.ts'),
  types: read('src/BatteryLevel.types.ts'),
};

/** Both Expo native DSLs spell the module name the same way: `Name("…")`. */
function nativeModuleName(source: string): string | null {
  return source.match(/Name\(\s*"([^"]+)"\s*\)/)?.[1] ?? null;
}

/** `AsyncFunction("…")` / `Function("…")` declarations, in file order. */
function nativeFunctionNames(source: string): string[] {
  return [...source.matchAll(/(?:Async)?Function\(\s*"([^"]+)"\s*\)/g)].map(
    (match) => match[1],
  );
}

describe('BatteryLevel native module contract', () => {
  describe('module name', () => {
    // Only one %s in the title: a second would be filled with the entire
    // source file, which makes the reporter output unreadable.
    it.each([
      ['Kotlin', sources.kotlin],
      ['Swift', sources.swift],
    ])('%s declares the contracted module name', (_platform, source) => {
      expect(nativeModuleName(source)).toBe(MODULE_NAME);
    });

    it('TypeScript requires the same module name', () => {
      // The string passed to requireNativeModule is what actually resolves the
      // native module at runtime; a typo here fails on every platform at once.
      const required = sources.typescript.match(
        /requireNativeModule<[^>]+>\(\s*'([^']+)'\s*\)/,
      )?.[1];

      expect(required).toBe(MODULE_NAME);
    });
  });

  describe('function names', () => {
    it.each([
      ['Kotlin', sources.kotlin],
      ['Swift', sources.swift],
    ])('%s exposes exactly the contracted functions', (_platform, source) => {
      expect(nativeFunctionNames(source).sort()).toEqual(
        [...FUNCTION_NAMES].sort(),
      );
    });

    it.each(FUNCTION_NAMES)(
      'the shared type declares %s',
      (functionName) => {
        expect(sources.types).toContain(`${functionName}(`);
      },
    );

    it.each(FUNCTION_NAMES)(
      'the TypeScript native declaration declares %s',
      (functionName) => {
        expect(sources.typescript).toContain(`${functionName}(`);
      },
    );

    it.each(FUNCTION_NAMES)(
      'the web implementation implements %s',
      (functionName) => {
        // Web is a real implementation, not a stub interface: if it stops
        // implementing a contracted function, web callers get `undefined is
        // not a function` rather than a type error.
        expect(sources.web).toContain(`${functionName}(`);
      },
    );
  });

  it('every implementation is reachable from the module config', () => {
    // Autolinking uses this file. A class renamed without updating it builds
    // fine and then fails to register at runtime.
    const config = JSON.parse(read('expo-module.config.json'));

    expect(config.apple.modules).toContain('BatteryLevelModule');
    expect(config.android.modules).toContain(
      'expo.modules.batterylevel.BatteryLevelModule',
    );
  });
});
