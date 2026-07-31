import * as Device from 'expo-device';
import { useCallback, useState } from 'react';
import { Platform } from 'react-native';

import { getBatteryLevel } from '../../../../modules/battery-level';
import type { DeviceSnapshot } from '../types';

/**
 * Captures platform information on demand.
 *
 * Two sources behind one interface: OS, version, and model come from
 * `expo-device` (a maintained cross-platform library — reimplementing it
 * natively would be busywork), while battery level comes from the local Kotlin
 * module, which is where writing native code actually earns its place.
 *
 * Deliberately not captured on mount. The snapshot records conditions at the
 * moment the user chose to attach it, so a stale battery reading would be
 * misleading.
 */
export function useDeviceSnapshot() {
  const [snapshot, setSnapshot] = useState<DeviceSnapshot | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const capture = useCallback(async () => {
    setIsCapturing(true);
    setError(null);
    try {
      // Throws only if the native bridge is broken — an unavailable reading
      // comes back as null. Surfaced as screen state rather than an unhandled
      // rejection so the failure is visible instead of silent.
      const batteryLevel = await getBatteryLevel();

      const captured: DeviceSnapshot = {
        os: Device.osName ?? Platform.OS,
        osVersion: Device.osVersion ?? null,
        // Null rather than a placeholder string: "we asked and the platform had
        // no answer" is information the UI should render differently from a
        // real model name.
        model: Device.modelName ?? null,
        batteryLevel,
        capturedAt: new Date().toISOString(),
      };

      setSnapshot(captured);
      return captured;
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Could not read device information.',
      );
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, []);

  return { snapshot, isCapturing, error, capture };
}
