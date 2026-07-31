import { NativeModule, requireNativeModule } from 'expo';

import type {
  BatteryLevelModuleEvents,
  BatteryLevelModuleInterface,
} from './BatteryLevel.types';

/**
 * Declares the native surface so TypeScript type-checks calls across the
 * bridge. `requireNativeModule` returns `any` without this.
 */
declare class BatteryLevelNativeModule
  extends NativeModule<BatteryLevelModuleEvents>
  implements BatteryLevelModuleInterface
{
  getBatteryLevel(): Promise<number | null>;
}

export default requireNativeModule<BatteryLevelNativeModule>('BatteryLevel');
