/**
 * Platform information captured at the moment a report is filed.
 *
 * Every field that a platform may not be able to answer is nullable rather than
 * optional: "we asked and the platform had no value" is different from "we
 * never asked", and the UI renders those differently.
 */
export type DeviceSnapshot = {
  /** e.g. "Android", "iOS" */
  os: string;
  /** e.g. "16" */
  osVersion: string | null;
  /** e.g. "Pixel 7". Null when the platform does not expose it. */
  model: string | null;
  /** 0–100 integer, or null when the platform/module cannot report it. */
  batteryLevel: number | null;
  /** ISO timestamp of when the snapshot was taken. */
  capturedAt: string;
};
