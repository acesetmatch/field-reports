import ExpoModulesCore
import UIKit

/**
 Battery level for iOS.

 Returns nil on the Simulator: `UIDevice.batteryLevel` reports -1.0 there
 unconditionally, and surfacing that as a reading would be worse than admitting
 the value is unavailable — a caller would render "-100%".

 On physical hardware this returns a real percentage. The exercise required only
 one platform, and Android was chosen as the one that can actually be
 demonstrated (see README's "Native module" section), so this exists for
 interface parity: the JavaScript contract is identical on both platforms and
 callers never branch on `Platform.OS`.
 */
public class BatteryLevelModule: Module {
  public func definition() -> ModuleDefinition {
    Name("BatteryLevel")

    AsyncFunction("getBatteryLevel") { () -> Int? in
      let device = UIDevice.current

      // Battery monitoring is off by default and batteryLevel returns -1 until
      // it is enabled. The previous value is restored so this module does not
      // leave a global device flag flipped for the rest of the app.
      let wasMonitoring = device.isBatteryMonitoringEnabled
      device.isBatteryMonitoringEnabled = true
      defer { device.isBatteryMonitoringEnabled = wasMonitoring }

      let level = device.batteryLevel
      guard level >= 0 else { return nil }

      return Int((level * 100).rounded())
    }
  }
}
