import BatteryLevelModule from './src/BatteryLevelModule';

export type { BatteryLevelModuleInterface } from './src/BatteryLevel.types';

/**
 * Reads the device's battery level.
 *
 * Resolves to a whole percentage (0-100), or `null` when the platform cannot
 * report one — the iOS Simulator, web, or an Android build whose battery
 * service returns nothing usable.
 *
 * Never rejects: an unavailable reading is an expected outcome, not an error,
 * and forcing every caller into a try/catch for the normal case would be worse
 * than a nullable return.
 */
export async function getBatteryLevel(): Promise<number | null> {
  try {
    return await BatteryLevelModule.getBatteryLevel();
  } catch {
    return null;
  }
}
