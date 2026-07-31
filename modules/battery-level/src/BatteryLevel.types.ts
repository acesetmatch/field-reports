/**
 * Public contract of the BatteryLevel native module.
 *
 * `null` means the platform could not answer — the iOS Simulator, or an Android
 * build whose battery service reports nothing usable. It never means 0%.
 */
export type BatteryLevelModuleEvents = Record<never, never>;

export type BatteryLevelModuleInterface = {
  /** Whole percentage 0-100, or null when unavailable on this platform. */
  getBatteryLevel(): Promise<number | null>;
};
