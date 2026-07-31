import { NativeModule, registerWebModule } from 'expo';

import type {
  BatteryLevelModuleEvents,
  BatteryLevelModuleInterface,
} from './BatteryLevel.types';

/**
 * Web has a Battery Status API, but it is unavailable in Safari and Firefox and
 * is being removed on privacy grounds. Returning null keeps the contract honest
 * rather than shipping a value that only works in one browser.
 */
class BatteryLevelWebModule
  extends NativeModule<BatteryLevelModuleEvents>
  implements BatteryLevelModuleInterface
{
  async getBatteryLevel(): Promise<number | null> {
    return null;
  }
}

export default registerWebModule(BatteryLevelWebModule, 'BatteryLevelModule');
