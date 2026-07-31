import BatteryLevelModule from './src/BatteryLevelModule';

export type { BatteryLevelModuleInterface } from './src/BatteryLevel.types';

/**
 * Reads the device's battery level.
 *
 * Resolves to a whole percentage (0-100), or `null` when the platform cannot
 * report one — the iOS Simulator, web, or an Android build whose battery
 * service returns nothing usable.
 *
 * A missing reading is an expected outcome rather than an error, so the normal
 * unavailable case returns null instead of rejecting. A *broken bridge* is not
 * an expected outcome and does reject: the module name and function name are
 * plain strings duplicated across TypeScript, Kotlin, and Swift with nothing
 * type-checking them, so drift between the two sides has to fail loudly.
 * Swallowing it would degrade to a permanent, silent "Not available".
 */
export async function getBatteryLevel(): Promise<number | null> {
  if (typeof BatteryLevelModule?.getBatteryLevel !== 'function') {
    throw new Error(
      'BatteryLevel native module does not expose getBatteryLevel(). The ' +
        'JavaScript and native definitions have drifted — check the function ' +
        'name in BatteryLevelModule.kt / .swift and rebuild the app.',
    );
  }

  try {
    return await BatteryLevelModule.getBatteryLevel();
  } catch (error) {
    // The native side ran and could not produce a reading. Expected on the
    // Simulator and on builds without a battery service; surfaced in dev so it
    // is visible while debugging, but not treated as a failure in production.
    if (__DEV__) {
      console.warn('[battery-level] native read failed', error);
    }
    return null;
  }
}
